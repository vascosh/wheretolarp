import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

async function verifyParticipant(convId: string, userId: string) {
  const { data } = await supabase
    .from('conversations')
    .select('participant_1, participant_2')
    .eq('id', convId)
    .single();
  if (!data) return null;
  if (data.participant_1 !== userId && data.participant_2 !== userId) return null;
  return data;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const conv = await verifyParticipant(params.id, userId);
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, message_type, media_url, media_name, created_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark all received messages as read
  const unreadIds = (messages ?? [])
    .filter(m => m.sender_id !== userId)
    .map(m => m.id);

  if (unreadIds.length) {
    await supabase.from('message_reads').upsert(
      unreadIds.map(id => ({ message_id: id, user_id: userId })),
      { onConflict: 'message_id,user_id' }
    );
  }

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const conv = await verifyParticipant(params.id, userId);
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { content, message_type = 'text', media_url, media_name } = body;

  if (!content && !media_url) {
    return NextResponse.json({ error: 'Message content required' }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.id,
      sender_id: userId,
      content: content ?? null,
      message_type,
      media_url: media_url ?? null,
      media_name: media_name ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', params.id);

  // Mark as read for sender immediately
  await supabase.from('message_reads').insert({ message_id: message.id, user_id: userId });

  // Notify recipient
  const recipientId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
  const { data: sender } = await supabase.from('users').select('name').eq('id', userId).single();

  await supabase.from('notifications').insert({
    user_id: recipientId,
    type: 'new_message',
    title: `${sender?.name ?? 'Someone'} sent you a message`,
    body: message_type === 'text' ? (content?.slice(0, 80) ?? null) : message_type === 'plan' ? 'Shared a LARP plan' : `Sent a ${message_type}`,
    data: { conversation_id: params.id, sender_id: userId },
  });

  return NextResponse.json({ message });
}
