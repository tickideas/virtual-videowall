"use client";

import { useState, Suspense } from "react";
import { ChurchJoinForm } from "@/components/church/church-join-form";
import { ChurchRoom } from "@/components/church/church-room-daily";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ChurchJoinSkeleton } from "@/components/ui/skeletons";

export default function ChurchPage() {
  const [token, setToken] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [churchName, setChurchName] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState<string | null>(null);

  const handleJoined = (data: {
    token: string;
    roomUrl: string;
    churchName: string;
    serviceName: string;
  }) => {
    setToken(data.token);
    setRoomUrl(data.roomUrl);
    setChurchName(data.churchName);
    setServiceName(data.serviceName);
  };

  const handleLeave = () => {
    setToken(null);
    setRoomUrl(null);
    setChurchName(null);
    setServiceName(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!token ? (
        <Suspense fallback={<ChurchJoinSkeleton />}>
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 sm:mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <ChurchJoinForm onJoined={handleJoined} />
          </div>
        </Suspense>
      ) : (
        <ChurchRoom
          token={token}
          roomUrl={roomUrl!}
          churchName={churchName!}
          serviceName={serviceName!}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
