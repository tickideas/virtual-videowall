"use client";

import { useState, useEffect } from "react";
import { LiveKitRoom, useParticipants } from "@livekit/components-react";
import "@livekit/components-styles";
import { ChevronLeft, ChevronRight, Maximize, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoTile } from "./video-tile";

interface WallDisplayProps {
  token: string;
  roomName: string;
  serviceName: string;
  sessionCode: string;
}

interface WallGridProps {
  serviceName: string;
  sessionCode: string;
  roomName: string;
}

function WallGrid({ serviceName, sessionCode, roomName }: WallGridProps) {
  const allParticipants = useParticipants();
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Filter out viewers (wall displays) and participants without video tracks
  const participants = allParticipants.filter(p => {
    const isViewer = p.identity.startsWith('viewer-');
    const hasVideo = p.videoTrackPublications.size > 0;
    return !isViewer && hasVideo;
  });
  
  // Debug: Log participants
  useEffect(() => {
    console.log('Wall: Total participants (all):', allParticipants.length);
    console.log('Wall: Filtered participants (churches with video):', participants.length);
    console.log('Wall: Participants:', participants.map(p => ({
      identity: p.identity,
      name: p.name,
      videoTracks: p.videoTrackPublications.size,
    })));
  }, [allParticipants, participants]);
  
  const TILES_PER_PAGE = 20;
  const totalPages = Math.ceil(participants.length / TILES_PER_PAGE);
  const startIdx = currentPage * TILES_PER_PAGE;
  const endIdx = startIdx + TILES_PER_PAGE;
  const currentParticipants = participants.slice(startIdx, endIdx);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
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
              <span>Room: {roomName}</span>
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
                key={participant.identity}
                participant={participant}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WallDisplay({ token, roomName, serviceName, sessionCode }: WallDisplayProps) {
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      video={false}
      audio={false}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
    >
      <WallGrid serviceName={serviceName} sessionCode={sessionCode} roomName={roomName} />
    </LiveKitRoom>
  );
}
