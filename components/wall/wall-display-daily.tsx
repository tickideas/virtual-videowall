"use client";

import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import DailyIframe, { DailyCall, DailyParticipant, DailyEventObjectTrack, DailyEventObjectParticipant } from "@daily-co/daily-js";
import { Activity, ChevronLeft, ChevronRight, Grid3X3, Maximize, Pin, Users, VideoOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { VIDEO_WALL, TIMEOUTS } from "@/lib/constants";

interface WallDisplayProps {
  token: string;
  roomUrl: string;
  serviceName: string;
  sessionCode: string;
}

interface VideoTileProps {
  participant: DailyParticipant;
  callObject: DailyCall | null;
  showDiagnostics: boolean;
  isFocused?: boolean;
  onFocus?: () => void;
  onClearFocus?: () => void;
}

function isWallViewer(participant: DailyParticipant) {
  const name = participant.user_name?.trim().toLowerCase();
  const userId = (participant as { user_id?: string }).user_id?.trim().toLowerCase();

  return name === "viewer" || userId?.startsWith("viewer-") === true;
}

const VideoTile = memo(({
  participant,
  callObject,
  showDiagnostics,
  isFocused = false,
  onFocus,
  onClearFocus,
}: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastFrameAt, setLastFrameAt] = useState<number | null>(null);
  const [frameAgeSeconds, setFrameAgeSeconds] = useState<number | null>(null);
  const [trackState, setTrackState] = useState<string>("unknown");
  const streamRef = useRef<MediaStream | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);

  const handleManualPlay = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }

    try {
      await videoRef.current.play();
      setAutoplayBlocked(false);
    } catch (error) {
      logger.warn("VideoTile: manual play failed", error);
    }
  }, []);

  useEffect(() => {
    if (!callObject || !participant) {
      return;
    }

    logger.wall(`VideoTile [${participant.user_name}]: useEffect triggered - track state:`, participant.tracks?.video?.state);

    // eslint-disable-next-line prefer-const
    let loadingTimeout: NodeJS.Timeout;

    const attemptPlayback = async () => {
      if (!videoRef.current) {
        logger.wall(`VideoTile [${participant.user_name}]: No video ref for playback`);
        return;
      }

      try {
        videoRef.current.defaultMuted = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.setAttribute("muted", "muted");
        videoRef.current.setAttribute("playsinline", "true");

        logger.wall(`VideoTile [${participant.user_name}]: Attempting playback`);
        await videoRef.current.play();
        logger.wall(`VideoTile [${participant.user_name}]: Playback started successfully`);
        setAutoplayBlocked(false);
        setConnectionStatus('connected');
      } catch (error) {
        logger.warn(`VideoTile [${participant.user_name}]: Autoplay blocked or playback failed`, error);
        setAutoplayBlocked(true);
        setConnectionStatus('disconnected');
      }
    };

    const cleanupStream = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }

      // Remote Daily tracks are owned by the call object. Detach them from the
      // element only; disabling or stopping them can leave the wall with black video.
      lastTrackIdRef.current = null;
      streamRef.current = null;

      setAutoplayBlocked(false);
      setIsLoading(true);
      setConnectionStatus('disconnected');
      setFrameAgeSeconds(null);
    };

    const getParticipantSnapshot = () => {
      if (!callObject) {
        return participant;
      }

      const participants = callObject.participants() ?? {};
      const latest = participants[participant.session_id];
      return latest ?? participant;
    };

    const attachTrackToElement = (track: MediaStreamTrack | null, stream?: MediaStream | null) => {
      logger.wall(`VideoTile [${participant.user_name}]: attachTrackToElement called`, {
        hasTrack: !!track,
        trackId: track?.id,
        trackReadyState: track?.readyState,
        hasVideoRef: !!videoRef.current,
      });

      if (!track) {
        logger.wall(`VideoTile [${participant.user_name}]: No track to attach, cleaning up`);
        cleanupStream();
        setHasVideo(false);
        return false;
      }

      const resolvedStream = stream ?? new MediaStream([track]);
      streamRef.current = resolvedStream;
      lastTrackIdRef.current = track.id;

      logger.wall(`VideoTile [${participant.user_name}]: Stream created, attaching to video element`);

      if (videoRef.current) {
        videoRef.current.srcObject = resolvedStream;
        logger.wall(`VideoTile [${participant.user_name}]: srcObject set, attempting playback`);
        void attemptPlayback();
      } else {
        logger.warn(`VideoTile [${participant.user_name}]: Video element not available yet`);
      }

      setHasVideo(true);
      setIsLoading(false);
      setConnectionStatus('connected');
      setTrackState(track.readyState);

      // Clear loading timeout if video loads successfully
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }

      return true;
    };

    const updateVideoTrack = () => {
      const latestParticipant = getParticipantSnapshot();
      const videoState = latestParticipant.tracks?.video?.state;
      const videoTrack =
        latestParticipant.tracks?.video?.track ??
        (latestParticipant.tracks?.video as { persistentTrack?: MediaStreamTrack })?.persistentTrack ??
        null;

      logger.wall(`VideoTile [${participant.user_name}]: updateVideoTrack`, {
        videoTrack: videoTrack?.id,
        readyState: videoTrack?.readyState,
        videoState,
        hasVideoElement: !!videoRef.current,
        subscribed: latestParticipant.tracks?.video?.subscribed,
      });
      setTrackState(videoState ?? videoTrack?.readyState ?? "unknown");

      // Only reject if track doesn't exist or is ended
      // Be very permissive with state - even if state is "blocked", try to attach
      const shouldSkip = !videoTrack || videoTrack.readyState === "ended";

      if (shouldSkip) {
        logger.wall(`VideoTile [${participant.user_name}]: Skipping track update`, { 
          videoTrack: !!videoTrack, 
          readyState: videoTrack?.readyState, 
          videoState,
          reason: !videoTrack ? 'no track' : 'track ended'
        });
        
        // Don't cleanup immediately if it's just a state issue, only if track is truly gone
        if (!videoTrack) {
          cleanupStream();
          setHasVideo(false);
        }
        return;
      }

      if (lastTrackIdRef.current === videoTrack.id && videoRef.current?.srcObject) {
        logger.wall(`VideoTile [${participant.user_name}]: Track already attached`);
        setHasVideo(true);
        setIsLoading(false);
        setConnectionStatus('connected');
        return;
      }

      logger.wall(`VideoTile [${participant.user_name}]: Attaching new track`, videoTrack.id, 'with state:', videoState);
      attachTrackToElement(videoTrack);
    };

    // Set a timeout to stop showing loading state after reasonable time
    loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      setConnectionStatus('disconnected');
    }, TIMEOUTS.VIDEO_LOADING_MS);

    // Initial update
    updateVideoTrack();

    const handleRelevantChange = (sessionId?: string) => {
      if (sessionId === participant.session_id) {
        updateVideoTrack();
      }
    };

    const handleTrackStarted = (event: DailyEventObjectTrack) => {
      logger.wall(`VideoTile [${participant.user_name}]: track-started event`, {
        trackKind: event.track?.kind,
        participantId: event.participant?.session_id,
        matchesThisParticipant: event.participant?.session_id === participant.session_id,
      });

      if (event.track?.kind !== "video") {
        return;
      }

      const participantId = event.participant?.session_id;
      if (participantId === participant.session_id) {
        const incomingTrack = event.track ?? null;
        const incomingStream = incomingTrack ? new MediaStream([incomingTrack]) : null;

        logger.wall(`VideoTile [${participant.user_name}]: Received track-started for this participant`);
        if (!attachTrackToElement(incomingTrack, incomingStream ?? undefined)) {
          handleRelevantChange(participantId);
        }
      } else {
        handleRelevantChange(participantId);
      }
    };

    const handleTrackStopped = (event: DailyEventObjectTrack) => {
      if (event.track?.kind === "video" && event.participant?.session_id === participant.session_id) {
        cleanupStream();
        setHasVideo(false);
        setTrackState("stopped");
      }
    };

    const handleParticipantUpdated = (event: DailyEventObjectParticipant) => {
      handleRelevantChange(event.participant?.session_id);
    };

    const handleParticipantLeft = (event: { action: string; participant?: DailyParticipant }) => {
      if (event.participant?.session_id === participant.session_id) {
        cleanupStream();
        setHasVideo(false);
      }
    };

    callObject.on("track-started", handleTrackStarted);
    callObject.on("track-stopped", handleTrackStopped);
    callObject.on("participant-updated", handleParticipantUpdated);
    callObject.on("participant-left", handleParticipantLeft);

    return () => {
      callObject.off("track-started", handleTrackStarted);
      callObject.off("track-stopped", handleTrackStopped);
      callObject.off("participant-updated", handleParticipantUpdated);
      callObject.off("participant-left", handleParticipantLeft);

      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      cleanupStream();
      setHasVideo(false);
    };
  }, [participant, callObject, participant.tracks?.video?.state, participant.tracks?.video?.track?.id]);

  useEffect(() => {
    if (!hasVideo || !videoRef.current) {
      return;
    }

    let animationFrameId = 0;
    let cancelled = false;
    const videoElement = videoRef.current as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };

    const markFrame = () => {
      if (cancelled) {
        return;
      }
      setLastFrameAt(Date.now());
      setFrameAgeSeconds(0);
      if (videoElement.requestVideoFrameCallback) {
        animationFrameId = videoElement.requestVideoFrameCallback(markFrame);
      } else {
        animationFrameId = window.setTimeout(markFrame, 1000);
      }
    };

    markFrame();

    return () => {
      cancelled = true;
      if (videoElement.cancelVideoFrameCallback && animationFrameId) {
        videoElement.cancelVideoFrameCallback(animationFrameId);
      } else {
        window.clearTimeout(animationFrameId);
      }
    };
  }, [hasVideo]);

  useEffect(() => {
    if (!lastFrameAt) {
      return;
    }

    const intervalId = setInterval(() => {
      setFrameAgeSeconds(Math.max(0, Math.round((Date.now() - lastFrameAt) / 1000)));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [lastFrameAt]);

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border bg-black shadow-2xl ${
        isFocused ? "h-full min-h-[280px] border-blue-500" : "border-white/10"
      }`}
      style={{ aspectRatio: "16 / 9" }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          hasVideo ? "opacity-100" : "opacity-0"
        }`}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Connecting...</p>
          </div>
        </div>
      )}

      {!isLoading && !hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No video</p>
            {connectionStatus === 'disconnected' && (
              <p className="text-gray-500 text-xs mt-1">Disconnected</p>
            )}
          </div>
        </div>
      )}

      {hasVideo && autoplayBlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <Button
            variant="outline"
            className="bg-white/10 border-white/40 text-white hover:bg-white/20"
            onClick={handleManualPlay}
            aria-label="Resume video playback"
          >
            Resume Video
          </Button>
        </div>
      )}

      {hasVideo && (
        <>
          <div className="absolute right-2 top-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} title={`Status: ${connectionStatus}`}></div>
          </div>
          {showDiagnostics && (
            <div className="absolute left-2 top-12 rounded-md bg-black/70 px-2 py-1 text-[11px] text-white">
              <p>Track: {trackState}</p>
              <p>Frame: {frameAgeSeconds === null ? "waiting" : `${frameAgeSeconds}s ago`}</p>
              {autoplayBlocked && <p>Playback: blocked</p>}
            </div>
          )}
        </>
      )}

      <div className="absolute left-2 top-2 flex gap-2">
        {onFocus && !isFocused && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-white/25 bg-black/55 px-2 text-xs text-white backdrop-blur-sm hover:bg-white/15"
            onClick={onFocus}
            aria-label={`Focus ${participant.user_name || "church"}`}
          >
            <Pin className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Focus</span>
          </Button>
        )}
        {onClearFocus && isFocused && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-white/25 bg-black/50 px-2 text-xs text-white backdrop-blur-sm hover:bg-white/15"
            onClick={onClearFocus}
            aria-label="Exit focused church view"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit Focus</span>
          </Button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-3">
        <p className={`truncate font-semibold text-white ${isFocused ? "text-lg" : "text-sm"}`}>
          {participant.user_name || "Unknown Church"}
        </p>
        {connectionStatus !== 'connected' && (
          <p className="text-gray-300 text-xs">
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </p>
        )}
        {showDiagnostics && (
          <p className="text-gray-400 text-xs">
            Video {hasVideo ? "attached" : "missing"} · Track {trackState}
          </p>
        )}
      </div>
    </div>
  );
});

VideoTile.displayName = 'VideoTile';

export function WallDisplay({ token, roomUrl, serviceName, sessionCode }: WallDisplayProps) {
  const callObjectRef = useRef<DailyCall | null>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [participants, setParticipants] = useState<DailyParticipant[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const destroyPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize Daily.co call
  useEffect(() => {
    if (!roomUrl || !token) {
      return;
    }

    let isMounted = true;
    let activeCall: DailyCall | null = null;

    const ensureSubscriptions = async (daily: DailyCall, participantsToCheck: DailyParticipant[]) => {
      const trackUpdates: Record<string, { video: { subscribed: boolean; layer?: number } }> = {};

      participantsToCheck.forEach((participant) => {
        const videoTrackState = participant.tracks?.video;
        const subscribedState = videoTrackState?.subscribed;
        const isSubscribed = subscribedState === true;

        if (!participant.local && videoTrackState) {
          console.log(`Wall: Checking subscription for ${participant.user_name}:`, {
            subscribed: subscribedState,
            state: videoTrackState.state,
            hasTrack: !!videoTrackState.track,
          });

          if (!isSubscribed) {
            trackUpdates[participant.session_id] = {
              video: {
                subscribed: true,
                layer: 0,
              },
            };
          }
        }
      });

      if (Object.keys(trackUpdates).length > 0) {
        try {
          // @ts-expect-error - Daily.js types are not up to date
          await daily.updateReceiveSettings({ tracks: trackUpdates });
          logger.wall("Wall: Forced subscription for", Object.keys(trackUpdates).length, "participant(s):", trackUpdates);
        } catch (subscriptionError) {
          logger.error("Wall: Failed to enforce subscriptions", subscriptionError);
        }
      }
    };

    const updateParticipants = () => {
      if (!isMounted || !activeCall) {
        return;
      }

      const participantsList = Object.values(activeCall.participants())
        .filter((participant) => {
          // Exclude local participants and non-publishing wall viewers.
          // We still keep church participants while their camera track is starting.
          return !participant.local && !isWallViewer(participant);
        })
        .sort((a, b) => (a.user_name || "").localeCompare(b.user_name || ""));

      logger.wall("Wall: Participants updated:", participantsList.length);
      setParticipants(participantsList);

      void ensureSubscriptions(activeCall, participantsList);
    };

    const handleJoinedMeeting = () => {
      logger.wall("Wall: Joined meeting successfully");
      updateParticipants();
    };

    const handleParticipantJoined = () => {
      logger.wall("Wall: Participant joined");
      updateParticipants();
    };

    const handleParticipantUpdated = (event?: DailyEventObjectParticipant) => {
      if (event) {
        logger.wall("Wall: Participant updated", event.participant?.user_name, "video:", event.participant?.video);
      }
      updateParticipants();
    };

    const handleParticipantLeft = () => {
      logger.wall("Wall: Participant left");
      updateParticipants();
    };

    const handleTrackStarted = (event: DailyEventObjectTrack) => {
      logger.wall("Wall: Track started", event.participant?.user_name, event.track?.kind);
      updateParticipants();
    };

    const handleTrackStopped = (event: DailyEventObjectTrack) => {
      logger.wall("Wall: Track stopped", event.participant?.user_name, event.track?.kind);
      updateParticipants();
    };

    const handleError = (error: { errorMsg: string; error?: Error }) => {
      logger.error("Wall: Daily.co error", error);
    };

    const attachListeners = (daily: DailyCall) => {
      daily.on("joined-meeting", handleJoinedMeeting);
      daily.on("participant-joined", handleParticipantJoined);
      daily.on("participant-updated", handleParticipantUpdated);
      daily.on("participant-left", handleParticipantLeft);
      daily.on("track-started", handleTrackStarted);
      daily.on("track-stopped", handleTrackStopped);
      daily.on("error", handleError);
    };

    const detachListeners = (daily: DailyCall) => {
      daily.off("joined-meeting", handleJoinedMeeting);
      daily.off("participant-joined", handleParticipantJoined);
      daily.off("participant-updated", handleParticipantUpdated);
      daily.off("participant-left", handleParticipantLeft);
      daily.off("track-started", handleTrackStarted);
      daily.off("track-stopped", handleTrackStopped);
      daily.off("error", handleError);
    };

    const initializeCall = async () => {
      try {
        if (destroyPromiseRef.current) {
          logger.wall("Wall: Waiting for previous Daily call cleanup to finish");
          await destroyPromiseRef.current;
        }

        if (!callObjectRef.current) {
          const existingInstance = DailyIframe.getCallInstance?.();
          if (existingInstance) {
            logger.wall("Wall: Destroying leftover Daily call instance before creating new one");
            try {
              await existingInstance.destroy();
            } catch (destroyError) {
              logger.error("Wall: Failed to destroy leftover call instance", destroyError);
            }
          }

          logger.wall("Wall: Initializing Daily.co call...");
          callObjectRef.current = DailyIframe.createCallObject({
            videoSource: false, // Wall doesn't publish video
            audioSource: false, // No audio
            subscribeToTracksAutomatically: true, // Auto-subscribe to all tracks
          });
        }

        const daily = callObjectRef.current;
        if (!daily) {
          return;
        }

        activeCall = daily;
        setCallObject(daily);
        attachListeners(daily);

        logger.wall("Wall: Joining room", roomUrl);
        await daily.join({ url: roomUrl, token });
        
        // Set receive settings to request lowest quality layer
        await daily.updateReceiveSettings({
          base: {
            video: {
              // @ts-expect-error - Daily.js types are not up to date
              subscribed: true,
              layer: 0, // Request lowest quality layer for bandwidth
            },
          },
        });
        
        logger.wall("Wall: Applied receive settings for low bandwidth");
      } catch (error) {
        logger.error("Wall: Failed to initialize call", error);
      }
    };

    initializeCall();

    // Periodic subscription check to catch any missed tracks
    const subscriptionCheckInterval = setInterval(() => {
      if (activeCall && isMounted) {
        const currentParticipants = Object.values(activeCall.participants())
          .filter((p) => !p.local && !isWallViewer(p));

        if (currentParticipants.length > 0) {
          logger.wall("Wall: Periodic subscription check for", currentParticipants.length, "participants");
          void ensureSubscriptions(activeCall, currentParticipants);
        }
      }
    }, VIDEO_WALL.SUBSCRIPTION_CHECK_INTERVAL_MS);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(subscriptionCheckInterval);

      const daily = callObjectRef.current;
      if (daily) {
        detachListeners(daily);
        logger.wall("Wall: Cleaning up call object");
        const destroyPromise = daily.destroy().catch((err) => {
          logger.error("Wall: Error destroying call object", err);
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

      setParticipants([]);
    };
  }, [roomUrl, token]);

  const totalPages = Math.ceil(participants.length / VIDEO_WALL.TILES_PER_PAGE);

  const currentParticipants = useMemo(() => {
    const startIdx = currentPage * VIDEO_WALL.TILES_PER_PAGE;
    const endIdx = startIdx + VIDEO_WALL.TILES_PER_PAGE;
    return participants.slice(startIdx, endIdx);
  }, [participants, currentPage]);

  const focusedParticipant = useMemo(() => {
    if (!focusedParticipantId) {
      return null;
    }

    return participants.find((participant) => participant.session_id === focusedParticipantId) ?? null;
  }, [focusedParticipantId, participants]);

  const focusableParticipants = focusedParticipant
    ? participants.filter((participant) => participant.session_id !== focusedParticipant.session_id)
    : participants;

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!autoRotate || totalPages <= 1) {
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentPage((page) => (page + 1) % totalPages);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [autoRotate, totalPages]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-gray-900">
      {/* Header */}
      <div className="flex-none bg-gray-800/50 px-3 py-2 backdrop-blur-sm sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-300">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white" aria-label={`${participants.length} connected churches`}>
              <Users className="h-4 w-4" />
              {participants.length}
            </span>
            <span className="min-w-0 max-w-[36rem] truncate font-medium text-white">
              {serviceName}
            </span>
            <span className="text-gray-400">Session: {sessionCode}</span>
            <span className="text-gray-400">360p</span>
            {focusedParticipant && (
              <span className="min-w-0 truncate text-blue-200">
                Focus: {focusedParticipant.user_name || "Unknown Church"}
              </span>
            )}
            {totalPages > 1 && (
              <span className="text-gray-400">Page {currentPage + 1}/{totalPages}</span>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {focusedParticipant && (
              <Button
                onClick={() => setFocusedParticipantId(null)}
                variant="outline"
                size="sm"
                className="h-9 border-white/20 bg-white/10 px-2 text-white hover:bg-white/20 sm:px-3"
              >
                <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Grid View</span>
              </Button>
            )}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="sm"
                  className="h-9 border-white/20 bg-white/10 px-2 text-white hover:bg-white/20 sm:px-3"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                <Button
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1}
                  variant="outline"
                  size="sm"
                  className="h-9 border-white/20 bg-white/10 px-2 text-white hover:bg-white/20 sm:px-3"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            )}
            <Button
              onClick={() => setAutoRotate((value) => !value)}
              variant="outline"
              size="sm"
              className="h-9 border-white/20 bg-white/10 px-2 text-white hover:bg-white/20 sm:px-3"
              aria-pressed={autoRotate}
              aria-label={autoRotate ? "Disable auto rotate" : "Enable auto rotate"}
            >
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">
                {autoRotate ? "Rotate On" : "Rotate Off"}
              </span>
            </Button>
            <Button
              onClick={() => setShowDiagnostics((value) => !value)}
              variant="outline"
              size="sm"
              className="h-9 border-white/20 bg-white/10 px-2 text-white hover:bg-white/20 sm:px-3"
              aria-pressed={showDiagnostics}
            >
              <span className="text-xs sm:text-sm">
                {showDiagnostics ? "Hide Diagnostics" : "Show Diagnostics"}
              </span>
            </Button>
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="h-9 border-white/20 bg-white/10 px-2 text-white hover:bg-white/20 sm:px-3"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">
                {isFullscreen ? "Exit" : "Fullscreen"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={`flex-1 p-3 sm:p-4 ${focusedParticipant ? "overflow-hidden" : "overflow-y-auto"}`}>
        {participants.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-4">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg sm:text-xl">Waiting for churches to connect...</p>
              <p className="text-gray-500 text-sm mt-2">
                Churches will appear here once they join the service
              </p>
            </div>
          </div>
        ) : focusedParticipant ? (
          <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-h-0">
              <VideoTile
                key={focusedParticipant.session_id}
                participant={focusedParticipant}
                callObject={callObject}
                showDiagnostics={showDiagnostics}
                isFocused
                onClearFocus={() => setFocusedParticipantId(null)}
              />
            </div>

            <aside className="min-h-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-3 py-3">
                <p className="text-sm font-semibold text-white">Connected Churches</p>
                <p className="text-xs text-gray-400">Select another church to focus</p>
              </div>
              <div className="max-h-full space-y-2 overflow-y-auto p-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-blue-400/40 bg-blue-500/15 px-3 py-2 text-left text-sm text-white"
                  onClick={() => setFocusedParticipantId(focusedParticipant.session_id)}
                >
                  <span className="truncate">{focusedParticipant.user_name || "Unknown Church"}</span>
                  <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Live
                  </span>
                </button>
                {focusableParticipants.map((participant) => (
                  <button
                    key={participant.session_id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-gray-200 transition hover:border-white/25 hover:bg-white/10"
                    onClick={() => setFocusedParticipantId(participant.session_id)}
                  >
                    <span className="truncate">{participant.user_name || "Unknown Church"}</span>
                    <Pin className="ml-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
                  </button>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          <div
            className="grid gap-3 sm:gap-4 lg:gap-5"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            }}
          >
            {currentParticipants.map((participant) => (
              <VideoTile
                key={participant.session_id}
                participant={participant}
                callObject={callObject}
                showDiagnostics={showDiagnostics}
                onFocus={() => setFocusedParticipantId(participant.session_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
