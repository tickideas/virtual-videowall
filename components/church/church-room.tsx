"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, useLocalParticipant } from "@livekit/components-react";
import "@livekit/components-styles";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, PhoneOff, Signal } from "lucide-react";

interface ChurchRoomProps {
  token: string;
  roomName: string;
  churchName: string;
  serviceName: string;
  onLeave: () => void;
}

function RoomControls({ churchName, serviceName, onLeave }: {
  churchName: string;
  serviceName: string;
  onLeave: () => void;
}) {
  const { isCameraEnabled, microphoneTrack } = useLocalParticipant();
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("good");

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">{churchName}</h2>
            <p className="text-gray-300 text-sm">{serviceName}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
              <Signal className={`w-4 h-4 ${
                connectionQuality === "excellent" ? "text-green-400" :
                connectionQuality === "good" ? "text-yellow-400" :
                "text-red-400"
              }`} />
              <span className="text-sm text-white capitalize">{connectionQuality}</span>
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
              onClick={onLeave}
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
  );
}

export function ChurchRoom({ token, roomName, churchName, serviceName, onLeave }: ChurchRoomProps) {
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

  return (
    <div className="h-screen w-screen bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        video={true}
        audio={false}
        options={{
          videoCaptureDefaults: {
            resolution: {
              width: 240,
              height: 180,
            },
            frameRate: 8,
          },
          audioCaptureDefaults: {
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
          },
          adaptiveStream: true,
          dynacast: true,
        }}
        onDisconnected={onLeave}
      >
        <RoomControls churchName={churchName} serviceName={serviceName} onLeave={onLeave} />
        <LocalVideo />
      </LiveKitRoom>
    </div>
  );
}

function LocalVideo() {
  const { cameraTrack, localParticipant, isCameraEnabled } = useLocalParticipant();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // Enable camera on mount
  useEffect(() => {
    const enableCamera = async () => {
      if (localParticipant && !isCameraEnabled) {
        try {
          console.log('Church: Enabling camera...');
          await localParticipant.setCameraEnabled(true);
          console.log('Church: Camera enabled successfully');
        } catch (error) {
          console.error('Church: Failed to enable camera:', error);
        }
      }
    };
    enableCamera();
  }, [localParticipant, isCameraEnabled]);

  // Debug logging
  useEffect(() => {
    console.log('Church: Camera enabled:', isCameraEnabled);
    console.log('Church: Camera track:', !!cameraTrack);
    console.log('Church: Local participant:', localParticipant?.identity);
    console.log('Church: Video tracks:', localParticipant?.videoTracks?.size || 0);
  }, [cameraTrack, localParticipant, isCameraEnabled]);

  useEffect(() => {
    if (videoElement && cameraTrack) {
      console.log('Church: Attaching video track to element');
      cameraTrack.track?.attach(videoElement);
      return () => {
        cameraTrack.track?.detach(videoElement);
      };
    }
  }, [videoElement, cameraTrack]);

  return (
    <div className="flex items-center justify-center h-full pt-24 pb-8 px-4">
      <div className="max-w-2xl w-full">
        <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-900">
          {cameraTrack ? (
            <video
              ref={setVideoElement}
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
          <p className="text-lg font-medium mb-2">You are now live on the video wall!</p>
          <p className="text-sm text-gray-300">
            Your video is being streamed at low quality (240p @ 8fps) to conserve bandwidth.
          </p>
          <p className="text-sm text-gray-300 mt-2">
            Audio is muted by default to prevent feedback.
          </p>
        </div>
      </div>
    </div>
  );
}


