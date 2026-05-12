import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, data, read, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(25);

  const unreadCount = (notifications ?? []).filter(n => !n.read).length;
  return NextResponse.json({ notifications: notifications ?? [], unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body.ids;

  if (ids?.length) {
    await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id).in('id', ids);
  } else {
    await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id);
  }
  return NextResponse.json({ success: true });
}
