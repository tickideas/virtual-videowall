"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.type === "rate_limit") {
          throw new Error(
            data.error ||
              "Too many login attempts. Please wait a few minutes before trying again.",
          );
        }
        throw new Error(data.error || "Login failed");
      }

      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md sm:max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl bg-white/20 backdrop-blur-sm mx-auto mb-6 flex items-center justify-center">
            <Shield className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Admin Portal
          </h1>
          <p className="text-blue-100 text-base lg:text-lg">
            Secure access to manage your video wall services
          </p>
        </div>
        
        <div className="p-8 sm:p-10 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="h-12 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="h-12 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Sign In to Portal
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
