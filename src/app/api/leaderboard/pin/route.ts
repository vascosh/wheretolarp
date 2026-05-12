import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { paymentIntentId } = await req.json();
  if (!paymentIntentId) {
    return NextResponse.json({ error: 'Payment intent required' }, { status: 400 });
  }

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== 'succeeded') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
  }
  if (intent.metadata.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Payment mismatch' }, { status: 403 });
  }

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('leaderboard_pins').insert({
    user_id: session.user.id,
    expires_at: expiresAt,
  });

  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  return NextResponse.json({ success: true, expires_at: expiresAt });
}
