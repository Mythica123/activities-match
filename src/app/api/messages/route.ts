import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/messages?email=... — fetch all messages for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Missing email' }, { status: 400 });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Fetch messages where user is receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, created_at, content, is_read, activity_id, sender_id')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Enrich with sender username
    const enriched = await Promise.all(
      (messages ?? []).map(async (m) => {
        const { data: sender } = await supabase
          .from('users')
          .select('username')
          .eq('id', m.sender_id)
          .single();

        return { ...m, senderUsername: sender?.username ?? 'Unknown' };
      })
    );

    const unreadCount = enriched.filter(m => !m.is_read).length;

    return NextResponse.json({ messages: enriched, unreadCount }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/messages — mark messages as read
export async function PATCH(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Missing email' }, { status: 400 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}