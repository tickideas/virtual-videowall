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

        // Disable video processors to reduce CPU load when supported
        const supportsProcessors = DailyIframe.supportedBrowser?.().supportsInputMediaProcessors ?? false;
        if (supportsProcessors) {
          await daily.updateInputSettings({
            video: {
              processor: {
                type: "none",
              },
            },
          });
        } else {
          console.log("Church: Skipping video processor settings (not supported in this browser)");
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">{churchName}</h2>
              <p className="text-gray-300 text-sm">{serviceName}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
                <Signal className={`w-4 h-4 ${getConnectionQualityColor()}`} />
                <span className="text-sm text-white capitalize">
                  {connectionQuality === "very-low" ? "Poor" : connectionQuality}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
                {isCameraEnabled ? (
                  <Video className="w-4 h-4 text-green-400" />
                ) : (
                  <VideoOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-white">
                  {isCameraEnabled ? "Camera On" : "Camera Off"}
                </span>
              </div>

              <Button
                onClick={handleLeave}
                variant="destructive"
                size="lg"
              >
                <PhoneOff className="w-5 h-5" />
                Leave Service
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Display */}
      <div className="flex items-center justify-center h-full pt-24 pb-8 px-4">
        <div className="max-w-2xl w-full">
          <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-900">
            {isCameraEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
              />
            ) : (
              <div className="aspect-video flex items-center justify-center">
                <VideoOff className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white text-center">
            <p className="text-lg font-medium mb-2">
              {isJoined ? "You are now live on the video wall!" : "Connecting..."}
            </p>
            <p className="text-sm text-gray-300">
              Your video is being streamed at low quality (240p @ 8fps) to conserve bandwidth.
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Audio is muted by default to prevent feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
