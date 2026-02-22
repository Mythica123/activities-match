import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { requestId, hostEmail, action } = await req.json();
    // action: 'accept' | 'reject'

    if (!requestId || !hostEmail || !action) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Get host
    const { data: host } = await supabase
      .from('users')
      .select('id, username, gender, birthday')
      .eq('email', hostEmail)
      .single();

    if (!host) {
      return NextResponse.json({ message: 'Host not found' }, { status: 404 });
    }

    // Get the join request
    const { data: joinRequest, error: reqError } = await supabase
      .from('join_requests')
      .select('id, requester_id, host_id, activity_id, status')
      .eq('id', requestId)
      .single();

    if (reqError || !joinRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    if (joinRequest.host_id !== host.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ message: 'Request already responded to' }, { status: 409 });
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('join_requests')
      .update({ status: action === 'accept' ? 'accepted' : 'rejected', responded_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      return NextResponse.json({ message: updateError.message }, { status: 500 });
    }

    if (action === 'accept') {
      // Get activity details for the message
      const { data: activity } = await supabase
        .from('activities')
        .select('id, title, scheduled_at, location, category, description')
        .eq('id', joinRequest.activity_id)
        .single();

      // Increment current_participants
      await supabase.rpc('increment_participants', { activity_id: joinRequest.activity_id });

      // Calculate host age
      let hostAge: number | null = null;
      if (host.birthday) {
        const birth = new Date(host.birthday);
        const today = new Date();
        hostAge = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) hostAge--;
      }

      // Count host's activities and matches
      const { count: hostActivitiesCreated } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', host.id);

      const { count: hostMatches } = await supabase
        .from('join_requests')
        .select('id', { count: 'exact', head: true })
        .eq('requester_id', host.id)
        .eq('status', 'accepted');

      // Format date nicely
      const actDate = activity
        ? new Date(activity.scheduled_at).toLocaleString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })
        : '';

      // Build the auto-message
      const message = `🎉 Great news! Your request to join "${activity?.title}" has been approved!

📅 When: ${actDate}
📍 Where: ${activity?.location}
🏷️ Category: ${activity?.category}

About your host ${host.username}:
• Gender: ${host.gender ?? 'Not specified'}
• Age: ${hostAge ?? 'Not specified'}
• Activities created: ${hostActivitiesCreated ?? 0}
• Events joined: ${hostMatches ?? 0}

See you there! 🙌`;

      // Send message from host to requester
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          sender_id:   host.id,
          receiver_id: joinRequest.requester_id,
          activity_id: joinRequest.activity_id,
          content:     message,
        });

      if (msgError) {
        console.error('Message send error:', msgError);
      }
    }

    return NextResponse.json({ success: true, action }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}