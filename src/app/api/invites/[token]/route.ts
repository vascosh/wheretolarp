import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

// GET /api/invites/[token] — public, returns plan details for an invite token
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const { data: invite } = await supabase
    .from('plan_invites')
    .select('id, plan_id, inviter_id, status')
    .eq('token', token)
    .single();

  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

  const [{ data: plan }, { data: inviter }] = await Promise.all([
    supabase
      .from('larp_plans')
      .select('id, spot_name, spot_neighborhood, spot_category, spot_description, plan_date, plan_time')
      .eq('id', invite.plan_id)
      .single(),
    supabase
      .from('users')
      .select('id, name, avatar_url')
      .eq('id', invite.inviter_id)
      .single(),
  ]);

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  return NextResponse.json({
    invite: {
      id: invite.id,
      status: invite.status,
      plan: {
        spot_name: plan.spot_name,
        spot_neighborhood: plan.spot_neighborhood,
        spot_category: plan.spot_category,
        spot_description: plan.spot_description,
        plan_date: plan.plan_date,
        plan_time: plan.plan_time,
      },
      inviter: {
        name: inviter?.name ?? 'Someone',
        avatar_url: inviter?.avatar_url ?? null,
      },
    },
  });
}

// PATCH /api/invites/[token] — accept invite (auth required)
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = params;

  const { data: invite } = await supabase
    .from('plan_invites')
    .select('id, plan_id, inviter_id, status')
    .eq('token', token)
    .single();

  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  if (invite.status === 'accepted') return NextResponse.json({ error: 'Already accepted' }, { status: 400 });
  if (invite.inviter_id === session.user.id) return NextResponse.json({ error: 'Cannot accept your own invite' }, { status: 400 });

  // Get original plan details
  const { data: plan } = await supabase
    .from('larp_plans')
    .select('spot_name, spot_neighborhood, spot_category, spot_description, plan_date, plan_time')
    .eq('id', invite.plan_id)
    .single();

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  // Create a copy of the plan for the accepting user
  const { error: planError } = await supabase
    .from('larp_plans')
    .insert({
      user_id: session.user.id,
      spot_name: plan.spot_name,
      spot_neighborhood: plan.spot_neighborhood,
      spot_category: plan.spot_category,
      spot_description: plan.spot_description,
      plan_date: plan.plan_date,
      plan_time: plan.plan_time,
      notes: `Joined via invite`,
    });

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });

  // Update invite status
  const { error: updateError } = await supabase
    .from('plan_invites')
    .update({ status: 'accepted', invitee_id: session.user.id })
    .eq('id', invite.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE /api/invites/[token] — decline invite
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = params;

  const { data: invite } = await supabase
    .from('plan_invites')
    .select('id, inviter_id, invitee_id, status')
    .eq('token', token)
    .single();

  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  if (invite.status !== 'pending') return NextResponse.json({ error: 'Invite already responded to' }, { status: 400 });
  // Only the invitee can decline
  if (invite.invitee_id && invite.invitee_id !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { error } = await supabase
    .from('plan_invites')
    .update({ status: 'declined', invitee_id: session.user.id })
    .eq('id', invite.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
