import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
  if (body.show_email !== undefined) updates.show_email = body.show_email;
  if (body.public_profile !== undefined) updates.public_profile = body.public_profile;
  if (body.notify_invites !== undefined) updates.notify_invites = body.notify_invites;
  if (body.notify_friends !== undefined) updates.notify_friends = body.notify_friends;
  if (body.username !== undefined) updates.username = body.username ? body.username.toLowerCase() : null;
  if (body.onboarded !== undefined) updates.onboarded = body.onboarded;

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('users')
    .select('id, name, bio, avatar_url, username, show_email, public_profile, notify_invites, notify_friends')
    .eq('id', session.user.id)
    .single();

  return NextResponse.json({ profile: data });
}
