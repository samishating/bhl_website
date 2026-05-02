import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SystemSettings } from '@/models/SystemSettings';
import { verifyAdmin } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    await connectDB();
    const { progression } = await req.json();

    if (!Array.isArray(progression)) {
      return NextResponse.json({ error: 'Invalid progression data format' }, { status: 400 });
    }

    // Basic validation: Ensure levels are sequential and XP is increasing
    const sorted = [...progression].sort((a, b) => a.level - b.level);
    
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].xpRequired <= sorted[i-1].xpRequired) {
        return NextResponse.json({ 
          error: `Level ${sorted[i].level} must require more XP than Level ${sorted[i-1].level}` 
        }, { status: 400 });
      }
    }

    let settings = await SystemSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new SystemSettings({ key: 'main' });
    }

    settings.levelProgression = sorted;
    await settings.save();

    // Trigger revalidation for any cached progression data
    try {
      revalidateTag('progression', 'layout');
    } catch (e) {
      // revalidateTag might not work in all environments, but we try
    }

    return NextResponse.json({ 
      message: 'Progression system updated successfully', 
      progression: settings.levelProgression 
    });
  } catch (err) {
    console.error('[PROGRESSION_PATCH_ERROR]', err);
    return NextResponse.json({ error: 'Server error during progression update' }, { status: 500 });
  }
}
