import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { trackSpotSubmission } from '@/lib/challenge-tracker';

// Use service-role key server-side so we can insert into locations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CITY_IDS: Record<string, string> = {
  'New York': '11111111-0000-0000-0000-000000000001',
  'London': '11111111-0000-0000-0000-000000000002',
  'Miami': '11111111-0000-0000-0000-000000000003',
};

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`
    );
    const data = await res.json();
    const coords = data?.features?.[0]?.center;
    if (!coords) return null;
    return { lat: coords[1], lng: coords[0] };
  } catch {
    return null;
  }
}

async function evaluateWithClaude(submission: {
  name: string;
  city: string;
  neighborhood: string;
  category: string;
  description: string;
  address: string;
}): Promise<{ approved: boolean; reason: string; vibe_difficulty: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key — leave for manual review
    return { approved: false, reason: 'pending_manual_review', vibe_difficulty: 3 };
  }

  const prompt = `You are the editor of a high-end lifestyle guide called "Where To LARP" — a curated directory of aspirational spots in New York, London, and Paris where people go to look and feel affluent, cultured, and photogenic.

Evaluate this user-submitted location:

Name: ${submission.name}
City: ${submission.city}
Neighborhood: ${submission.neighborhood || 'not provided'}
Category: ${submission.category || 'not provided'}
Address: ${submission.address || 'not provided'}
Description: "${submission.description}"

Approve it if it is:
- A real, verifiable place in ${submission.city}
- Genuinely luxurious, culturally significant, or highly aspirational
- The kind of place a fashion-forward, culturally literate person would genuinely visit

Reject it if it is:
- A chain, fast food, or mid-market venue
- Not actually aspirational or photogenic
- Fake, vague, or unverifiable
- Already well-covered and obvious (e.g. the Eiffel Tower itself)

Respond ONLY with a JSON object, no other text:
{
  "approved": true or false,
  "reason": "one sentence explaining why",
  "vibe_difficulty": a number 1-5 (1=easy to pull off, 5=very difficult)
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data?.content?.[0]?.text ?? '{}';
    const parsed = JSON.parse(text);
    return {
      approved: parsed.approved === true,
      reason: parsed.reason ?? '',
      vibe_difficulty: Number(parsed.vibe_difficulty) || 3,
    };
  } catch {
    return { approved: false, reason: 'evaluation_failed', vibe_difficulty: 3 };
  }
}

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

  if (!CITY_IDS[city]) {
    return NextResponse.json({ error: 'Invalid city' }, { status: 400 });
  }

  // Step 1 — Evaluate with Claude
  const verdict = await evaluateWithClaude({ name, city, neighborhood, category, description, address });
  const isPendingManual = verdict.reason === 'pending_manual_review';
  const status = isPendingManual ? 'pending' : verdict.approved ? 'approved' : 'rejected';

  // Step 2 — Save submission record
  const { error: insertError } = await supabaseAdmin.from('submitted_spots').insert({
    name,
    city,
    neighborhood,
    category,
    description,
    address,
    submitter_name,
    submitter_email,
    status,
    ai_verdict: verdict.reason,
    is_reviewed: !isPendingManual,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Step 3 — If approved, geocode and add to locations
  if (verdict.approved) {
    const geocodeQuery = address
      ? `${address}, ${city}`
      : `${name}, ${neighborhood ? neighborhood + ', ' : ''}${city}`;

    const coords = await geocode(geocodeQuery);

    const { error: locationError } = await supabaseAdmin.from('locations').insert({
      city_id: CITY_IDS[city],
      name,
      neighborhood: neighborhood || null,
      category: category || 'Continental',
      description,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      photo_url: null,
      vibe_difficulty: verdict.vibe_difficulty,
      what_to_wear: null,
      is_approved: true,
    });

    if (locationError) {
      console.error('Failed to insert approved location:', locationError.message);
    }
  }

  // Fire-and-forget challenge tracking for authenticated users
  if (session?.user?.id) {
    trackSpotSubmission(session.user.id);
  }

  return NextResponse.json({
    success: true,
    status,
    approved: verdict.approved,
    message: isPendingManual
      ? 'Your submission is under review.'
      : verdict.approved
      ? 'Your spot has been approved and added to the guide!'
      : 'Your spot was reviewed but did not meet our curation standards.',
  });
}
