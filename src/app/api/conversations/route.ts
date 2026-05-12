import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const { data: convs, error } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2, last_message_at')
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!convs?.length) return NextResponse.json({ conversations: [] });

  const otherIds = Array.from(new Set(convs.map(c => c.participant_1 === userId ? c.participant_2 : c.participant_1)));

  const { data: users } = await supabase
    .from('users')
    .select('id, name, avatar_url, username')
    .in('id', otherIds);

  const convIds = convs.map(c => c.id);

  // Last message per conversation
  const { data: allMessages } = await supabase
    .from('messages')
    .select('id, conversation_id, content, message_type, created_at, sender_id')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false });

  // Unread: messages sent by other party not yet in message_reads for this user
  const { data: readMarkers } = await supabase
    .from('message_reads')
    .select('message_id')
    .eq('user_id', userId);

  const readSet = new Set((readMarkers ?? []).map(r => r.message_id));

  const unreadByConv: Record<string, number> = {};
  (allMessages ?? []).forEach(m => {
    if (m.sender_id !== userId && !readSet.has(m.id)) {
      unreadByConv[m.conversation_id] = (unreadByConv[m.conversation_id] ?? 0) + 1;
    }
  });

  // Deduplicate last messages per conv (already sorted desc, so first hit = latest)
  type MsgRow = { id: string; conversation_id: string; content: string | null; message_type: string; created_at: string; sender_id: string };
  const lastMsgByConv: Record<string, MsgRow> = {};
  (allMessages ?? []).forEach(m => {
    if (!lastMsgByConv[m.conversation_id]) lastMsgByConv[m.conversation_id] = m;
  });

  const conversations = convs.map(c => {
    const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
    const other = (users ?? []).find(u => u.id === otherId) ?? { id: otherId, name: null, avatar_url: null, username: null };
    const lm = lastMsgByConv[c.id];
    return {
      id: c.id,
      other,
      lastMessage: lm ? {
        content: lm.content,
        type: lm.message_type,
        createdAt: lm.created_at,
        isFromMe: lm.sender_id === userId,
      } : null,
      unreadCount: unreadByConv[c.id] ?? 0,
      lastMessageAt: c.last_message_at,
    };
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetId } = await req.json();
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 });

  const userId = session.user.id;
  if (userId === targetId) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });

  // Check block in either direction
  const { data: block } = await supabase
    .from('user_blocks')
    .select('id')
    .or(`and(blocker_id.eq.${userId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${userId})`)
    .maybeSingle();

  if (block) return NextResponse.json({ error: 'Cannot message this user' }, { status: 403 });

  // Consistent ordering using string comparison
  const [p1, p2] = [userId, targetId].sort();

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .maybeSingle();

  if (existing) return NextResponse.json({ conversationId: existing.id });

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_1: p1, participant_2: p2 })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversationId: created.id });
}
