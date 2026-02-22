import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip');

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ message: 'Invalid zip code' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.zippopotam.us/us/${zip}`
    );

    if (!res.ok) {
      return NextResponse.json({ message: 'Zip code not found' }, { status: 404 });
    }

    const data = await res.json();
    const place = data.places?.[0];

    if (!place) {
      return NextResponse.json({ message: 'Zip code not found' }, { status: 404 });
    }

    return NextResponse.json({
      city: place['place name'],
      state: place['state abbreviation'],
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude),
    });

  } catch (err) {
    console.error('Geocode error:', err);
    return NextResponse.json({ message: 'Failed to look up zip code' }, { status: 500 });
  }
}