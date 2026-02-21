import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key so we can bypass RLS for inserts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();

    // ── Required fields ──────────────────────────────────────────────────────
    const title          = body.get('title')          as string | null;
    const description    = body.get('description')    as string | null;
    const category       = body.get('category')       as string | null;
    const date           = body.get('date')           as string | null;
    const time           = body.get('time')           as string | null;
    const location       = body.get('location')       as string | null;
    const maxParticipants = body.get('maxParticipants') as string | null;
    const creatorEmail   = body.get('creatorEmail')   as string | null;

    if (!title || !description || !category || !date || !time || !location || !maxParticipants || !creatorEmail) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // ── Optional fields ───────────────────────────────────────────────────────
    const gendersRaw = body.get('genders') as string | null;
    const genders: string[] = gendersRaw ? JSON.parse(gendersRaw) : [];

    const ageMinRaw  = body.get('ageMin')  as string | null;
    const ageMaxRaw  = body.get('ageMax')  as string | null;
    const distanceRaw = body.get('distance') as string | null;

    const ageMin   = ageMinRaw   && ageMinRaw   !== '' ? parseInt(ageMinRaw)   : null;
    const ageMax   = ageMaxRaw   && ageMaxRaw   !== '' ? parseInt(ageMaxRaw)   : null;
    const distance = distanceRaw && distanceRaw !== '' ? parseFloat(distanceRaw) : null;

    // ── Look up creator user id from users table ───────────────────────────
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', creatorEmail)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // ── Image upload (optional) ───────────────────────────────────────────
    let imageUrl: string | null = null;
    const imageFile = body.get('image') as File | null;

    if (imageFile && imageFile.size > 0) {
      const ext       = imageFile.name.split('.').pop() ?? 'jpg';
      const fileName  = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath  = `activity-images/${fileName}`;

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer      = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('activities')
        .upload(filePath, buffer, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        // Non-fatal — continue without image
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('activities')
          .getPublicUrl(filePath);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    // ── Combine date + time into a single timestamptz ─────────────────────
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    // ── Insert activity ───────────────────────────────────────────────────
    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert({
        title,
        description,
        category,
        scheduled_at: scheduledAt,
        location,
        max_participants: parseInt(maxParticipants),
        creator_id: userData.id,
        image_url: imageUrl,
        genders:   genders.length > 0 ? genders : null,
        age_min:   ageMin,
        age_max:   ageMax,
        distance_miles: distance,
        current_participants: 1, // creator counts as first participant
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ activity }, { status: 201 });

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}