import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/posts/upload — returns a Supabase signed upload URL.
 *
 * Why not stream the file through this route? Vercel's Node functions cap
 * request bodies around 4.5MB, which kills video uploads. Signed URLs let
 * the client PUT directly to Supabase storage, no proxy.
 *
 * Body:  { ext: 'mp4'|'jpg'|..., contentType: 'video/mp4'|'image/jpeg', mediaType: 'video'|'image' }
 * Reply: { uploadUrl, publicUrl, path, mediaType }
 *
 * The client then:
 *   PUT {uploadUrl} with the file body and matching Content-Type.
 *   Posts { image_url: publicUrl, media_type } to /api/posts.
 */

const ALLOWED_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const ALLOWED_VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'm4v']);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { ext?: string; contentType?: string; mediaType?: 'image' | 'video' };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }); }

  const ext = (body.ext ?? '').toLowerCase().replace(/^\./, '');
  const contentType = body.contentType ?? '';
  let mediaType: 'image' | 'video' | null = body.mediaType ?? null;

  if (!mediaType) {
    if (contentType.startsWith('video/')) mediaType = 'video';
    else if (contentType.startsWith('image/')) mediaType = 'image';
  }

  if (mediaType === 'image' && !ALLOWED_IMAGE_EXTS.has(ext)) {
    return NextResponse.json({ error: 'Unsupported image extension' }, { status: 400 });
  }
  if (mediaType === 'video' && !ALLOWED_VIDEO_EXTS.has(ext)) {
    return NextResponse.json({ error: 'Unsupported video extension' }, { status: 400 });
  }
  if (!mediaType) {
    return NextResponse.json({ error: 'Could not determine media type' }, { status: 400 });
  }

  const path = `${session.user.id}/${Date.now()}.${ext}`;

  // First attempt
  let { data, error } = await supabase
    .storage
    .from('posts')
    .createSignedUploadUrl(path);

  // Bucket may not exist yet — Supabase returns
  // "The related resource does not exist". Auto-create it (public read) and retry.
  if (error && /not exist|not found/i.test(error.message)) {
    const { error: createErr } = await supabase.storage.createBucket('posts', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    if (createErr && !/already exists/i.test(createErr.message)) {
      return NextResponse.json(
        { error: `Could not create 'posts' storage bucket: ${createErr.message}` },
        { status: 500 }
      );
    }
    ({ data, error } = await supabase
      .storage
      .from('posts')
      .createSignedUploadUrl(path));
  }

  if (error || !data) {
    return NextResponse.json(
      { error: `Could not sign upload URL: ${error?.message ?? 'unknown error'}` },
      { status: 500 }
    );
  }

  const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path);

  return NextResponse.json({
    uploadUrl: data.signedUrl,
    publicUrl,
    path,
    mediaType,
  });
}
