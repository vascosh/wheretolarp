import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, PIN_PRICE_CENTS } from '@/lib/stripe';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: PIN_PRICE_CENTS,
    currency: 'usd',
    metadata: {
      user_id: session.user.id,
      feature: 'leaderboard_pin',
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
