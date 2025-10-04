"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Loader2 } from "lucide-react";

interface ChurchJoinFormProps {
  onJoined: (data: {
    token: string;
    roomUrl: string;
    churchName: string;
    serviceName: string;
  }) => void;
}

export function ChurchJoinForm({ onJoined }: ChurchJoinFormProps) {
  const [sessionCode, setSessionCode] = useState("");
  const [churchName, setChurchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const joinResponse = await fetch("/api/session/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode: sessionCode.toUpperCase(),
          churchName: churchName.trim(),
        }),
      });

      if (!joinResponse.ok) {
        const data = await joinResponse.json();
        throw new Error(data.error || "Failed to join session");
      }

      const joinData = await joinResponse.json();

      const tokenResponse = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode: sessionCode.toUpperCase(),
          churchName: churchName.trim(),
          participantType: "church",
        }),
      });

      if (!tokenResponse.ok) {
        const data = await tokenResponse.json();
        throw new Error(data.error || "Failed to get access token");
      }

      const tokenData = await tokenResponse.json();

      console.log('Token received from API:', typeof tokenData.token, tokenData.token?.substring?.(0, 20));
      console.log('Full tokenData:', tokenData);

      onJoined({
        token: tokenData.token,
        roomUrl: tokenData.roomUrl,
        churchName: joinData.church.name,
        serviceName: joinData.service.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-6">
          <Video className="w-8 h-8 text-blue-600" />
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Join the Zonal Videowall
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Enter your codes to connect to the service
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sessionCode">Service Code</Label>
            <Input
              id="sessionCode"
              type="text"
              placeholder="ABC123"
              value={sessionCode}
              onChange={(e) =>
                setSessionCode(e.target.value.toUpperCase().slice(0, 6))
              }
              maxLength={6}
              required
              className="text-center text-xl tracking-widest font-mono"
            />
            <p className="text-xs text-gray-500">
              6-digit code provided by the admin
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="churchName">Your Church Name</Label>
            <Input
              id="churchName"
              type="text"
              placeholder="Loveworld Telford"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              required
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              This name will be displayed on the video wall
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || sessionCode.length !== 6 || churchName.trim().length === 0}
            className="w-full h-12 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Join Service
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-2">
            Quick Setup:
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Get the 6-digit service code from your admin</li>
            <li>• Enter your church name exactly as you want it displayed</li>
            <li>• Allow camera access when prompted</li>
            <li>• Audio will be muted automatically</li>
            <li>• Minimum 300 Kbps upload speed recommended</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
