import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { trackChallengeAction, type TrackableAction } from '@/lib/challenge-tracker';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const { action } = await req.json().catch(() => ({}));
  if (!action) return NextResponse.json({ ok: false }, { status: 400 });

  await trackChallengeAction(session.user.id, action as TrackableAction);
  return NextResponse.json({ ok: true });
}
