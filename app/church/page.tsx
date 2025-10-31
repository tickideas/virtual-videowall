"use client";

import { useState, Suspense, lazy } from "react";
import { ChurchJoinForm } from "@/components/church/church-join-form";
import { ArrowLeft, Video, Grid3x3, Zap, Shield, Users } from "lucide-react";
import Link from "next/link";
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
    <div className="min-h-screen bg-slate-50">
      {!token ? (
        <Suspense fallback={<ChurchJoinSkeleton />}>
          {/* Header */}
          <header className="bg-white border-b border-slate-200 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
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
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 mb-6">
                  <Video className="w-4 h-4" />
                  Join Your Zonal Service
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                  Connect to the Video Wall
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Join your church to the virtual video wall for seamless zonal meetings. 
                  Enter your service code and church name to get started.
                </p>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="text-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Low Bandwidth</h3>
                  <p className="text-sm text-slate-600">Optimized for 300-500 Kbps connections</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Secure Connection</h3>
                  <p className="text-sm text-slate-600">Your privacy and data are protected</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Real-time Sync</h3>
                  <p className="text-sm text-slate-600">Connect with up to 60 churches live</p>
                </div>
              </div>

              {/* Join Form */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Join the Service
                  </h2>
                  <p className="text-blue-100">
                    Enter your details to connect to the video wall
                  </p>
                </div>
                <div className="p-8">
                  <ChurchJoinForm onJoined={handleJoined} />
                </div>
              </div>

              {/* Help Section */}
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500 mb-4">
                  Need help getting started?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Audio is disabled by default
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Video quality adapts automatically
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    Works on all devices
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Suspense>
      ) : (
        <Suspense fallback={<PageLoadingSpinner message="Loading video room..." />}>
          <ChurchRoom
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
