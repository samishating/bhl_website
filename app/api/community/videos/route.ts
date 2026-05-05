import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CreatorVideo } from '@/models/CreatorVideo';
import { User } from '@/models/User';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 20);
    const featuredOnly = searchParams.get('featured') === 'true';

    // Get IDs of eligible public creators
    const eligibleCreators = await User.find({
      isPublic: true,
      $or: [
        { isFeatured: true },
        { divisions: { $in: ['content', 'gaming', 'music'] } },
      ],
    }).select('_id username avatar divisions creatorDisplayName level xp isFeatured')
      .sort({ xp: -1 })
      .lean();

    const eligibleIds = eligibleCreators.map(u => u._id);
    const creatorMap = new Map(eligibleCreators.map(u => [u._id.toString(), u]));

    const filter: any = {
      userId: { $in: eligibleIds },
      isHidden: false,
    };

    const allVideos = await CreatorVideo.find(filter)
      .sort({ publishedAt: -1 })
      .lean();

    // Group videos by creator
    const groupedVideosMap = new Map<string, any[]>();
    for (const v of allVideos) {
      const creatorIdStr = v.userId.toString();
      if (!groupedVideosMap.has(creatorIdStr)) {
        groupedVideosMap.set(creatorIdStr, []);
      }
      const creatorVideos = groupedVideosMap.get(creatorIdStr)!;
      if (creatorVideos.length < 5) {
        creatorVideos.push({
          videoId: v.videoId,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          publishedAt: v.publishedAt,
          isFeatured: v.isFeatured,
        });
      }
    }

    const featuredGroups: any[] = [];
    const latestGroups: any[] = [];

    // Order groups by the initial Level/XP sort of the creators
    for (const creator of eligibleCreators) {
      const creatorIdStr = creator._id.toString();
      const videos = groupedVideosMap.get(creatorIdStr);
      if (videos && videos.length > 0) {
        const groupObj = {
          creator: {
            username: creator.username,
            creatorDisplayName: creator.creatorDisplayName || creator.username,
            avatar: creator.avatar,
            divisions: creator.divisions,
          },
          videos,
        };

        latestGroups.push(groupObj);
        if (creator.isFeatured) {
          featuredGroups.push(groupObj);
        }
      }
    }

    return NextResponse.json({ featuredGroups, latestGroups });
  } catch (err: any) {
    console.error('[Community Videos]', err);
    return NextResponse.json({ error: 'Failed to load videos' }, { status: 500 });
  }
}
