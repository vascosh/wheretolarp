import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 50 MB)' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const filename = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('message-media')
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('message-media').getPublicUrl(filename);

  let type = 'file';
  if (file.type.startsWith('image/')) type = 'image';
  else if (file.type.startsWith('video/')) type = 'video';

  return NextResponse.json({ url: publicUrl, type, name: file.name });
}
