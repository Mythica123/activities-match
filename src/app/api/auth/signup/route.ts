import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password, username, birthday, gender, provider } = await req.json();

    // Validate inputs
    if (!email || !password || !username || !birthday) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    // Save to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { message: 'Email already registered' },
          { status: 400 }
        );
      }

      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          username,
          birthday,
          gender: gender || 'prefer not to say',
          provider: provider || 'email',
          password_hash: hashedPassword,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { message: 'Failed to create account' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: {
          email: data.email,
          username: data.username,
          birthday: data.birthday,
          gender: data.gender,
        },
      });
    }

    // Fallback if Supabase not configured
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        email,
        username,
        birthday,
        gender: gender || 'prefer not to say',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Signup failed' },
      { status: 500 }
    );
  }
}
