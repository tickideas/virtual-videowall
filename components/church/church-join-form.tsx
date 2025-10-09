"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Loader2, AlertCircle, CheckCircle } from "lucide-react";

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
  const [fieldErrors, setFieldErrors] = useState<{sessionCode?: string; churchName?: string}>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateSessionCode = (code: string) => {
    if (code.length === 0) return "";
    if (code.length < 6) return "Service code must be 6 characters";
    if (!/^[A-Z0-9]+$/.test(code)) return "Service code can only contain letters and numbers";
    return "";
  };

  const validateChurchName = (name: string) => {
    if (name.length === 0) return "";
    if (name.trim().length < 2) return "Church name must be at least 2 characters";
    if (name.trim().length > 100) return "Church name must be less than 100 characters";
    return "";
  };

  useEffect(() => {
    const sessionCodeError = validateSessionCode(sessionCode);
    const churchNameError = validateChurchName(churchName);

    setFieldErrors({
      sessionCode: sessionCodeError,
      churchName: churchNameError
    });
  }, [sessionCode, churchName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    const sessionCodeError = validateSessionCode(sessionCode);
    const churchNameError = validateChurchName(churchName);

    if (sessionCodeError || churchNameError) {
      setFieldErrors({ sessionCode: sessionCodeError, churchName: churchNameError });
      setLoading(false);
      return;
    }

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
        if (data.type === 'rate_limit') {
          throw new Error(data.error || "Too many connection attempts. Please wait a few minutes before trying again.");
        }
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

  const isFormValid = sessionCode.length === 6 && churchName.trim().length >= 2 &&
                     !fieldErrors.sessionCode && !fieldErrors.churchName && !loading;

  return (
    <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-6" aria-hidden="true">
          <Video className="w-8 h-8 text-blue-600" />
        </div>

        <header>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Join the Zonal Videowall
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Enter your codes to connect to the service
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sessionCode" className="text-sm sm:text-base font-medium">
              Service Code
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            </Label>
            <div className="relative">
              <Input
                id="sessionCode"
                type="text"
                placeholder="ABC123"
                value={sessionCode}
                onChange={(e) => {
                  setIsValidating(true);
                  setSessionCode(e.target.value.toUpperCase().slice(0, 6));
                }}
                maxLength={6}
                required
                aria-required="true"
                aria-describedby="sessionCode-error sessionCode-help"
                aria-invalid={!!fieldErrors.sessionCode}
                className={`text-center text-lg sm:text-xl tracking-widest font-mono h-12 sm:h-auto pr-10 ${
                  fieldErrors.sessionCode ? 'border-red-500 focus:border-red-500' :
                  sessionCode.length === 6 && !fieldErrors.sessionCode ? 'border-green-500 focus:border-green-500' : ''
                }`}
                disabled={loading}
              />
              {isValidating && sessionCode.length === 6 && !fieldErrors.sessionCode && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-hidden="true">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
              {fieldErrors.sessionCode && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-hidden="true">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            <p id="sessionCode-help" className="text-xs text-gray-500">
              6-digit code provided by the admin
            </p>
            {fieldErrors.sessionCode && (
              <p id="sessionCode-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                {fieldErrors.sessionCode}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="churchName" className="text-sm sm:text-base font-medium">
              Your Church Name
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            </Label>
            <div className="relative">
              <Input
                id="churchName"
                type="text"
                placeholder="Loveworld Telford"
                value={churchName}
                onChange={(e) => {
                  setIsValidating(true);
                  setChurchName(e.target.value);
                }}
                required
                aria-required="true"
                aria-describedby="churchName-error churchName-help"
                aria-invalid={!!fieldErrors.churchName}
                className={`text-base h-12 sm:h-auto pr-10 ${
                  fieldErrors.churchName ? 'border-red-500 focus:border-red-500' :
                  churchName.trim().length >= 2 && !fieldErrors.churchName ? 'border-green-500 focus:border-green-500' : ''
                }`}
                disabled={loading}
              />
              {isValidating && churchName.trim().length >= 2 && !fieldErrors.churchName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-hidden="true">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
              {fieldErrors.churchName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-hidden="true">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            <p id="churchName-help" className="text-xs text-gray-500">
              This name will be displayed on the video wall
            </p>
            {fieldErrors.churchName && (
              <p id="churchName-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                {fieldErrors.churchName}
              </p>
            )}
          </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4" role="alert">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!isFormValid}
            className="w-full h-12 sm:h-auto text-sm sm:text-base py-3"
            aria-describedby={isFormValid ? '' : 'submit-help'}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" aria-hidden="true" />
                Joining...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-2" aria-hidden="true" />
                Join Service
              </>
            )}
          </Button>

          {!isFormValid && (
            <p id="submit-help" className="text-xs text-gray-500 text-center">
              Please fill in all required fields correctly to continue
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
