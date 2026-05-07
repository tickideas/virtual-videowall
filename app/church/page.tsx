"use client";

import { useState, Suspense, lazy } from "react";
import { ChurchJoinForm } from "@/components/church/church-join-form";
import { Grid3x3 } from "lucide-react";
import { ChurchJoinSkeleton } from "@/components/ui/skeletons";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load the heavy ChurchRoom component (includes Daily.co video)
const ChurchRoom = lazy(() =>
  import("@/components/church/church-room-daily").then((mod) => ({
    default: mod.ChurchRoom,
  }))
);

export default function ChurchPage() {
  const [token, setToken] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [healthToken, setHealthToken] = useState<string | null>(null);
  const [churchName, setChurchName] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState<string | null>(null);

  const handleJoined = (data: {
    sessionId: string;
    healthToken: string;
    token: string;
    roomUrl: string;
    churchName: string;
    serviceName: string;
  }) => {
    setSessionId(data.sessionId);
    setHealthToken(data.healthToken);
    setToken(data.token);
    setRoomUrl(data.roomUrl);
    setChurchName(data.churchName);
    setServiceName(data.serviceName);
  };

  const handleLeave = () => {
    setToken(null);
    setRoomUrl(null);
    setSessionId(null);
    setHealthToken(null);
    setChurchName(null);
    setServiceName(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {!token ? (
        <Suspense fallback={<ChurchJoinSkeleton />}>
          {/* Header */}
          <header className="bg-white border-b border-slate-200 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
               
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                    <Grid3x3 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-slate-900">UKZ1 VideoWall</span>
                </div>
                <div className="w-20"></div> {/* Spacer for centering */}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="py-8 lg:py-12">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
             
              {/* Join Form */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Connect to the Zonal Video Wall
                  </h2>
              
                </div>
                <div className="p-8">
                  <ChurchJoinForm onJoined={handleJoined} />
                </div>
              </div>

          
            </div>
          </div>
        </Suspense>
      ) : (
        <Suspense fallback={<PageLoadingSpinner message="Loading video room..." />}>
          <ChurchRoom
            sessionId={sessionId || ""}
            healthToken={healthToken || ""}
            token={token || ""}
            roomUrl={roomUrl || ""}
            churchName={churchName || ""}
            serviceName={serviceName || ""}
            onLeave={handleLeave}
          />
        </Suspense>
      )}
    </div>
  );
}
