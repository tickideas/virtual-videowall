"use client";

import { use, useEffect, useState } from "react";
import { WallDisplay } from "@/components/wall/wall-display-daily";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  sessionCode: string;
  active: boolean;
  sessions: Array<{
    id: string;
    church: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

export default function WallPage({
  params,
}: {
  params: Promise<{ sessionCode: string }>;
}) {
  const resolvedParams = use(params);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/service/${resolvedParams.sessionCode}`);
        if (!response.ok) {
          throw new Error("Service not found");
        }
        const data = await response.json();
        setService(data.service);

        const tokenResponse = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionCode: resolvedParams.sessionCode,
            participantType: "viewer",
          }),
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          setToken(tokenData.token);
          setRoomUrl(tokenData.roomUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
    const interval = setInterval(fetchService, 5000);
    return () => clearInterval(interval);
  }, [resolvedParams.sessionCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading service...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error || "Service not found"}</p>
          <Link href="/" className="text-blue-400 hover:underline">
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!token || !roomUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Connecting to video wall...</p>
        </div>
      </div>
    );
  }

  return (
    <WallDisplay
      token={token}
      roomUrl={roomUrl}
      serviceName={service.name}
      sessionCode={resolvedParams.sessionCode}
    />
  );
}
