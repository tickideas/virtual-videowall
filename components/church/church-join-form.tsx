"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Loader2, AlertCircle, CheckCircle, Camera, Wifi } from "lucide-react";
import { VALIDATION } from "@/lib/constants";
import { retryFetch } from "@/lib/retry";

interface ChurchJoinFormProps {
  onJoined: (data: {
    sessionId: string;
    healthToken: string;
    token: string;
    roomUrl: string;
    churchName: string;
    serviceName: string;
  }) => void;
}

type ReadinessStatus = "idle" | "checking" | "pass" | "warning" | "fail";

interface ReadinessCheck {
  status: ReadinessStatus;
  camera: string;
  network: string;
  details: string;
}

export function ChurchJoinForm({ onJoined }: ChurchJoinFormProps) {
  const [sessionCode, setSessionCode] = useState("");
  const [churchName, setChurchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [readiness, setReadiness] = useState<ReadinessCheck>({
    status: "idle",
    camera: "Not checked",
    network: "Not checked",
    details: "Run a quick camera and network check before joining.",
  });
  const submittingRef = useRef(false);
  const previewRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

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

  const fieldErrors = useMemo(
    () => ({
      sessionCode: validateSessionCode(sessionCode),
      churchName: validateChurchName(churchName),
    }),
    [sessionCode, churchName],
  );

  useEffect(() => {
    return () => {
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    };
  }, []);

  const runReadinessCheck = useCallback(async () => {
    setReadiness({
      status: "checking",
      camera: "Checking camera",
      network: "Checking network",
      details: "Allow camera access when prompted.",
    });

    let cameraOk = false;
    let cameraLabel = "Camera unavailable";
    let networkLabel = "Network unknown";
    let warning = "";

    try {
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          frameRate: { ideal: 15, max: 15 },
        },
        audio: false,
      });

      previewStreamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
      }

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();
      cameraOk = Boolean(videoTrack);
      cameraLabel = settings?.width && settings?.height
        ? `Ready at ${settings.width}x${settings.height}`
        : "Camera ready";
    } catch (error) {
      cameraLabel = error instanceof Error ? error.message : "Camera permission failed";
    }

    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number };
    }).connection;

    if (connection) {
      const effectiveType = connection.effectiveType ?? "unknown";
      const downlink = typeof connection.downlink === "number" ? connection.downlink : 0;
      networkLabel = downlink > 0
        ? `${effectiveType.toUpperCase()} / ${downlink.toFixed(1)} Mbps`
        : effectiveType.toUpperCase();

      if (effectiveType === "slow-2g" || effectiveType === "2g") {
        warning = "Network is very limited. The app will use its lowest video profile.";
      }
    } else {
      networkLabel = "Browser does not expose network estimate";
      warning = "Network estimate is unavailable; continue if the camera preview is stable.";
    }

    setReadiness({
      status: cameraOk ? (warning ? "warning" : "pass") : "fail",
      camera: cameraLabel,
      network: networkLabel,
      details: cameraOk
        ? warning || "Camera preview is working and audio remains disabled."
        : "Camera access is required before this church can go live.",
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent double submission
      if (submittingRef.current) {
        return;
      }

      setError("");
      setLoading(true);
      submittingRef.current = true;

      const sessionCodeError = validateSessionCode(sessionCode);
      const churchNameError = validateChurchName(churchName);

      if (sessionCodeError || churchNameError) {
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
          "/api/daily/token",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionCode: sessionCode.toUpperCase(),
              churchName: churchName.trim(),
              sessionId: joinData.session.id,
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

        previewStreamRef.current?.getTracks().forEach((track) => track.stop());
        previewStreamRef.current = null;

        onJoined({
          sessionId: joinData.session.id,
          healthToken: joinData.healthToken,
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

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
            <div className="h-48 w-full overflow-hidden rounded-lg bg-slate-900 sm:h-56 lg:h-auto lg:aspect-[4/3]">
              <video
                ref={previewRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Pre-Meeting Readiness
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {readiness.details}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={runReadinessCheck}
                  disabled={readiness.status === "checking" || loading}
                  className="shrink-0 gap-2"
                >
                  {readiness.status === "checking" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  Check Setup
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm">
                  <Camera className="h-4 w-4 text-slate-500" />
                  <span className="min-w-0 break-words text-slate-700">{readiness.camera}</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm">
                  <Wifi className="h-4 w-4 text-slate-500" />
                  <span className="min-w-0 break-words text-slate-700">{readiness.network}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

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
