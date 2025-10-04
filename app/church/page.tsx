"use client";

import { useState } from "react";
import { ChurchJoinForm } from "@/components/church/church-join-form";
import { ChurchRoom } from "@/components/church/church-room";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ChurchPage() {
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [churchName, setChurchName] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState<string | null>(null);

  const handleJoined = (data: {
    token: string;
    roomName: string;
    churchName: string;
    serviceName: string;
  }) => {
    setToken(data.token);
    setRoomName(data.roomName);
    setChurchName(data.churchName);
    setServiceName(data.serviceName);
  };

  const handleLeave = () => {
    setToken(null);
    setRoomName(null);
    setChurchName(null);
    setServiceName(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!token ? (
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <ChurchJoinForm onJoined={handleJoined} />
        </div>
      ) : (
        <ChurchRoom
          token={token}
          roomName={roomName!}
          churchName={churchName!}
          serviceName={serviceName!}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
