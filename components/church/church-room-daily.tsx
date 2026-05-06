"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import DailyIframe, { DailyCall, DailyEventObjectParticipant } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, PhoneOff, Signal, RefreshCw } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { VIDEO_QUALITY, TIMEOUTS } from "@/lib/constants";

interface ChurchRoomProps {
  sessionId: string;
  healthToken: string;
  token: string;
  roomUrl: string;
  churchName: string;
  serviceName: string;
  onLeave: () => void;
}

export function ChurchRoom({ sessionId, healthToken, token, roomUrl, churchName, serviceName, onLeave }: ChurchRoomProps) {
  const callObjectRef = useRef<DailyCall | null>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<"good" | "low" | "very-low">("good");
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "reconnecting" | "disconnected" | "error">("connecting");
  const [isJoined, setIsJoined] = useState(false);
  const [connectionError, setConnectionError] = useState<string>("");
  const [reconnecting, setReconnecting] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [bandwidthMetrics, setBandwidthMetrics] = useState(() => ({
    upload: 0,
    download: 0,
    packetLoss: 0,
    timestamp: Date.now(),
  }));
  const joinTimeRef = useRef<number | null>(null);
  const reconnectCountRef = useRef(0);
  const manualLeaveRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const destroyPromiseRef = useRef<Promise<void> | null>(null);

  // Helper function to get optimal video constraints based on network
  const getOptimalVideoConstraints = useCallback(() => {
    const navigatorWithConnection = navigator as Navigator & {
      connection?: { effectiveType?: string };
    };
    const effectiveType = navigatorWithConnection.connection?.effectiveType ?? "4g";

    const profileMap: Record<string, typeof VIDEO_QUALITY.PROFILES[keyof typeof VIDEO_QUALITY.PROFILES]> = {
      "slow-2g": VIDEO_QUALITY.PROFILES.SLOW_2G,
      "2g": VIDEO_QUALITY.PROFILES["2G"],
      "3g": VIDEO_QUALITY.PROFILES["3G"],
      "4g": VIDEO_QUALITY.PROFILES["4G"],
    };

    return profileMap[effectiveType] ?? VIDEO_QUALITY.PROFILES["3G"];
  }, []);

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
      logger.church("Joined meeting successfully");
      setIsJoined(true);
      setConnectionStatus("connected");
      setReconnecting(false);
      setConnectionError("");
      joinTimeRef.current = Date.now();
      analytics.trackChurchJoin(serviceName, churchName, true);
    };

    const handleLeftMeeting = () => {
      if (!isMounted) {
        return;
      }
      logger.church("Left meeting");
      setIsJoined(false);
      setConnectionStatus("disconnected");
      const duration = Date.now() - (joinTimeRef.current ?? Date.now());
      analytics.trackChurchLeave(serviceName, churchName, duration);
      if (manualLeaveRef.current) {
        return;
      }
      onLeave();
    };

    const handleParticipantUpdated = (event: DailyEventObjectParticipant) => {
      if (!isMounted || !event.participant.local) {
        return;
      }
      logger.church("Local participant updated", event.participant);
      setIsCameraEnabled(event.participant.video || false);
    };

    const handleNetworkQualityChange = async (event: { threshold: string; quality: number }) => {
      if (!isMounted || !callObjectRef.current) {
        return;
      }
      logger.church("Network quality", event.quality);
      const quality = event.quality >= 80 ? "good" : event.quality >= 50 ? "low" : "very-low";
      setConnectionQuality(quality);

      // Monitor bandwidth metrics
      const stats = await callObjectRef.current.getNetworkStats();
      if (stats) {
        const metrics = {
          upload: stats.stats?.latest?.sendBitsPerSecond || 0,
          download: stats.stats?.latest?.recvBitsPerSecond || 0,
          packetLoss: 0, // Daily.co doesn't provide packet loss directly
          timestamp: Date.now()
        };
        setBandwidthMetrics(metrics);

        // Track connection quality analytics
        analytics.trackConnectionQuality(
          quality,
          (metrics.upload + metrics.download) / 1000, // Convert to kbps
          metrics.packetLoss
        );
      }

      // Dynamically adjust video quality based on network conditions
      if (event.quality < VIDEO_QUALITY.LOW_QUALITY_THRESHOLD && callObjectRef.current) {
        logger.church("Poor network detected, reducing quality");
        try {
          await callObjectRef.current.updateSendSettings({
            video: {
              maxQuality: "low",
              encodings: {
                low: {
                  maxBitrate: VIDEO_QUALITY.POOR_NETWORK_BITRATE,
                  maxFramerate: 4,
                  scaleResolutionDownBy: 3,
                },
              },
            },
          });
        } catch (error) {
          logger.church("Failed to adjust quality", error);
        }
      }
    };

    const handleError = (error: { errorMsg: string; error?: Error }) => {
      logger.error("Church: Daily.co error", error);
      const errorMessage = error.errorMsg || "Connection error occurred";
      setConnectionError(errorMessage);
      setConnectionStatus("error");

      // Track video errors for analytics
      analytics.trackVideoError(errorMessage, 'church_room');

      // Attempt reconnection for certain error types
      if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        reconnectCountRef.current += 1;
        setReconnecting(true);
        setConnectionStatus("reconnecting");
        setTimeout(() => {
          setReconnecting(false);
          setConnectionError("");
          setConnectionStatus(callObjectRef.current ? "connected" : "disconnected");
        }, TIMEOUTS.RECONNECTION_DELAY_MS);
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

    const initializeCall = async () => {
      let acquiredStream: MediaStream | null = null;
      try {
        if (destroyPromiseRef.current) {
          logger.church("Waiting for previous Daily call cleanup to finish");
          await destroyPromiseRef.current;
        }

        if (!isMounted) {
          return;
        }

        const videoConstraints = getOptimalVideoConstraints();

        if (!callObjectRef.current) {
          const existingInstance = DailyIframe.getCallInstance?.();
          if (existingInstance) {
            logger.church("Destroying leftover Daily call instance before creating new one");
            try {
              await existingInstance.destroy();
            } catch (destroyError) {
              logger.error("Church: Failed to destroy leftover call instance", destroyError);
            }
          }

          logger.church("Initializing Daily.co call...");
          logger.church("Using video constraints", videoConstraints);

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: videoConstraints.width },
              height: { ideal: videoConstraints.height },
              frameRate: { ideal: videoConstraints.frameRate, max: videoConstraints.frameRate },
              facingMode: facingMode,
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

        logger.church("Joining room", roomUrl);
        setConnectionStatus("connecting");
        await daily.join({
          url: roomUrl,
          token,
        });

        if (!isMounted) {
          return;
        }

        // Note: Skipping video processor settings as they're not supported in all browsers

        // Ensure video is on and audio is off
        await daily.setLocalVideo(true);
        await daily.setLocalAudio(false);

        // Set send settings based on video profile
        const sendSettings = {
          video: {
            maxQuality: "low" as const,
            encodings: {
              low: {
                maxBitrate: videoConstraints.bitrate,
                maxFramerate: videoConstraints.frameRate,
                scaleResolutionDownBy: videoConstraints.width >= 320 ? 1 : 2,
              },
            },
          },
        };

        await daily.updateSendSettings(sendSettings);

        logger.church("Camera enabled with adaptive settings", {
          resolution: `${videoConstraints.width}x${videoConstraints.height}`,
          frameRate: videoConstraints.frameRate,
          maxBitrate: sendSettings.video.encodings.low.maxBitrate
        });
      } catch (error) {
        logger.error("Church: Failed to initialize call", error);
        stopStreamTracks(acquiredStream);
      }
    };

    initializeCall();

    // Capture ref values for cleanup
    const currentVideoRef = videoRef.current;

    // Cleanup
    return () => {
      isMounted = false;

      const daily = callObjectRef.current;
      if (daily) {
        detachListeners(daily);
        logger.church("Cleaning up call object");
        const destroyPromise = daily.destroy().catch((err) => {
          logger.error("Church: Error destroying call object", err);
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
      setConnectionStatus("disconnected");

      // Clean up any remaining video element
      if (currentVideoRef) {
        currentVideoRef.srcObject = null;
        currentVideoRef.load();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, roomUrl, onLeave, sessionId]); // facingMode is intentionally not included - camera switching is handled separately

  useEffect(() => {
    if (!sessionId || !healthToken) {
      return;
    }

    let isMounted = true;

    const reportHealth = async () => {
      const daily = callObjectRef.current;
      let uploadKbps = Math.round(bandwidthMetrics.upload / 1000);
      const packetLoss = bandwidthMetrics.packetLoss;

      if (daily) {
        try {
          const stats = await daily.getNetworkStats();
          if (stats?.stats?.latest?.sendBitsPerSecond) {
            uploadKbps = Math.round(stats.stats.latest.sendBitsPerSecond / 1000);
          }
        } catch (error) {
          logger.church("Failed to read health stats", error);
        }
      }

      if (!isMounted) {
        return;
      }

      try {
        await fetch("/api/session/health", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            healthToken,
            uploadKbps,
            packetLoss,
            connectionQuality,
            cameraEnabled: isCameraEnabled,
            status: connectionStatus,
            videoStatus: isCameraEnabled ? "ready" : "muted",
            reconnectCount: reconnectCountRef.current,
          }),
        });
      } catch (error) {
        logger.church("Failed to report session health", error);
      }
    };

    void reportHealth();
    const intervalId = setInterval(reportHealth, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [
    bandwidthMetrics.upload,
    bandwidthMetrics.packetLoss,
    connectionQuality,
    connectionStatus,
    isCameraEnabled,
    healthToken,
    sessionId,
  ]);

  useEffect(() => {
    if (!isJoined) {
      return;
    }

    let wakeLock: { release: () => Promise<void> } | null = null;
    let isMounted = true;

    const requestWakeLock = async () => {
      const navigatorWithWakeLock = navigator as Navigator & {
        wakeLock?: {
          request: (type: "screen") => Promise<{ release: () => Promise<void> }>;
        };
      };

      try {
        wakeLock = await navigatorWithWakeLock.wakeLock?.request("screen") ?? null;
      } catch (error) {
        logger.church("Wake lock unavailable", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isMounted && !wakeLock) {
        void requestWakeLock();
      }
    };

    void requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void wakeLock?.release().catch((error) => {
        logger.church("Failed to release wake lock", error);
      });
    };
  }, [isJoined]);

  // Handle video element
  useEffect(() => {
    if (callObject && videoRef.current && isJoined) {
      const updateVideo = () => {
        const localParticipant = callObject.participants().local;
        if (localParticipant?.tracks?.video?.track && videoRef.current) {
          logger.church("Attaching video track");
          const stream = new MediaStream([localParticipant.tracks.video.track]);
          videoRef.current.srcObject = stream;
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
    manualLeaveRef.current = true;
    if (sessionId) {
      await fetch("/api/session/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch((error) => {
        logger.church("Failed to mark session as left", error);
      });
    }
    if (callObject) {
      await callObject.leave();
    }
    onLeave();
  }, [callObject, onLeave, sessionId]);

  const toggleVideo = useCallback(async () => {
    if (!callObject) return;

    try {
      const newState = !isCameraEnabled;
      await callObject.setLocalVideo(newState);
      setIsCameraEnabled(newState);
      logger.church("Video toggled to", newState);
    } catch (error) {
      logger.error("Church: Failed to toggle video", error);
      setConnectionError("Failed to toggle video");
    }
  }, [callObject, isCameraEnabled]);

  const switchCamera = useCallback(async () => {
    if (!callObject || isSwitchingCamera) return;

    setIsSwitchingCamera(true);
    try {
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      const videoConstraints = getOptimalVideoConstraints();

      // Get new video stream with different camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: videoConstraints.width },
          height: { ideal: videoConstraints.height },
          frameRate: { ideal: videoConstraints.frameRate, max: videoConstraints.frameRate },
          facingMode: newFacingMode,
        },
        audio: false,
      });

      // Update the video source in Daily
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        await callObject.setInputDevicesAsync({
          videoSource: videoTrack,
        });
        setFacingMode(newFacingMode);
        logger.church("Camera switched to", newFacingMode);
      }
    } catch (error) {
      logger.error("Church: Failed to switch camera", error);
      setConnectionError("Failed to switch camera");
    } finally {
      setIsSwitchingCamera(false);
    }
  }, [callObject, facingMode, isSwitchingCamera, getOptimalVideoConstraints]);

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
            {/* Prominent Connection Status - Always visible */}
            <div className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
              connectionQuality === "good" ? "bg-green-500/20 border border-green-500/40" :
              connectionQuality === "low" ? "bg-yellow-500/20 border border-yellow-500/40" :
              "bg-red-500/20 border border-red-500/40"
            }`}>
              <Signal className={`h-5 w-5 ${getConnectionQualityColor()}`} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white capitalize">
                    {connectionQuality === "very-low" ? "Poor" : connectionQuality}
                </span>
                <span className="text-xs text-gray-300 capitalize">
                  {connectionStatus}
                </span>
                {bandwidthMetrics.upload > 0 && (
                  <span className="text-xs text-gray-300">
                    {Math.round(bandwidthMetrics.upload / 1000)}kbps
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={toggleVideo}
              variant="ghost"
              size="sm"
              disabled={!isJoined}
              className={`px-2 sm:px-3 ${
                isCameraEnabled 
                  ? 'bg-white/10 hover:bg-white/20' 
                  : 'bg-red-500/20 hover:bg-red-500/30'
              }`}
            >
              {isCameraEnabled ? (
                <Video className="h-4 w-4 text-green-400" />
              ) : (
                <VideoOff className="h-4 w-4 text-red-400" />
              )}
              <span className="hidden ml-1 text-xs text-white sm:inline sm:text-sm">
                {isCameraEnabled ? "On" : "Off"}
              </span>
            </Button>

            <Button
              onClick={switchCamera}
              variant="ghost"
              size="sm"
              disabled={!isJoined || isSwitchingCamera || !isCameraEnabled}
              className="px-2 sm:px-3 bg-white/10 hover:bg-white/20"
              title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
            >
              <RefreshCw className={`h-4 w-4 text-white ${isSwitchingCamera ? 'animate-spin' : ''}`} />
              <span className="hidden ml-1 text-xs text-white sm:inline sm:text-sm">
                {facingMode === "user" ? "Back" : "Front"}
              </span>
            </Button>

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
