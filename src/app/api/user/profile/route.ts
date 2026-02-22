import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, birthday, gender')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get activities this user has hosted
    const { data: hostedActivities } = await supabase
      .from('activities')
      .select('id, title, scheduled_at, location, categories, max_participants, current_participants, is_cancelled')
      .eq('creator_id', user.id)
      .or('is_cancelled.eq.false,is_cancelled.is.null')
      .order('scheduled_at', { ascending: false });

    // Get activities this user has joined (accepted join requests)
    const { data: joinedRequests } = await supabase
      .from('join_requests')
      .select('activity_id')
      .eq('requester_id', user.id)
      .eq('status', 'accepted');

    const joinedActivityIds = (joinedRequests ?? []).map(r => r.activity_id);

    let joinedActivities: any[] = [];
    if (joinedActivityIds.length > 0) {
      const { data } = await supabase
        .from('activities')
        .select('id, title, scheduled_at, location, categories, max_participants, current_participants, creator_id')
        .in('id', joinedActivityIds)
        .order('scheduled_at', { ascending: false });
      joinedActivities = data ?? [];
    }

    return NextResponse.json({
      success: true,
      user,
      stats: {
        activitiesHosted: (hostedActivities ?? []).length,
        activitiesJoined: joinedActivityIds.length,
      },
      hostedActivities: hostedActivities ?? [],
      joinedActivities,
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return NextResponse.json({ message: 'Failed to fetch profile' }, { status: 500 });
  }
}