import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { trackSpotSubmission } from '@/lib/challenge-tracker';

// Use service-role key server-side so we can insert into submitted_spots (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VALID_CITIES = ['New York', 'London', 'Miami'];

const THANK_YOU_MESSAGE =
  "Thank you for your submission! Keep your eyes peeled for next week's location update...maybe your submission makes the cut!";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const {
    name,
    city,
    neighborhood = '',
    category = '',
    description,
    address = '',
    submitter_name = '',
    submitter_email = '',
  } = body;

  if (!name?.trim() || !city || !description?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!VALID_CITIES.includes(city)) {
    return NextResponse.json({ error: 'Invalid city' }, { status: 400 });
  }

  // Store the submission for manual review — nothing is published automatically.
  // The site owner reviews submitted_spots and adds chosen locations by hand.
  const { error: insertError } = await supabaseAdmin.from('submitted_spots').insert({
    name,
    city,
    neighborhood,
    category,
    description,
    address,
    submitter_name,
    submitter_email,
    status: 'pending',
    is_reviewed: false,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Fire-and-forget challenge tracking for authenticated users
  if (session?.user?.id) {
    trackSpotSubmission(session.user.id);
  }

  return NextResponse.json({
    success: true,
    status: 'pending',
    message: THANK_YOU_MESSAGE,
  });
}
