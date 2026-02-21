import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not configured');
}

export async function POST(req: NextRequest) {
  try {
    const { provider, email, username, birthday, gender } = await req.json();

    // Validate inputs
    if (!provider || !email || !username || !birthday) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to Supabase if configured
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            email,
            username,
            birthday,
            gender: gender || 'prefer not to say',
            provider,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { message: 'Failed to save user data' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User data saved successfully',
        user: data?.[0],
      });
    }

    // Fallback response if Supabase not configured
    return NextResponse.json({
      success: true,
      message: 'User permissions saved successfully',
      user: {
        email,
        username,
        birthday,
        gender: gender || 'prefer not to say',
        provider,
      },
    });
  } catch (error) {
    console.error('Permissions error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to save permissions' },
      { status: 500 }
    );
  }
}
