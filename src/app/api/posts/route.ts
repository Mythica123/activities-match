import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    const { title, description, category, date, time, location, maxParticipants, creatorEmail } = await req.json();

    // Validate required fields
    if (!title || !description || !category || !date || !time || !location || !creatorEmail) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If Supabase is configured, save to database
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data, error } = await supabase
        .from('posts')
        .insert({
          title,
          description,
          category,
          date,
          time,
          location,
          max_participants: maxParticipants,
          creator_email: creatorEmail,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { message: 'Failed to create post', error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Activity created successfully',
        post: data,
      });
    }

    // Fallback if Supabase not configured
    return NextResponse.json({
      success: true,
      message: 'Activity created successfully',
      post: {
        id: `temp_${Date.now()}`,
        title,
        description,
        category,
        date,
        time,
        location,
        max_participants: maxParticipants,
        creator_email: creatorEmail,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (error) {
        return NextResponse.json(
          { message: 'Failed to fetch posts' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        posts: data,
        count,
      });
    }

    // Fallback if Supabase not configured
    return NextResponse.json({
      success: true,
      posts: [],
      count: 0,
    });
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
