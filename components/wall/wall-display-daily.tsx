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
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!videoRef.current || !callObject || !participant) {
      return;
    }

    const updateVideoTrack = () => {
      const videoTrack = participant.tracks?.video?.track;
      
      if (videoTrack && videoTrack.readyState === "live") {
        // Clean up old stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Create new stream with current track
        const stream = new MediaStream([videoTrack]);
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasVideo(true);
        }
      } else {
        setHasVideo(false);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };

    // Initial update
    updateVideoTrack();

    // Listen for track changes
    const handleTrackStarted = (event: DailyEventObjectTrack) => {
      if (event.participant?.session_id === participant.session_id && event.track?.kind === "video") {
        console.log("VideoTile: Track started for", participant.user_name);
        updateVideoTrack();
      }
    };

    const handleTrackStopped = (event: DailyEventObjectTrack) => {
      if (event.participant?.session_id === participant.session_id && event.track?.kind === "video") {
        console.log("VideoTile: Track stopped for", participant.user_name);
        setHasVideo(false);
      }
    };

    callObject.on("track-started", handleTrackStarted);
    callObject.on("track-stopped", handleTrackStopped);

    // Cleanup
    return () => {
      callObject.off("track-started", handleTrackStarted);
      callObject.off("track-stopped", handleTrackStopped);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [participant, callObject]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-[4/3]">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
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

    const updateParticipants = () => {
      if (!isMounted || !activeCall) {
        return;
      }

      const participantsList = Object.values(activeCall.participants())
        .filter((participant) => {
          // Exclude local participant (the wall itself) and ensure video track exists
          return !participant.local && participant.tracks?.video;
        })
        .sort((a, b) => (a.user_name || "").localeCompare(b.user_name || ""));

      console.log("Wall: Participants updated:", participantsList.length);
      setParticipants(participantsList);
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
          <div className="h-full grid grid-cols-4 grid-rows-5 gap-3">
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
