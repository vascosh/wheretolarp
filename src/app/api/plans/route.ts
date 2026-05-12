import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { trackChallengeAction } from '@/lib/challenge-tracker';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('larp_plans')
    .select('*')
    .eq('user_id', session.user.id)
    .order('plan_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plans: data });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { spot_name, spot_neighborhood, spot_category, spot_description, plan_date, plan_time, notes } = body;

  if (!spot_name || !plan_date) {
    return NextResponse.json({ error: 'spot_name and plan_date are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('larp_plans')
    .insert({
      user_id: session.user.id,
      spot_name,
      spot_neighborhood,
      spot_category,
      spot_description,
      plan_date,
      plan_time,
      notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget challenge tracking
  trackChallengeAction(session.user.id, 'plan');

  return NextResponse.json({ plan: data });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase
    .from('larp_plans')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
