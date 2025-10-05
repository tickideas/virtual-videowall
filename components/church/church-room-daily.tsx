"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import DailyIframe, { DailyCall, DailyEventObjectParticipant } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, PhoneOff, Signal } from "lucide-react";

interface ChurchRoomProps {
  token: string;
  roomUrl: string;
  churchName: string;
  serviceName: string;
  onLeave: () => void;
}

export function ChurchRoom({ token, roomUrl, churchName, serviceName, onLeave }: ChurchRoomProps) {
  const callObjectRef = useRef<DailyCall | null>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<"good" | "low" | "very-low">("good");
  const [isJoined, setIsJoined] = useState(false);
  const [connectionError, setConnectionError] = useState<string>("");
  const [reconnecting, setReconnecting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const destroyPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize Daily.co call
  useEffect(() => {
    if (!token || !roomUrl) {
      return;
    }

    let isMounted = true;
    const handleJoinedMeeting = () => {
      if (!isMounted) {
        return;
      }
      console.log("Church: Joined meeting successfully");
      setIsJoined(true);
    };

    const handleLeftMeeting = () => {
      if (!isMounted) {
        return;
      }
      console.log("Church: Left meeting");
      setIsJoined(false);
      onLeave();
    };

    const handleParticipantUpdated = (event: DailyEventObjectParticipant) => {
      if (!isMounted || !event.participant.local) {
        return;
      }
      console.log("Church: Local participant updated", event.participant);
      setIsCameraEnabled(event.participant.video || false);
    };

    const handleNetworkQualityChange = async (event: { threshold: string; quality: number }) => {
      if (!isMounted || !callObjectRef.current) {
        return;
      }
      console.log("Church: Network quality", event.quality);
      const quality = event.quality >= 80 ? "good" : event.quality >= 50 ? "low" : "very-low";
      setConnectionQuality(quality);

      // Dynamically adjust video quality based on network conditions
      if (event.quality < 50 && callObjectRef.current) {
        console.log("Church: Poor network detected, reducing quality");
        try {
          await callObjectRef.current.updateSendSettings({
            video: {
              maxQuality: "low",
              encodings: {
                low: {
                  maxBitrate: 150000, // Further reduce bitrate
                  maxFramerate: 4,
                  scaleResolutionDownBy: 3,
                },
              },
            },
          });
        } catch (error) {
          console.log("Church: Failed to adjust quality", error);
        }
      }
    };

    const handleError = (error: { errorMsg: string; error?: Error }) => {
      console.error("Church: Daily.co error", error);
      const errorMessage = error.errorMsg || "Connection error occurred";
      setConnectionError(errorMessage);

      // Attempt reconnection for certain error types
      if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        setReconnecting(true);
        setTimeout(() => {
          setReconnecting(false);
          setConnectionError("");
        }, 5000);
      }
    };

    const attachListeners = (daily: DailyCall) => {
      daily.on("joined-meeting", handleJoinedMeeting);
      daily.on("left-meeting", handleLeftMeeting);
      daily.on("participant-updated", handleParticipantUpdated);
      daily.on("network-quality-change", handleNetworkQualityChange);
      daily.on("error", handleError);
    };

    const detachListeners = (daily: DailyCall) => {
      daily.off("joined-meeting", handleJoinedMeeting);
      daily.off("left-meeting", handleLeftMeeting);
      daily.off("participant-updated", handleParticipantUpdated);
      daily.off("network-quality-change", handleNetworkQualityChange);
      daily.off("error", handleError);
    };

    const stopStreamTracks = (stream: MediaStream | null) => {
      stream?.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    };

    type VideoConstraintProfile = {
      width: number;
      height: number;
      frameRate: number;
    };

    const getOptimalVideoConstraints = (): VideoConstraintProfile => {
      const navigatorWithConnection = navigator as Navigator & {
        connection?: { effectiveType?: string };
      };
      const effectiveType = navigatorWithConnection.connection?.effectiveType ?? "4g";

      const profiles: Record<string, VideoConstraintProfile> = {
        "slow-2g": { width: 120, height: 90, frameRate: 4 },
        "2g": { width: 160, height: 120, frameRate: 6 },
        "3g": { width: 240, height: 180, frameRate: 8 },
        "4g": { width: 320, height: 240, frameRate: 12 },
      };

      return profiles[effectiveType] ?? profiles["3g"];
    };

    const initializeCall = async () => {
      let acquiredStream: MediaStream | null = null;
      try {
        if (destroyPromiseRef.current) {
          console.log("Church: Waiting for previous Daily call cleanup to finish");
          await destroyPromiseRef.current;
        }

        if (!isMounted) {
          return;
        }

        const videoConstraints = getOptimalVideoConstraints();

        if (!callObjectRef.current) {
          const existingInstance = DailyIframe.getCallInstance?.();
          if (existingInstance) {
            console.log("Church: Destroying leftover Daily call instance before creating new one");
            try {
              await existingInstance.destroy();
            } catch (destroyError) {
              console.error("Church: Failed to destroy leftover call instance", destroyError);
            }
          }

          console.log("Church: Initializing Daily.co call...");
          console.log("Church: Using video constraints", videoConstraints);

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: videoConstraints.width },
              height: { ideal: videoConstraints.height },
              frameRate: { ideal: videoConstraints.frameRate, max: videoConstraints.frameRate },
              facingMode: "user",
            },
            audio: false,
          });

          if (!isMounted) {
            stopStreamTracks(stream);
            return;
          }

          acquiredStream = stream;

          callObjectRef.current = DailyIframe.createCallObject({
            videoSource: stream.getVideoTracks()[0],
            audioSource: false, // Microphone off by default
          });
          acquiredStream = null;
        }

        const daily = callObjectRef.current;
        if (!daily || !isMounted) {
          if (!isMounted) {
            stopStreamTracks(acquiredStream);
          }
          return;
        }

        setCallObject(daily);
        attachListeners(daily);

        console.log("Church: Joining room", roomUrl);
        await daily.join({
          url: roomUrl,
          token,
        });

        if (!isMounted) {
          return;
        }

        // Disable video processors to reduce CPU load
        try {
          await daily.updateInputSettings({
            video: {
              processor: {
                type: "none",
              },
            },
          });
        } catch (error) {
          console.log("Church: Skipping video processor settings (not supported in this browser)", error);
        }

        // Ensure video is on and audio is off
        await daily.setLocalVideo(true);
        await daily.setLocalAudio(false);

        // Set send settings based on video profile
        const sendSettings = {
          video: {
            maxQuality: "low" as const,
            encodings: {
              low: {
                maxBitrate: videoConstraints.width <= 160 ? 200000 : 400000, // Adaptive bitrate
                maxFramerate: videoConstraints.frameRate,
                scaleResolutionDownBy: videoConstraints.width >= 320 ? 1 : 2,
              },
            },
          },
        };

        await daily.updateSendSettings(sendSettings);

        console.log("Church: Camera enabled with adaptive settings", {
          resolution: `${videoConstraints.width}x${videoConstraints.height}`,
          frameRate: videoConstraints.frameRate,
          maxBitrate: sendSettings.video.encodings.low.maxBitrate
        });
      } catch (error) {
        console.error("Church: Failed to initialize call", error);
        stopStreamTracks(acquiredStream);
      }
    };

    initializeCall();

    // Cleanup
    return () => {
      isMounted = false;

      const daily = callObjectRef.current;
      if (daily) {
        detachListeners(daily);
        console.log("Church: Cleaning up call object");
        const destroyPromise = daily.destroy().catch((err) => {
          console.error("Church: Error destroying call object", err);
        });

        destroyPromiseRef.current = destroyPromise;
        destroyPromise.finally(() => {
          if (destroyPromiseRef.current === destroyPromise) {
            destroyPromiseRef.current = null;
          }
        });

        callObjectRef.current = null;
        setCallObject(null);
      }

      setIsJoined(false);
      setIsCameraEnabled(false);

      // Clean up any remaining video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }
    };
  }, [token, roomUrl, onLeave]);

  // Handle video element
  useEffect(() => {
    if (callObject && videoRef.current && isJoined) {
      const updateVideo = () => {
        const localParticipant = callObject.participants().local;
        if (localParticipant?.tracks?.video?.track) {
          console.log("Church: Attaching video track");
          const stream = new MediaStream([localParticipant.tracks.video.track]);
          videoRef.current!.srcObject = stream;
        }
      };

      // Update video immediately
      updateVideo();

      // Listen for track changes
      callObject.on("participant-updated", updateVideo);

      return () => {
        callObject.off("participant-updated", updateVideo);
      };
    }
  }, [callObject, isJoined]);

  const handleLeave = useCallback(async () => {
    if (callObject) {
      await callObject.leave();
    }
    onLeave();
  }, [callObject, onLeave]);

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case "good":
        return "text-green-400";
      case "low":
        return "text-yellow-400";
      case "very-low":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="flex min-h-screen w-screen flex-col bg-black md:h-screen">
      {/* Header Controls */}
      <header className="z-50 bg-gray-900/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-white sm:text-lg">{churchName}</h2>
            <p className="truncate text-xs text-gray-300 sm:text-sm">{serviceName}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-lg bg-white/10 px-3 py-2 sm:flex">
              <Signal className={`h-4 w-4 ${getConnectionQualityColor()}`} />
              <span className="text-sm text-white capitalize">
                {connectionQuality === "very-low" ? "Poor" : connectionQuality}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-2">
              {isCameraEnabled ? (
                <Video className="h-4 w-4 text-green-400" />
              ) : (
                <VideoOff className="h-4 w-4 text-red-400" />
              )}
              <span className="hidden text-xs text-white xs:inline sm:text-sm">
                {isCameraEnabled ? "On" : "Off"}
              </span>
            </div>

            <Button
              onClick={handleLeave}
              variant="destructive"
              size="sm"
              className="px-2 text-xs sm:px-4 sm:text-sm"
            >
              <PhoneOff className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Leave Service</span>
              <span className="sm:hidden">Leave</span>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-2 flex w-full max-w-5xl justify-start px-3 sm:hidden">
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1">
            <Signal className={`h-3 w-3 ${getConnectionQualityColor()}`} />
            <span className="text-xs text-white capitalize">
              {connectionQuality === "very-low" ? "Poor" : connectionQuality}
            </span>
          </div>
        </div>
      </header>

      {/* Video Display */}
      <div className="flex flex-1 flex-col px-2 pb-4 pt-20 sm:px-6 sm:pb-8 sm:pt-28 md:pt-24">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-7xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-8 xl:gap-10">
            <div className="flex-1">
              <div className="aspect-video overflow-hidden rounded-xl bg-gray-900 shadow-2xl max-w-4xl mx-auto lg:max-w-none">
                {isCameraEnabled ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoOff className="w-8 h-8 sm:w-16 sm:h-16 text-gray-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-80 xl:w-96 lg:flex-shrink-0">
              {/* Landscape Mode Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    📱 Best Practice: Use Landscape Mode
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    For optimal video quality on the wall, please place your phone in <strong>landscape (horizontal) mode</strong> on a stand. 
                    This ensures your video fills the 16:9 display properly and provides the best viewing experience for other churches.
                  </p>
                </div>
              </div>
              </div>

              {/* Connection Status and Error Display */}
              <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 text-white text-center">
                {connectionError ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                      <p className="text-sm font-medium text-red-300">Connection Error</p>
                  </div>
                  <p className="text-xs text-red-200">{connectionError}</p>
                  {reconnecting && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                      <p className="text-xs text-gray-300">Attempting to reconnect...</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLeave}
                    className="bg-red-500/20 border-red-400/50 text-white hover:bg-red-500/30 mt-2"
                  >
                    Leave Service
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm sm:text-lg font-medium mb-2">
                    {isJoined ? "You are now live on the video wall!" : "Connecting..."}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-300">
                    Your video is being streamed at low quality (240p @ 8fps) to conserve bandwidth.
                  </p>
                  <p className="text-xs sm:text-sm text-gray-300 mt-2">
                    Audio is muted by default to prevent feedback.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className={`w-2 h-2 rounded-full ${
                      isJoined ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
                    }`}></div>
                    <p className="text-xs text-gray-400">
                      {isJoined ? 'Connected' : 'Establishing connection...'}
                    </p>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
