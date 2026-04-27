import { NextRequest, NextResponse } from 'next/server';

/**
 * Since Vercel (serverless) has a read-only filesystem, 
 * we use a Base64 approach here to store images directly in the database.
 * This ensures uploads work on Vercel without needing external storage like S3/Cloudinary.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Limit file size to 4MB for Base64 storage
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to Data URI
    const base64Image = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64Image}`;

    return NextResponse.json({ url: dataUri });
  } catch (err) {
    console.error('[Upload API Error]:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
