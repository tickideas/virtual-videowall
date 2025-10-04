"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Grid3x3, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WallLandingPage() {
  const [sessionCode, setSessionCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionCode.length === 6) {
      router.push(`/wall/${sessionCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="container max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-400 hover:text-gray-200 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
            <Grid3x3 className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Video Wall Display
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Enter the service code to view the connected churches
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
                className="text-center text-2xl tracking-widest font-mono h-14"
              />
              <p className="text-xs text-gray-500 text-center">
                6-digit service code
              </p>
            </div>

            <Button
              type="submit"
              disabled={sessionCode.length !== 6}
              className="w-full h-12 text-base"
            >
              <Grid3x3 className="w-5 h-5" />
              Open Video Wall
            </Button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 font-medium mb-2">
              Display Features:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Paginated view (20 churches per page)</li>
              <li>• Auto-navigation between pages</li>
              <li>• Fullscreen mode available</li>
              <li>• Optimized for 6-8 Mbps connection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
