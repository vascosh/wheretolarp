import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Email, name and password are required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { error } = await supabase.from('users').insert({ email, name, password_hash });

  if (error) {
    console.error('[signup] supabase error:', error);
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
