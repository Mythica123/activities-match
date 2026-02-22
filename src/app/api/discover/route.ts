import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const distanceMax  = searchParams.get('distanceMax');
    const categories   = searchParams.get('categories');
    const creatorEmail = searchParams.get('creatorEmail');

    // Look up the current user's id and gender
    let userGender: string | null = null;
    let userId: string | null = null;
    if (creatorEmail) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, gender')
        .eq('email', creatorEmail)
        .single();
      userGender = userData?.gender ?? null;
      userId     = userData?.id     ?? null;
    }

    let query = supabase
      .from('activities')
      .select(`
        id, title, description, category, scheduled_at,
        location, image_url, max_participants, current_participants,
        genders, age_min, age_max, distance_miles, created_at, creator_id
      `)
      .eq('is_cancelled', false)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (distanceMax) query = query.lte('distance_miles', parseFloat(distanceMax));
    if (categories) {
      const catArray = categories.split(',').map(c => c.trim()).filter(Boolean);
      if (catArray.length > 0) query = query.in('category', catArray);
    }

    // Exclude the user's own activities at the DB level
    if (userId) query = query.neq('creator_id', userId);

    const { data: activities, error } = await query.limit(100);

    if (error) {
      console.error('Discover fetch error:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    let filtered = (activities ?? []).filter(
      a => a.current_participants < a.max_participants
    );

    // Gender restriction filter
    if (userGender) {
      filtered = filtered.filter(a => {
        if (!a.genders || a.genders.length === 0) return true;
        return a.genders.map((g: string) => g.toLowerCase()).includes(userGender!.toLowerCase());
      });
    } else {
      filtered = filtered.filter(a => !a.genders || a.genders.length === 0);
    }

    return NextResponse.json({ activities: filtered }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}