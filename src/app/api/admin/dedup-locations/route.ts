import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

// POST /api/admin/dedup-locations
// Finds duplicate locations (same name + city_id) and keeps the oldest, deletes the rest.
export async function POST() {
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, city_id, created_at')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!locations?.length) return NextResponse.json({ deleted: 0 });

  // Group by name (lowercased) + city_id
  const seen = new Map<string, string>(); // key -> first id (keep)
  const toDelete: string[] = [];

  for (const loc of locations) {
    const key = `${loc.city_id}::${loc.name.trim().toLowerCase()}`;
    if (seen.has(key)) {
      toDelete.push(loc.id);
    } else {
      seen.set(key, loc.id);
    }
  }

  if (!toDelete.length) return NextResponse.json({ deleted: 0, message: 'No duplicates found' });

  const { error: delError } = await supabase
    .from('locations')
    .delete()
    .in('id', toDelete);

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  return NextResponse.json({ deleted: toDelete.length, ids: toDelete });
}
