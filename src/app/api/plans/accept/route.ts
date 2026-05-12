import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { trackChallengeAction } from '@/lib/challenge-tracker';

// POST /api/plans/accept — add a shared plan to the current user's calendar
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      spot_neighborhood: spot_neighborhood ?? null,
      spot_category: spot_category ?? null,
      spot_description: spot_description ?? null,
      plan_date,
      plan_time: plan_time ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  trackChallengeAction(session.user.id, 'plan');

  return NextResponse.json({ plan: data });
}
