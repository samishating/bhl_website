/**
 * lib/server/youtube.ts
 * SERVER-ONLY — never import this from client components or pages.
 * All YouTube API calls happen here. The frontend only reads cached DB records.
 *
 * Cron schedule: daily at 04:00 UTC ≈ 05:00 Morocco time (UTC+1).
 * Quota budget: ~2 units per creator (channels.list + playlistItems.list).
 *               YouTube free tier: 10,000 units/day.
 */

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { CreatorVideo } from '@/models/CreatorVideo';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// ---------------------------------------------------------------------------
// URL / handle parsing
// ---------------------------------------------------------------------------

export function extractHandleOrChannelId(url: string): { channelId?: string; handle?: string } {
  if (!url) return {};
  // /channel/UC...
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelMatch) return { channelId: channelMatch[1] };
  // /@Handle
  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch) return { handle: handleMatch[1] };
  // /c/CustomName or /user/Name
  const legacyMatch = url.match(/youtube\.com\/(?:c|user)\/([a-zA-Z0-9_.-]+)/);
  if (legacyMatch) return { handle: legacyMatch[1] };
  return {};
}

// ---------------------------------------------------------------------------
// Channel resolution — returns { channelId, uploadsPlaylistId }
// ---------------------------------------------------------------------------

export async function resolveChannel(opts: {
  youtubeUrl?: string;
  youtubeHandle?: string;
  youtubeChannelId?: string;
}): Promise<{ channelId: string; uploadsPlaylistId: string } | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set');

  let channelId = opts.youtubeChannelId || '';
  let handle = opts.youtubeHandle || '';

  // Parse from URL if no direct channelId/handle
  if (!channelId && !handle && opts.youtubeUrl) {
    const parsed = extractHandleOrChannelId(opts.youtubeUrl);
    if (parsed.channelId) channelId = parsed.channelId;
    else if (parsed.handle) handle = parsed.handle;
  }

  let apiUrl = '';
  if (channelId) {
    apiUrl = `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${apiKey}`;
  } else if (handle) {
    apiUrl = `${YOUTUBE_API_BASE}/channels?part=contentDetails&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
  } else {
    return null;
  }

  const res = await fetch(apiUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`channels.list failed: ${res.status}`);
  const data = await res.json();

  const channel = data.items?.[0];
  if (!channel) return null;

  const resolvedChannelId = channel.id as string;
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads as string;

  if (!resolvedChannelId || !uploadsPlaylistId) return null;
  return { channelId: resolvedChannelId, uploadsPlaylistId };
}

// ---------------------------------------------------------------------------
// Fetch latest videos via playlistItems.list (1 quota unit)
// ---------------------------------------------------------------------------

interface RawVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedAt: string;
}

export async function fetchLatestVideos(
  uploadsPlaylistId: string,
  maxResults = 5
): Promise<RawVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set');

  const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=${maxResults}&key=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`playlistItems.list failed: ${res.status}`);
  const data = await res.json();

  return (data.items || []).map((item: any) => {
    const snippet = item.snippet;
    const videoId = snippet?.resourceId?.videoId || item.contentDetails?.videoId || '';
    const thumb = snippet?.thumbnails?.maxres?.url
      || snippet?.thumbnails?.high?.url
      || snippet?.thumbnails?.medium?.url
      || '';
    return {
      videoId,
      title: snippet?.title || '',
      description: snippet?.description || '',
      thumbnailUrl: thumb,
      videoUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
      publishedAt: snippet?.publishedAt || new Date().toISOString(),
    };
  }).filter((v: RawVideo) => v.videoId);
}

// ---------------------------------------------------------------------------
// Sync a single creator
// ---------------------------------------------------------------------------

export interface SyncCreatorResult {
  userId: string;
  username: string;
  videosFetched: number;
  videosInserted: number;
  videosUpdated: number;
  error?: string;
}

export async function syncCreator(userId: string): Promise<SyncCreatorResult> {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) return { userId, username: '?', videosFetched: 0, videosInserted: 0, videosUpdated: 0, error: 'User not found' };

  const result: SyncCreatorResult = {
    userId,
    username: user.username,
    videosFetched: 0,
    videosInserted: 0,
    videosUpdated: 0,
  };

  try {
    // Resolve channel (uses stored channelId if available — 0 API calls)
    let channelId = user.youtubeChannelId || '';
    let uploadsPlaylistId = user.youtubeUploadsPlaylistId || '';

    if (!channelId || !uploadsPlaylistId) {
      const resolved = await resolveChannel({
        youtubeUrl: user.socialLinks?.youtube || '',
        youtubeHandle: user.youtubeHandle || '',
        youtubeChannelId: user.youtubeChannelId || '',
      });
      if (!resolved) {
        result.error = 'Could not resolve YouTube channel';
        return result;
      }
      channelId = resolved.channelId;
      uploadsPlaylistId = resolved.uploadsPlaylistId;

      // Cache resolved IDs on the user record
      await User.findByIdAndUpdate(userId, {
        youtubeChannelId: channelId,
        youtubeUploadsPlaylistId: uploadsPlaylistId,
      });
    }

    // Fetch latest videos
    const videos = await fetchLatestVideos(uploadsPlaylistId, 5);
    result.videosFetched = videos.length;

    for (const v of videos) {
      const existing = await CreatorVideo.findOne({ videoId: v.videoId });
      if (existing) {
        // Update metadata but PRESERVE isFeatured and isHidden
        await CreatorVideo.updateOne(
          { videoId: v.videoId },
          {
            $set: {
              title: v.title,
              description: v.description,
              thumbnailUrl: v.thumbnailUrl,
              videoUrl: v.videoUrl,
              publishedAt: new Date(v.publishedAt),
            }
          }
        );
        result.videosUpdated++;
      } else {
        await CreatorVideo.create({
          videoId: v.videoId,
          userId: user._id,
          channelId,
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          publishedAt: new Date(v.publishedAt),
        });
        result.videosInserted++;
      }
    }

    // Update last synced timestamp
    await User.findByIdAndUpdate(userId, { youtubeLastSynced: new Date() });

  } catch (err: any) {
    result.error = err?.message || 'Unknown error';
  }

  return result;
}

// ---------------------------------------------------------------------------
// Sync ALL eligible creators
// ---------------------------------------------------------------------------

export interface SyncAllResult {
  creatorsChecked: number;
  creatorsSynced: number;
  videosFetched: number;
  videosInserted: number;
  videosUpdated: number;
  errors: { userId: string; username: string; reason: string }[];
}

export async function syncAllCreators(): Promise<SyncAllResult> {
  await connectDB();

  // Eligible: public + (featured OR content/gaming/music division) + has a YouTube link
  const eligible = await User.find({
    isPublic: true,
    $and: [
      {
        $or: [
          { isFeatured: true },
          { divisions: { $in: ['content', 'gaming', 'music'] } },
        ],
      },
      {
        $or: [
          { youtubeChannelId: { $ne: '' } },
          { youtubeHandle: { $ne: '' } },
          { 'socialLinks.youtube': { $ne: '' } },
        ],
      },
    ],
  }).select('_id username youtubeChannelId youtubeUploadsPlaylistId youtubeHandle socialLinks');

  const summary: SyncAllResult = {
    creatorsChecked: eligible.length,
    creatorsSynced: 0,
    videosFetched: 0,
    videosInserted: 0,
    videosUpdated: 0,
    errors: [],
  };

  for (const user of eligible) {
    // Check if any YouTube link exists
    const hasYouTube = user.youtubeChannelId || user.youtubeHandle || user.socialLinks?.youtube;
    if (!hasYouTube) continue;

    const res = await syncCreator(user._id.toString());
    summary.videosFetched += res.videosFetched;
    summary.videosInserted += res.videosInserted;
    summary.videosUpdated += res.videosUpdated;

    if (res.error) {
      summary.errors.push({ userId: res.userId, username: res.username, reason: res.error });
    } else {
      summary.creatorsSynced++;
    }
  }

  return summary;
}
