import { NextRequest, NextResponse } from 'next/server';
/* cSpell:disable */
const IMAGEN_MODEL = 'imagen-4.0-generate-001';

function buildPrompt(title: string, category: string, description: string): string {
  const categoryStyles: Record<string, string> = {
    sports:    'dynamic sports photography, action shot, athletic energy, bright natural lighting',
    arts:      'creative artistic atmosphere, colorful, expressive, studio lighting',
    outdoor:   'scenic nature photography, golden hour lighting, breathtaking landscape',
    social:    'warm social gathering, candid lifestyle photography, inviting atmosphere',
    gaming:    'vibrant gaming setup, neon lighting, modern tech aesthetic',
    fitness:   'energetic fitness photography, motivational, clean modern gym aesthetic',
    education: 'bright learning environment, modern, inspiring, clean and focused',
  };
  const style = categoryStyles[category?.toLowerCase()] ?? 'vibrant lifestyle photography, modern aesthetic';
  return `A beautiful cover image for a community activity event called "${title}". ${
    description ? `The activity is about: ${description.slice(0, 100)}. ` : ''
  }Style: ${style}. No text, no words, no letters. High quality, photorealistic.`;
}

export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ message: 'Gemini API key not configured' }, { status: 500 });
    }

    const { title, category, description } = await req.json();
    if (!title) {
      return NextResponse.json({ message: 'Missing activity title' }, { status: 400 });
    }

    const prompt = buildPrompt(title, category ?? '', description ?? '');

    console.log('Calling Imagen with prompt:', prompt);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      }
    );

    console.log('Response status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Raw response:', text.slice(0, 500));

    if (!response.ok) {
      let errMsg = 'Image generation failed';
      try { errMsg = JSON.parse(text)?.error?.message ?? errMsg; } catch {}
      return NextResponse.json({ message: errMsg }, { status: response.status });
    }

    let data: Record<string, unknown>;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json({ message: 'Invalid JSON from AI', debug: text }, { status: 500 });
    }

    const predictions = data?.predictions as Array<Record<string, string>>;
    const imageBase64 = predictions?.[0]?.bytesBase64Encoded;
    const mimeType = predictions?.[0]?.mimeType ?? 'image/png';

    if (!imageBase64) {
      return NextResponse.json({ message: 'No image in response', debug: data }, { status: 500 });
    }

    return NextResponse.json({ success: true, imageBase64, mimeType, prompt });
  } catch (err) {
    console.error('Image generation error:', err);
    return NextResponse.json({ message: 'Internal server error', debug: String(err) }, { status: 500 });
  }
}