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

    const handleNetworkQualityChange = (event: { threshold: string; quality: number }) => {
      if (!isMounted) {
        return;
      }
      console.log("Church: Network quality", event.quality);
      const quality = event.quality >= 80 ? "good" : event.quality >= 50 ? "low" : "very-low";
      setConnectionQuality(quality);
    };

    const handleError = (error: { errorMsg: string; error?: Error }) => {
      console.error("Church: Daily.co error", error);
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
      });
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
          
          // Request camera with low-bandwidth constraints
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 240 },
              height: { ideal: 180 },
              frameRate: { ideal: 8, max: 8 },
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

        // Set send settings for maximum bandwidth savings
        await daily.updateSendSettings({
          video: {
            maxQuality: "low",
            encodings: {
              low: {
                maxBitrate: 400000, // 400 Kbps max
                maxFramerate: 8,
                scaleResolutionDownBy: 1,
              },
            },
          },
        });

        console.log("Church: Camera enabled with low-bandwidth settings (240x180 @ 8fps)");
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
    <div className="h-screen w-screen bg-black">
      {/* Header Controls */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-semibold text-sm sm:text-lg truncate">{churchName}</h2>
              <p className="text-gray-300 text-xs sm:text-sm truncate">{serviceName}</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
                <Signal className={`w-4 h-4 ${getConnectionQualityColor()}`} />
                <span className="text-sm text-white capitalize">
                  {connectionQuality === "very-low" ? "Poor" : connectionQuality}
                </span>
              </div>

              <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/10">
                {isCameraEnabled ? (
                  <Video className="w-4 h-4 text-green-400" />
                ) : (
                  <VideoOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-xs sm:text-sm text-white hidden xs:inline">
                  {isCameraEnabled ? "On" : "Off"}
                </span>
              </div>

              <Button
                onClick={handleLeave}
                variant="destructive"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                <PhoneOff className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Leave Service</span>
                <span className="sm:hidden">Leave</span>
              </Button>
            </div>
          </div>
          
          {/* Mobile-only connection quality indicator */}
          <div className="sm:hidden flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 mt-2 w-fit">
            <Signal className={`w-3 h-3 ${getConnectionQualityColor()}`} />
            <span className="text-xs text-white capitalize">
              {connectionQuality === "very-low" ? "Poor" : connectionQuality}
            </span>
          </div>
        </div>
      </div>

      {/* Video Display */}
      <div className="h-full flex flex-col pt-20 sm:pt-24 pb-4 sm:pb-8 px-2 sm:px-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <div className="rounded-lg sm:rounded-xl overflow-hidden shadow-2xl bg-gray-900 aspect-video">
              {isCameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <VideoOff className="w-8 h-8 sm:w-16 sm:h-16 text-gray-600" />
                </div>
              )}
            </div>
            
            {/* Landscape Mode Notice */}
            <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
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
            
            <div className="mt-4 sm:mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-white text-center">
              <p className="text-sm sm:text-lg font-medium mb-2">
                {isJoined ? "You are now live on the video wall!" : "Connecting..."}
              </p>
              <p className="text-xs sm:text-sm text-gray-300">
                Your video is being streamed at low quality (240p @ 8fps) to conserve bandwidth.
              </p>
              <p className="text-xs sm:text-sm text-gray-300 mt-2">
                Audio is muted by default to prevent feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
