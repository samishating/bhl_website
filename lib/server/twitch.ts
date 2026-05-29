/**
 * lib/server/twitch.ts
 * SERVER-ONLY — All Twitch Helix API interactions happen here.
 * Exposes Twitch live statuses with in-memory caching to protect API quotas.
 */

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_HELIX_STREAMS_URL = 'https://api.twitch.tv/helix/streams';

// In-memory caching variables
let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

let cachedStreams: any[] | null = null;
let streamsCachedAt: number | null = null;

/**
 * Validates and extracts the Twitch username from a profile URL
 */
export function extractTwitchUsername(input?: string | null): string | null {
  if (!input) return null;

  let value = input.trim().toLowerCase();

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname !== "twitch.tv") return null;

    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length !== 1) return null;

    const username = parts[0];

    const blockedPaths = [
      "videos",
      "directory",
      "downloads",
      "jobs",
      "p",
      "settings",
      "subscriptions",
      "turbo",
      "wallet",
    ];

    if (blockedPaths.includes(username)) return null;

    if (!/^[a-z0-9_]{4,25}$/.test(username)) return null;

    return username;
  } catch {
    return null;
  }
}

/**
 * Retrieves a valid Twitch App Access Token using Client Credentials flow
 */
async function getTwitchAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Twitch client credentials missing in environment variables');
  }

  // Use cached token if valid
  const now = Date.now();
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  console.log('[Twitch API] Requesting new App Access Token...');
  const res = await fetch(
    `${TWITCH_TOKEN_URL}?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to obtain Twitch Access Token: ${res.statusText}`);
  }

  const data = await res.json();
  const token = data.access_token;
  const expiresIn = data.expires_in || 3600; // in seconds

  if (!token) {
    throw new Error('Token payload empty');
  }

  // Cache token
  cachedToken = token;
  tokenExpiresAt = Date.now() + expiresIn * 1000;

  return token;
}

/**
 * Fetches and resolves live streams for all eligible creators
 */
export async function getTwitchLiveStreams(): Promise<any[]> {
  try {
    const now = Date.now();
    // Return cached streams if fetched within last 60 seconds
    if (cachedStreams && streamsCachedAt && now - streamsCachedAt < 60000) {
      return cachedStreams;
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      console.warn('[Twitch API] Warning: TWITCH_CLIENT_ID is not configured.');
      return [];
    }

    await connectDB();

    // Query MongoDB for all public creators who have a Twitch link
    const creators = await User.find({
      isPublic: true,
      'socialLinks.twitch': { $exists: true, $ne: '' },
    }).select('_id username creatorDisplayName socialLinks').lean();

    if (creators.length === 0) {
      cachedStreams = [];
      streamsCachedAt = Date.now();
      return [];
    }

    // Map creator IDs and extract valid Twitch usernames
    const creatorMap = new Map<string, any>();
    const usernamesToFetch: string[] = [];

    for (const c of creators) {
      const twitchUrl = c.socialLinks?.twitch;
      const username = extractTwitchUsername(twitchUrl);
      if (username) {
        usernamesToFetch.push(username);
        creatorMap.set(username, {
          id: c._id.toString(),
          displayName: c.creatorDisplayName || c.username,
        });
      }
    }

    if (usernamesToFetch.length === 0) {
      cachedStreams = [];
      streamsCachedAt = Date.now();
      return [];
    }

    // Obtain Access Token
    const accessToken = await getTwitchAccessToken();

    // Chunk usernames into batches of 100 (Twitch Helix max is 100 per request)
    const chunkSize = 100;
    const liveStreams: any[] = [];

    for (let i = 0; i < usernamesToFetch.length; i += chunkSize) {
      const chunk = usernamesToFetch.slice(i, i + chunkSize);
      const params = chunk.map(username => `user_login=${encodeURIComponent(username)}`).join('&');
      const url = `${TWITCH_HELIX_STREAMS_URL}?${params}`;

      const res = await fetch(url, {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error(`[Twitch Helix] Streams fetch failed: ${res.statusText}`);
        continue;
      }

      const streamData = await res.json();
      const streams = streamData.data || [];

      for (const stream of streams) {
        const twitchLogin = stream.user_login.toLowerCase();
        const creator = creatorMap.get(twitchLogin);

        if (creator) {
          liveStreams.push({
            creatorId: creator.id,
            twitchLogin: stream.user_login,
            displayName: creator.displayName,
            title: stream.title || 'Live Stream',
            game: stream.game_name || 'Just Chatting',
            viewers: stream.viewer_count || 0,
            startedAt: stream.started_at,
            thumbnail: (stream.thumbnail_url || '')
              .replace('{width}', '1280')
              .replace('{height}', '720'),
            url: `https://twitch.tv/${stream.user_login}`,
          });
        }
      }
    }

    // Cache resulting streams
    cachedStreams = liveStreams;
    streamsCachedAt = Date.now();

    return liveStreams;

  } catch (err: any) {
    console.error('[Twitch API Service Failure]', err);
    // Fail-safe: Return cached streams or empty list to prevent crash
    return cachedStreams || [];
  }
}
