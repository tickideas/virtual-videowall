"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

function VideoTile({ participant, callObject }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
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

    const attemptPlayback = async () => {
      if (!videoRef.current) {
        return;
      }

      try {
        videoRef.current.defaultMuted = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.setAttribute("muted", "muted");
        videoRef.current.setAttribute("playsinline", "true");

        await videoRef.current.play();
        setAutoplayBlocked(false);
      } catch {
        console.warn("VideoTile: Autoplay blocked for", participant.user_name);
        setAutoplayBlocked(true);
      }
    };

    const cleanupStream = () => {
      lastTrackIdRef.current = null;
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setAutoplayBlocked(false);
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
      if (!track) {
        cleanupStream();
        setHasVideo(false);
        return false;
      }

      const resolvedStream = stream ?? new MediaStream([track]);
      streamRef.current = resolvedStream;
      lastTrackIdRef.current = track.id;

      if (videoRef.current) {
        videoRef.current.srcObject = resolvedStream;
        void attemptPlayback();
      }

      setHasVideo(true);
      return true;
    };

    const updateVideoTrack = () => {
      const latestParticipant = getParticipantSnapshot();
      const videoState = latestParticipant.tracks?.video?.state;
      const videoTrack =
        latestParticipant.tracks?.video?.track ??
        (latestParticipant.tracks?.video as { persistentTrack?: MediaStreamTrack })?.persistentTrack ??
        null;

      // Only reject if track is explicitly ended or off, or doesn't exist
      const shouldSkip = !videoTrack || 
                        videoTrack.readyState === "ended" || 
                        videoState === "off" ||
                        videoState === "blocked";

      if (shouldSkip) {
        cleanupStream();
        setHasVideo(false);
        return;
      }

      if (lastTrackIdRef.current === videoTrack.id && videoRef.current?.srcObject) {
        setHasVideo(true);
        return;
      }

      attachTrackToElement(videoTrack);
    };

    // Initial update
    updateVideoTrack();

    const handleRelevantChange = (sessionId?: string) => {
      if (sessionId === participant.session_id) {
        updateVideoTrack();
      }
    };

    const handleTrackStarted = (event: DailyEventObjectTrack) => {
      if (event.track?.kind !== "video") {
        return;
      }

      const participantId = event.participant?.session_id;
      if (participantId === participant.session_id) {
        const incomingTrack = event.track ?? null;
        const incomingStream = incomingTrack ? new MediaStream([incomingTrack]) : null;

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

      cleanupStream();
      setHasVideo(false);
    };
  }, [participant, callObject]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
      {hasVideo ? (
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {autoplayBlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Button
                variant="outline"
                className="bg-white/10 border-white/40 text-white hover:bg-white/20"
                onClick={handleManualPlay}
              >
                Resume Video
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <VideoOff className="w-12 h-12 text-gray-600" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-sm font-medium truncate">
          {participant.user_name || "Unknown Church"}
        </p>
      </div>
    </div>
  );
}

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

        if (!participant.local && videoTrackState && !isSubscribed) {
          trackUpdates[participant.session_id] = {
            video: {
              subscribed: true,
              layer: 0,
            },
          };
        }
      });

      if (Object.keys(trackUpdates).length > 0) {
        try {
          // @ts-expect-error - Daily.js types are not up to date
          await daily.updateReceiveSettings({ tracks: trackUpdates });
          console.log("Wall: Forced subscription for", Object.keys(trackUpdates).length, "participant(s)");
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

    // Cleanup
    return () => {
      isMounted = false;

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
  const startIdx = currentPage * TILES_PER_PAGE;
  const endIdx = startIdx + TILES_PER_PAGE;
  const currentParticipants = participants.slice(startIdx, endIdx);

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
      <div className="flex-none bg-gray-800/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1 text-white">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">{participants.length} Churches Connected</span>
            </div>
            <div className="text-sm text-gray-300">{serviceName}</div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span>Session: {sessionCode}</span>
              {totalPages > 1 && (
                <span>Page {currentPage + 1} of {totalPages}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Maximize className="w-4 h-4" />
              {isFullscreen ? "Exit" : "Fullscreen"}
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden p-4">
        {currentParticipants.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">Waiting for churches to connect...</p>
              <p className="text-gray-500 text-sm mt-2">
                Churches will appear here once they join the service
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full grid grid-cols-5 grid-rows-4 gap-2 lg:gap-3">
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
