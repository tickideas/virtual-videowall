"use client";

import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import DailyIframe, { DailyCall, DailyParticipant, DailyEventObjectTrack, DailyEventObjectParticipant } from "@daily-co/daily-js";
import { ChevronLeft, ChevronRight, Maximize, Users, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WallDisplayProps {
  token: string;
  roomUrl: string;
  serviceName: string;
  sessionCode: string;
}

interface VideoTileProps {
  participant: DailyParticipant;
  callObject: DailyCall | null;
}

const VideoTile = memo(({ participant, callObject }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
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
      console.warn("VideoTile: manual play failed", error);
    }
  }, []);

  useEffect(() => {
    if (!callObject || !participant) {
      return;
    }

    console.log(`VideoTile [${participant.user_name}]: useEffect triggered - track state:`, participant.tracks?.video?.state);

    // eslint-disable-next-line prefer-const
    let loadingTimeout: NodeJS.Timeout;

    // Set initial loading state
    setIsLoading(true);
    setConnectionStatus('connecting');

    const attemptPlayback = async () => {
      if (!videoRef.current) {
        console.log(`VideoTile [${participant.user_name}]: No video ref for playback`);
        return;
      }

      try {
        videoRef.current.defaultMuted = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.setAttribute("muted", "muted");
        videoRef.current.setAttribute("playsinline", "true");

        console.log(`VideoTile [${participant.user_name}]: Attempting playback`);
        await videoRef.current.play();
        console.log(`VideoTile [${participant.user_name}]: Playback started successfully`);
        setAutoplayBlocked(false);
        setConnectionStatus('connected');
      } catch (error) {
        console.warn(`VideoTile [${participant.user_name}]: Autoplay blocked or playback failed`, error);
        setAutoplayBlocked(true);
        setConnectionStatus('disconnected');
      }
    };

    const cleanupStream = (hardReset: boolean = false) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          if (hardReset) {
            track.stop?.();
          }
          track.enabled = false;
        });
      }

      lastTrackIdRef.current = null;
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }

      setAutoplayBlocked(false);
      setIsLoading(true);
      setConnectionStatus('disconnected');
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
      console.log(`VideoTile [${participant.user_name}]: attachTrackToElement called`, {
        hasTrack: !!track,
        trackId: track?.id,
        trackReadyState: track?.readyState,
        hasVideoRef: !!videoRef.current,
      });

      if (!track) {
        console.log(`VideoTile [${participant.user_name}]: No track to attach, cleaning up`);
        cleanupStream();
        setHasVideo(false);
        return false;
      }

      const resolvedStream = stream ?? new MediaStream([track]);
      streamRef.current = resolvedStream;
      lastTrackIdRef.current = track.id;

      console.log(`VideoTile [${participant.user_name}]: Stream created, attaching to video element`);

      if (videoRef.current) {
        videoRef.current.srcObject = resolvedStream;
        console.log(`VideoTile [${participant.user_name}]: srcObject set, attempting playback`);
        void attemptPlayback();
      } else {
        console.warn(`VideoTile [${participant.user_name}]: Video element not available yet`);
      }

      setHasVideo(true);
      setIsLoading(false);
      setConnectionStatus('connected');

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

      console.log(`VideoTile [${participant.user_name}]: updateVideoTrack`, {
        videoTrack: videoTrack?.id,
        readyState: videoTrack?.readyState,
        videoState,
        hasVideoElement: !!videoRef.current,
        subscribed: latestParticipant.tracks?.video?.subscribed,
      });

      // Only reject if track doesn't exist or is ended
      // Be very permissive with state - even if state is "blocked", try to attach
      const shouldSkip = !videoTrack || videoTrack.readyState === "ended";

      if (shouldSkip) {
        console.log(`VideoTile [${participant.user_name}]: Skipping track update`, { 
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
        console.log(`VideoTile [${participant.user_name}]: Track already attached`);
        setHasVideo(true);
        setIsLoading(false);
        setConnectionStatus('connected');
        return;
      }

      console.log(`VideoTile [${participant.user_name}]: Attaching new track`, videoTrack.id, 'with state:', videoState);
      attachTrackToElement(videoTrack);
    };

    // Set a timeout to stop showing loading state after reasonable time
    loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      setConnectionStatus('disconnected');
    }, 10000); // 10 seconds

    // Initial update
    updateVideoTrack();

    const handleRelevantChange = (sessionId?: string) => {
      if (sessionId === participant.session_id) {
        updateVideoTrack();
      }
    };

    const handleTrackStarted = (event: DailyEventObjectTrack) => {
      console.log(`VideoTile [${participant.user_name}]: track-started event`, {
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

        console.log(`VideoTile [${participant.user_name}]: Received track-started for this participant`);
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

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-gray-800"
      style={{ aspectRatio: "16 / 9" }}
    >
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Connecting...</p>
          </div>
        </div>
      ) : hasVideo ? (
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {autoplayBlocked && (
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
          {/* Connection Status Indicator */}
          <div className="absolute top-2 right-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} title={`Status: ${connectionStatus}`}></div>
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-900">
          <div className="text-center">
            <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No video</p>
            {connectionStatus === 'disconnected' && (
              <p className="text-gray-500 text-xs mt-1">Disconnected</p>
            )}
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-sm font-medium truncate">
          {participant.user_name || "Unknown Church"}
        </p>
        {connectionStatus !== 'connected' && (
          <p className="text-gray-300 text-xs">
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
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
          console.log("Wall: Forced subscription for", Object.keys(trackUpdates).length, "participant(s):", trackUpdates);
        } catch (subscriptionError) {
          console.error("Wall: Failed to enforce subscriptions", subscriptionError);
        }
      }
    };

    const updateParticipants = () => {
      if (!isMounted || !activeCall) {
        return;
      }

      const participantsList = Object.values(activeCall.participants())
        .filter((participant) => {
          // Exclude local participant (the wall itself)
          // We show all remote participants, even if video isn't ready yet
          return !participant.local;
        })
        .sort((a, b) => (a.user_name || "").localeCompare(b.user_name || ""));

      console.log("Wall: Participants updated:", participantsList.length);
      setParticipants(participantsList);

      void ensureSubscriptions(activeCall, participantsList);
    };

    const handleJoinedMeeting = () => {
      console.log("Wall: Joined meeting successfully");
      updateParticipants();
    };

    const handleParticipantJoined = () => {
      console.log("Wall: Participant joined");
      updateParticipants();
    };

    const handleParticipantUpdated = (event?: DailyEventObjectParticipant) => {
      if (event) {
        console.log("Wall: Participant updated", event.participant?.user_name, "video:", event.participant?.video);
      }
      updateParticipants();
    };

    const handleParticipantLeft = () => {
      console.log("Wall: Participant left");
      updateParticipants();
    };

    const handleTrackStarted = (event: DailyEventObjectTrack) => {
      console.log("Wall: Track started", event.participant?.user_name, event.track?.kind);
      updateParticipants();
    };

    const handleTrackStopped = (event: DailyEventObjectTrack) => {
      console.log("Wall: Track stopped", event.participant?.user_name, event.track?.kind);
      updateParticipants();
    };

    const handleError = (error: { errorMsg: string; error?: Error }) => {
      console.error("Wall: Daily.co error", error);
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
          console.log("Wall: Waiting for previous Daily call cleanup to finish");
          await destroyPromiseRef.current;
        }

        if (!callObjectRef.current) {
          const existingInstance = DailyIframe.getCallInstance?.();
          if (existingInstance) {
            console.log("Wall: Destroying leftover Daily call instance before creating new one");
            try {
              await existingInstance.destroy();
            } catch (destroyError) {
              console.error("Wall: Failed to destroy leftover call instance", destroyError);
            }
          }

          console.log("Wall: Initializing Daily.co call...");
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

        console.log("Wall: Joining room", roomUrl);
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
        
        console.log("Wall: Applied receive settings for low bandwidth");
      } catch (error) {
        console.error("Wall: Failed to initialize call", error);
      }
    };

    initializeCall();

    // Periodic subscription check to catch any missed tracks
    const subscriptionCheckInterval = setInterval(() => {
      if (activeCall && isMounted) {
        const currentParticipants = Object.values(activeCall.participants())
          .filter((p) => !p.local);
        
        if (currentParticipants.length > 0) {
          console.log("Wall: Periodic subscription check for", currentParticipants.length, "participants");
          void ensureSubscriptions(activeCall, currentParticipants);
        }
      }
    }, 5000); // Check every 5 seconds

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(subscriptionCheckInterval);

      const daily = callObjectRef.current;
      if (daily) {
        detachListeners(daily);
        console.log("Wall: Cleaning up call object");
        const destroyPromise = daily.destroy().catch((err) => {
          console.error("Wall: Error destroying call object", err);
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

  const TILES_PER_PAGE = 20;
  const totalPages = Math.ceil(participants.length / TILES_PER_PAGE);

  const currentParticipants = useMemo(() => {
    const startIdx = currentPage * TILES_PER_PAGE;
    const endIdx = startIdx + TILES_PER_PAGE;
    return participants.slice(startIdx, endIdx);
  }, [participants, currentPage]);

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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex-none bg-gray-800/50 backdrop-blur-sm px-3 sm:px-6 py-2 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1 text-white">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">{participants.length} Churches Connected</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-300 truncate max-w-full">{serviceName}</div>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-400">
              <span>Session: {sessionCode}</span>
              {totalPages > 1 && (
                <span>Page {currentPage + 1} of {totalPages}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {totalPages > 1 && (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 sm:px-3"
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
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 sm:px-3"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            )}
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 sm:px-3"
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
      <div className="flex-1 overflow-y-auto p-4">
        {currentParticipants.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-4">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg sm:text-xl">Waiting for churches to connect...</p>
              <p className="text-gray-500 text-sm mt-2">
                Churches will appear here once they join the service
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', justifyContent: 'center', maxWidth: '100%' }}>
            {currentParticipants.map((participant) => (
              <VideoTile
                key={participant.session_id}
                participant={participant}
                callObject={callObject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
