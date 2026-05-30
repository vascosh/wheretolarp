import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { isReservedHandle } from '@/lib/reserved-handles';

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
  if (body.onboarded !== undefined) updates.onboarded = body.onboarded;

  // Username: server-side validation so the client can't bypass username-check
  if (body.username !== undefined) {
    if (body.username === null || body.username === '') {
      updates.username = null;
    } else {
      const candidate = String(body.username).trim().toLowerCase();
      if (candidate.length < 3 || candidate.length > 20) {
        return NextResponse.json({ error: 'Username must be 3–20 characters.' }, { status: 400 });
      }
      if (!/^[a-z0-9_]+$/.test(candidate)) {
        return NextResponse.json({ error: 'Username can only contain a–z, 0–9, and _' }, { status: 400 });
      }
      if (isReservedHandle(candidate)) {
        return NextResponse.json({ error: 'That handle is reserved.' }, { status: 400 });
      }
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', candidate)
        .maybeSingle();
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: 'That handle is already taken.' }, { status: 409 });
      }
      updates.username = candidate;
    }
  }

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
