"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { VALIDATION } from "@/lib/constants";
import { retryFetch } from "@/lib/retry";

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
  const [fieldErrors, setFieldErrors] = useState<{
    sessionCode?: string;
    churchName?: string;
  }>({});
  const [isValidating, setIsValidating] = useState(false);
  const submittingRef = useRef(false);

  const validateSessionCode = (code: string) => {
    if (code.length === 0) return "";
    if (code.length < VALIDATION.SESSION_CODE_LENGTH)
      return `Service code must be ${VALIDATION.SESSION_CODE_LENGTH} characters`;
    if (!/^[A-Z0-9]+$/.test(code))
      return "Service code can only contain letters and numbers";
    return "";
  };

  const validateChurchName = (name: string) => {
    if (name.length === 0) return "";
    if (name.trim().length < VALIDATION.CHURCH_NAME_MIN_LENGTH)
      return `Church name must be at least ${VALIDATION.CHURCH_NAME_MIN_LENGTH} characters`;
    if (name.trim().length > VALIDATION.CHURCH_NAME_MAX_LENGTH)
      return `Church name must be less than ${VALIDATION.CHURCH_NAME_MAX_LENGTH} characters`;
    return "";
  };

  useEffect(() => {
    const sessionCodeError = validateSessionCode(sessionCode);
    const churchNameError = validateChurchName(churchName);

    setFieldErrors({
      sessionCode: sessionCodeError,
      churchName: churchNameError,
    });
  }, [sessionCode, churchName]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent double submission
      if (submittingRef.current) {
        return;
      }

      setError("");
      setFieldErrors({});
      setLoading(true);
      submittingRef.current = true;

      const sessionCodeError = validateSessionCode(sessionCode);
      const churchNameError = validateChurchName(churchName);

      if (sessionCodeError || churchNameError) {
        setFieldErrors({
          sessionCode: sessionCodeError,
          churchName: churchNameError,
        });
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      try {
        // Use retry logic for joining session
        const joinResponse = await retryFetch(
          "/api/session/join",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionCode: sessionCode.toUpperCase(),
              churchName: churchName.trim(),
            }),
          },
          {
            maxAttempts: 3,
            initialDelayMs: 1000,
          },
        );

        if (!joinResponse.ok) {
          const data = await joinResponse.json();
          if (data.type === "rate_limit") {
            throw new Error(
              data.error ||
                "Too many connection attempts. Please wait a few minutes before trying again.",
            );
          }
          throw new Error(data.error || "Failed to join session");
        }

        const joinData = await joinResponse.json();

        // Use retry logic for getting token
        const tokenResponse = await retryFetch(
          "/api/livekit/token",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionCode: sessionCode.toUpperCase(),
              churchName: churchName.trim(),
              participantType: "church",
            }),
          },
          {
            maxAttempts: 3,
            initialDelayMs: 1000,
          },
        );

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
        setError(
          err instanceof Error
            ? err.message
            : "Failed to join. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
        submittingRef.current = false;
      }
    },
    [sessionCode, churchName, onJoined],
  );

  const isFormValid =
    sessionCode.length === VALIDATION.SESSION_CODE_LENGTH &&
    churchName.trim().length >= VALIDATION.CHURCH_NAME_MIN_LENGTH &&
    !fieldErrors.sessionCode &&
    !fieldErrors.churchName &&
    !loading;

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="space-y-8"
        noValidate
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label
              htmlFor="sessionCode"
              className="text-sm font-medium text-slate-700"
            >
              Service Code
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            </Label>
            <div className="relative">
              <Input
                id="sessionCode"
                type="text"
                placeholder="ABC123"
                value={sessionCode}
                onChange={(e) => {
                  setIsValidating(true);
                  setSessionCode(
                    e.target.value
                      .toUpperCase()
                      .slice(0, VALIDATION.SESSION_CODE_LENGTH),
                  );
                }}
                maxLength={VALIDATION.SESSION_CODE_LENGTH}
                required
                aria-required="true"
                aria-describedby="sessionCode-error sessionCode-help"
                aria-invalid={!!fieldErrors.sessionCode}
                className={`text-center text-lg font-mono tracking-widest h-12 ${
                  fieldErrors.sessionCode
                    ? "border-red-500 focus:border-red-500"
                    : sessionCode.length === VALIDATION.SESSION_CODE_LENGTH &&
                        !fieldErrors.sessionCode
                      ? "border-emerald-500 focus:border-emerald-500"
                      : "border-slate-300 focus:border-blue-500"
                }`}
                disabled={loading}
              />
              {isValidating &&
                sessionCode.length === VALIDATION.SESSION_CODE_LENGTH &&
                !fieldErrors.sessionCode && (
                  <div
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    aria-hidden="true"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              {fieldErrors.sessionCode && (
                <div
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  aria-hidden="true"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            <p
              id="sessionCode-help"
              className="text-xs text-slate-500"
            >
              6-character code provided by the admin
            </p>
            {fieldErrors.sessionCode && (
              <p
                id="sessionCode-error"
                className="text-sm text-red-600 flex items-center gap-1"
                role="alert"
              >
                <AlertCircle
                  className="w-4 h-4"
                  aria-hidden="true"
                />
                {fieldErrors.sessionCode}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="churchName"
              className="text-sm font-medium text-slate-700"
            >
              Your Church Name
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
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
                className={`text-base h-12 ${
                  fieldErrors.churchName
                    ? "border-red-500 focus:border-red-500"
                    : churchName.trim().length >=
                          VALIDATION.CHURCH_NAME_MIN_LENGTH &&
                        !fieldErrors.churchName
                      ? "border-emerald-500 focus:border-emerald-500"
                      : "border-slate-300 focus:border-blue-500"
                }`}
                disabled={loading}
              />
              {isValidating &&
                churchName.trim().length >=
                  VALIDATION.CHURCH_NAME_MIN_LENGTH &&
                !fieldErrors.churchName && (
                  <div
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    aria-hidden="true"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              {fieldErrors.churchName && (
                <div
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  aria-hidden="true"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            <p
              id="churchName-help"
              className="text-xs text-slate-500"
            >
              This name will be displayed on the video wall
            </p>
            {fieldErrors.churchName && (
              <p
                id="churchName-error"
                className="text-sm text-red-600 flex items-center gap-1"
                role="alert"
              >
                <AlertCircle
                  className="w-4 h-4"
                  aria-hidden="true"
                />
                {fieldErrors.churchName}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-xl p-4"
            role="alert"
          >
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle
                className="w-4 h-4"
                aria-hidden="true"
              />
              {error}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={!isFormValid}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          aria-describedby={isFormValid ? "" : "submit-help"}
        >
          {loading ? (
            <>
              <Loader2
                className="w-5 h-5 animate-spin mr-2"
                aria-hidden="true"
              />
              Joining Service...
            </>
          ) : (
            <>
              <Video
                className="w-5 h-5 mr-2"
                aria-hidden="true"
              />
              Join Service
            </>
          )}
        </Button>

        {!isFormValid && (
          <p
            id="submit-help"
            className="text-sm text-slate-500 text-center"
          >
            Please fill in all required fields correctly to continue
          </p>
        )}
      </form>
    </div>
  );
}
