import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get user by email
async function getUserByEmail(email: string) {
  const { data } = await supabase
    .from('users')
    .select('id, username, gender, birthday, created_at')
    .eq('email', email)
    .single();
  return data;
}

// Helper to count activities created by a user
async function getActivitiesCreatedCount(userId: string) {
  const { count } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', userId);
  return count ?? 0;
}

// Helper to count accepted join requests (matches) for a user
async function getMatchesCount(userId: string) {
  const { count } = await supabase
    .from('join_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requester_id', userId)
    .eq('status', 'accepted');
  return count ?? 0;
}

// ── POST /api/join-requests — User A sends a join request ─────────────────────
export async function POST(req: NextRequest) {
  try {
    const { activityId, requesterEmail } = await req.json();

    if (!activityId || !requesterEmail) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Get requester
    const requester = await getUserByEmail(requesterEmail);
    if (!requester) {
      return NextResponse.json({ message: 'Requester not found' }, { status: 404 });
    }

    // Get activity + host
    const { data: activity, error: actError } = await supabase
      .from('activities')
      .select('id, title, creator_id')
      .eq('id', activityId)
      .single();

    if (actError || !activity) {
      return NextResponse.json({ message: 'Activity not found' }, { status: 404 });
    }

    if (activity.creator_id === requester.id) {
      return NextResponse.json({ message: 'Cannot request to join your own activity' }, { status: 400 });
    }

    // Insert join request (ignore if already exists)
    const { data: joinRequest, error: insertError } = await supabase
      .from('join_requests')
      .insert({
        activity_id:  activityId,
        requester_id: requester.id,
        host_id:      activity.creator_id,
        status:       'pending',
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ message: 'You already requested to join this activity' }, { status: 409 });
      }
      return NextResponse.json({ message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ joinRequest }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// ── GET /api/join-requests — User B fetches incoming requests ─────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hostEmail = searchParams.get('hostEmail');

    if (!hostEmail) {
      return NextResponse.json({ message: 'Missing hostEmail' }, { status: 400 });
    }

    const host = await getUserByEmail(hostEmail);
    if (!host) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get all pending requests for this host's activities
    const { data: requests, error } = await supabase
      .from('join_requests')
      .select(`
        id, created_at, status, activity_id, requester_id
      `)
      .eq('host_id', host.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Enrich each request with requester profile + activity info
    const enriched = await Promise.all(
      (requests ?? []).map(async (r) => {
        // Get requester profile
        const { data: requester } = await supabase
          .from('users')
          .select('id, username, gender, birthday')
          .eq('id', r.requester_id)
          .single();

        // Get activity info
        const { data: activity } = await supabase
          .from('activities')
          .select('id, title, scheduled_at, location, category')
          .eq('id', r.activity_id)
          .single();

        const activitiesCreated = await getActivitiesCreatedCount(r.requester_id);
        const matchesCount      = await getMatchesCount(r.requester_id);

        // Calculate age from birthday
        let age: number | null = null;
        if (requester?.birthday) {
          const birth = new Date(requester.birthday);
          const today = new Date();
          age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        }

        return {
          ...r,
          requester: requester ? { ...requester, age } : null,
          activitiesCreated,
          matchesCount,
          activity,
        };
      })
    );

    return NextResponse.json({ requests: enriched }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}