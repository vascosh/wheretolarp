import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

const VALID_REASONS = ['harassment', 'spam', 'inappropriate_content', 'fake_account', 'underage', 'other'];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.id === params.id) return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });

  const { reason, details } = await req.json();

  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
  }

  const { error } = await supabase.from('user_reports').insert({
    reporter_id: session.user.id,
    reported_id: params.id,
    reason,
    details: details ? String(details).slice(0, 500) : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
