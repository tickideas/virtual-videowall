"use client";

import { useState, useEffect, useRef } from "react";
import { Participant, Track } from "livekit-client";
import { Video, VideoOff, Wifi, WifiOff } from "lucide-react";

interface VideoTileProps {
  participant: Participant;
}

export function VideoTile({ participant }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const attachVideo = () => {
      try {
        if (participant?.videoTracks) {
          const tracks = Array.from(participant.videoTracks.values());
          const videoPublication = tracks.find(pub => pub.source === Track.Source.Camera) || tracks[0];
          
          if (videoPublication && videoPublication.track) {
            videoPublication.track.attach(videoElement);
            setHasVideo(true);
            return () => {
              videoPublication.track?.detach(videoElement);
            };
          }
        }
        setHasVideo(false);
      } catch (e) {
        console.error('Error attaching video:', e);
        setHasVideo(false);
      }
    };

    const cleanup = attachVideo();
    
    // Listen for track updates
    participant.on('trackSubscribed', attachVideo);
    participant.on('trackUnsubscribed', () => setHasVideo(false));

    return () => {
      cleanup?.();
      participant.off('trackSubscribed', attachVideo);
      participant.off('trackUnsubscribed', () => setHasVideo(false));
    };
  }, [participant]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors aspect-video">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <VideoOff className="w-12 h-12 text-gray-600" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between">
          <p className="text-white font-medium text-sm truncate flex-1">
            {participant?.name || participant?.identity || 'Unknown'}
          </p>
          <div className="flex items-center gap-1">
            {participant?.connectionQuality === "excellent" && (
              <Wifi className="w-4 h-4 text-green-400" />
            )}
            {participant?.connectionQuality === "good" && (
              <Wifi className="w-4 h-4 text-yellow-400" />
            )}
            {participant?.connectionQuality === "poor" && (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-2 left-2">
        {hasVideo ? (
          <div className="bg-green-500 rounded-full p-1">
            <Video className="w-3 h-3 text-white" />
          </div>
        ) : (
          <div className="bg-red-500 rounded-full p-1">
            <VideoOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
