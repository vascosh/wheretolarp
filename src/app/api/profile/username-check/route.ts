import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const username = new URL(req.url).searchParams.get('username')?.trim().toLowerCase();

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false });
  }
  if (username.length > 20 || !/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false });
  }

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  // Available if no one has it, or it's already this user's own username
  const available = !data || data.id === session.user.id;
  return NextResponse.json({ available });
}
