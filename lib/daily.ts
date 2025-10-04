/**
 * Daily.co API utilities for Virtual Video Wall
 * 
 * This file handles all Daily.co room and token management.
 * Replace this with your Daily.co API key from https://dashboard.daily.co/
 */

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN || process.env.NEXT_PUBLIC_DAILY_DOMAIN;

if (!DAILY_API_KEY) {
  console.warn("Warning: DAILY_API_KEY is not set. Daily.co features will not work.");
}

if (!DAILY_DOMAIN) {
  console.warn("Warning: DAILY_DOMAIN is not set. Using default domain.");
}

export interface CreateRoomOptions {
  roomName: string;
  maxParticipants?: number;
}

export interface CreateTokenOptions {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
}

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  api_created: boolean;
  privacy: string;
  config: Record<string, unknown>;
}

/**
 * Create or get a Daily.co room
 */
export async function createOrGetDailyRoom({
  roomName,
  maxParticipants = 65,
}: CreateRoomOptions): Promise<DailyRoom> {
  try {
    // First, try to get the existing room
    const getResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (getResponse.ok) {
      return await getResponse.json();
    }

    // Room doesn't exist, create it
    const createResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public',
        properties: {
          max_participants: maxParticipants,
          enable_screenshare: false,
          enable_chat: false,
          enable_knocking: false,
          enable_prejoin_ui: false,
          // Video quality settings for low bandwidth
          start_video_off: false,
          start_audio_off: true, // Audio off by default
        },
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create Daily.co room: ${error}`);
    }

    return await createResponse.json();
  } catch (error) {
    console.error('Error creating/getting Daily.co room:', error);
    throw error;
  }
}

/**
 * Create a Daily.co meeting token for a participant
 */
export async function createDailyToken({
  roomName,
  participantName,
  participantIdentity,
  canPublish = true,
  canSubscribe = true,
}: CreateTokenOptions): Promise<string> {
  try {
    const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: participantName,
          user_id: participantIdentity,
          enable_screenshare: false,
          enable_recording: false,
          // Control publish/subscribe permissions
          is_owner: canPublish && canSubscribe,
          // Custom permissions
          start_video_off: !canPublish,
          start_audio_off: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Daily.co token: ${error}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error creating Daily.co token:', error);
    throw error;
  }
}

/**
 * Delete a Daily.co room (cleanup)
 */
export async function deleteDailyRoom(roomName: string): Promise<void> {
  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      console.error(`Failed to delete Daily.co room: ${error}`);
    }
  } catch (error) {
    console.error('Error deleting Daily.co room:', error);
  }
}

/**
 * Get Daily.co room URL
 */
export function getDailyRoomUrl(roomName: string): string {
  return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
}

/**
 * Video quality settings for low bandwidth (240x180 @ 8fps)
 */
export const DAILY_VIDEO_SETTINGS = {
  width: 240,
  height: 180,
  frameRate: 8,
  facingMode: 'user',
};

/**
 * Audio settings (disabled by default)
 */
export const DAILY_AUDIO_SETTINGS = {
  echoCancellation: false,
  autoGainControl: false,
  noiseSuppression: false,
};
