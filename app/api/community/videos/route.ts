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
    }).select('_id username avatar divisions creatorDisplayName displayOrder');

    const eligibleIds = eligibleCreators.map(u => u._id);
    const creatorMap = new Map(eligibleCreators.map(u => [u._id.toString(), u]));

    const filter: any = {
      userId: { $in: eligibleIds },
      isHidden: false,
    };
    if (featuredOnly) filter.isFeatured = true;

    const videos = await CreatorVideo.find(filter)
      .sort({ isFeatured: -1, publishedAt: -1 })
      .limit(limit)
      .lean();

    const response = videos.map(v => {
      const creator = creatorMap.get(v.userId.toString());
      return {
        videoId: v.videoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        videoUrl: v.videoUrl,
        publishedAt: v.publishedAt,
        isFeatured: v.isFeatured,
        creator: creator ? {
          username: creator.username,
          creatorDisplayName: creator.creatorDisplayName || creator.username,
          avatar: creator.avatar,
          divisions: creator.divisions,
        } : null,
      };
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[Community Videos]', err);
    return NextResponse.json({ error: 'Failed to load videos' }, { status: 500 });
  }
}
