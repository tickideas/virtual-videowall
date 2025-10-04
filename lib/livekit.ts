import { AccessToken } from "livekit-server-sdk";

function getLiveKitCredentials() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set");
  }

  return { apiKey, apiSecret };
}

export interface CreateTokenOptions {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
}

export async function createLiveKitToken({
  roomName,
  participantName,
  participantIdentity,
  canPublish = true,
  canSubscribe = true,
}: CreateTokenOptions): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitCredentials();

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe,
  });

  const token = await at.toJwt();
  return token;
}

export const ROOM_OPTIONS = {
  videoCaptureDefaults: {
    resolution: {
      width: 240,
      height: 180,
    },
    frameRate: 8,
  },
  audioCaptureDefaults: {
    autoGainControl: false,
    echoCancellation: false,
    noiseSuppression: false,
  },
  adaptiveStream: true,
  dynacast: true,
};

export const CHURCH_TRACK_OPTIONS = {
  video: {
    enabled: true,
  },
  audio: {
    enabled: false,
  },
};

export const WALL_TRACK_OPTIONS = {
  videoQuality: "low" as const,
  audio: false,
};
