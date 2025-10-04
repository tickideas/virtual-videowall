"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Participant,
  ParticipantEvent,
  Track,
  type RemoteTrackPublication,
} from "livekit-client";
import { Video, VideoOff, Wifi, WifiOff } from "lucide-react";

interface VideoTileProps {
  participant: Participant;
}

export function VideoTile({ participant }: VideoTileProps) {
  const [hasVideo, setHasVideo] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
    setVideoElement(node);
  }, []);

  useEffect(() => {
    if (!videoElement) {
      return;
    }

    let detachCurrentTrack: (() => void) | undefined;

    const selectVideoPublication = () => {
      if (!participant?.videoTrackPublications) {
        return undefined;
      }

      const publications = Array.from(participant.videoTrackPublications.values());
      if (publications.length === 0) {
        return undefined;
      }

      const cameraPublication = participant.getTrackPublication(Track.Source.Camera);
      if (cameraPublication && cameraPublication.kind === Track.Kind.Video) {
        return cameraPublication;
      }

      return publications.find(pub => pub.kind === Track.Kind.Video) || publications[0];
    };

    const subscribeIfNeeded = (publication?: RemoteTrackPublication) => {
      if (!publication) {
        return;
      }

      if ("setSubscribed" in publication && !publication.isSubscribed) {
        try {
          publication.setSubscribed(true);
        } catch (error) {
          console.error("Error subscribing to track:", error);
        }
      }
    };

    const updateVideo = () => {
      detachCurrentTrack?.();
      detachCurrentTrack = undefined;

      try {
        const publication = selectVideoPublication();
        subscribeIfNeeded(publication as RemoteTrackPublication | undefined);

        const track = publication?.videoTrack;

        if (!track) {
          setHasVideo(false);
          return;
        }

        track.attach(videoElement);
        videoElement.play?.().catch(() => {
          /* autoplay guard */
        });
        detachCurrentTrack = () => {
          track.detach(videoElement);
        };
        setHasVideo(true);
      } catch (error) {
        console.error("Error attaching video:", error);
        setHasVideo(false);
      }
    };

    const handleTrackSubscribed = () => updateVideo();

    const handleTrackPublished = (publication: RemoteTrackPublication) => {
      subscribeIfNeeded(publication);
      updateVideo();
    };

    const handleTrackUnsubscribed = () => {
      detachCurrentTrack?.();
      detachCurrentTrack = undefined;
      setHasVideo(false);
    };

    const handleTrackMuted = () => {
      setHasVideo(false);
    };

    const handleTrackUnmuted = () => {
      updateVideo();
    };

    updateVideo();

    participant.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
    participant.on(ParticipantEvent.TrackPublished, handleTrackPublished);
    participant.on(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    participant.on(ParticipantEvent.TrackMuted, handleTrackMuted);
    participant.on(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);

    return () => {
      detachCurrentTrack?.();
      participant.off(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
      participant.off(ParticipantEvent.TrackPublished, handleTrackPublished);
      participant.off(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      participant.off(ParticipantEvent.TrackMuted, handleTrackMuted);
      participant.off(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);
    };
  }, [participant, videoElement]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors aspect-video">
      <video
        ref={handleVideoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-200 ${hasVideo ? "opacity-100" : "opacity-0"}`}
      />

      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
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
