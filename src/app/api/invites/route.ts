import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

// POST /api/invites — create an invite for a plan
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan_id, invitee_id } = await req.json();
  if (!plan_id) return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });

  // Verify the plan belongs to this user
  const { data: plan } = await supabase
    .from('larp_plans')
    .select('id')
    .eq('id', plan_id)
    .eq('user_id', session.user.id)
    .single();

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  // If invitee_id given, create a targeted invite
  // Otherwise create a general shareable invite (or return existing one)
  if (invitee_id) {
    // Fetch plan details — needed for the DM regardless of whether invite is new or existing
    const { data: planDetails } = await supabase
      .from('larp_plans')
      .select('spot_name, spot_neighborhood, spot_category, spot_description, plan_date, plan_time')
      .eq('id', plan_id)
      .single();

    if (!planDetails) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    // Find or create the invite record
    let invite: { id: string; token: string; status: string };
    const { data: existing } = await supabase
      .from('plan_invites')
      .select('id, token, status')
      .eq('plan_id', plan_id)
      .eq('invitee_id', invitee_id)
      .maybeSingle();

    if (existing) {
      invite = existing;
    } else {
      const { data: created, error } = await supabase
        .from('plan_invites')
        .insert({ plan_id, inviter_id: session.user.id, invitee_id, status: 'pending' })
        .select('id, token, status')
        .single();
      if (error || !created) return NextResponse.json({ error: error?.message ?? 'Failed to create invite' }, { status: 500 });
      invite = created;
    }

    // Always send as a DM — find or create conversation
    const [p1, p2] = [session.user.id, invitee_id].sort();
    let convId: string;
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_1', p1)
      .eq('participant_2', p2)
      .maybeSingle();

    if (existingConv) {
      convId = existingConv.id;
    } else {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({ participant_1: p1, participant_2: p2 })
        .select('id')
        .single();
      if (convErr || !newConv) return NextResponse.json({ error: convErr?.message ?? 'Failed to create conversation' }, { status: 500 });
      convId = newConv.id;
    }

    // Insert the plan message with the invite token embedded so recipient can accept/decline
    const planPayload = {
      id: plan_id,
      spot_name: planDetails.spot_name,
      spot_neighborhood: planDetails.spot_neighborhood,
      spot_category: planDetails.spot_category,
      spot_description: planDetails.spot_description,
      plan_date: planDetails.plan_date,
      plan_time: planDetails.plan_time,
      notes: null,
      invite_token: invite.token,
    };

    const { data: message, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        sender_id: session.user.id,
        content: JSON.stringify(planPayload),
        message_type: 'plan',
      })
      .select('id')
      .single();

    if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

    // Update conversation timestamp + mark as read for sender
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convId);
    if (message) {
      await supabase.from('message_reads').upsert({ message_id: message.id, user_id: session.user.id }, { onConflict: 'message_id,user_id' });
    }

    // Notify recipient — lights up their DM icon
    const { data: sender } = await supabase.from('users').select('name').eq('id', session.user.id).single();
    const dateLabel = planDetails.plan_date
      ? new Date(planDetails.plan_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null;
    await supabase.from('notifications').insert({
      user_id: invitee_id,
      type: 'new_message',
      title: `${sender?.name ?? 'Someone'} invited you to a LARP`,
      body: dateLabel ? `${planDetails.spot_name} · ${dateLabel}` : planDetails.spot_name,
      data: { conversation_id: convId, sender_id: session.user.id },
      read: false,
    });

    return NextResponse.json({ invite });
  }

  // Shareable link: find or create a general invite (no invitee_id)
  const { data: existing } = await supabase
    .from('plan_invites')
    .select('id, token, status')
    .eq('plan_id', plan_id)
    .eq('inviter_id', session.user.id)
    .is('invitee_id', null)
    .single();

  if (existing) {
    return NextResponse.json({ invite: existing });
  }

  const { data: invite, error } = await supabase
    .from('plan_invites')
    .insert({
      plan_id,
      inviter_id: session.user.id,
      invitee_id: null,
      status: 'pending',
    })
    .select('id, token, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invite });
}

// GET /api/invites — get current user's pending incoming plan invites
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: invites, error } = await supabase
    .from('plan_invites')
    .select('id, token, status, plan_id, inviter_id, created_at')
    .eq('invitee_id', session.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!invites || invites.length === 0) return NextResponse.json({ invites: [] });

  // Get plan details
  const planIds = invites.map(i => i.plan_id).filter((v, i, a) => a.indexOf(v) === i);
  const inviterIds = invites.map(i => i.inviter_id).filter((v, i, a) => a.indexOf(v) === i);

  const [{ data: plans }, { data: inviters }] = await Promise.all([
    supabase.from('larp_plans').select('id, spot_name, spot_neighborhood, spot_category, plan_date, plan_time').in('id', planIds),
    supabase.from('users').select('id, name, avatar_url').in('id', inviterIds),
  ]);

  const enriched = invites.map(inv => ({
    ...inv,
    plan: (plans ?? []).find(p => p.id === inv.plan_id) ?? null,
    inviter: (inviters ?? []).find(u => u.id === inv.inviter_id) ?? null,
  }));

  return NextResponse.json({ invites: enriched });
}
