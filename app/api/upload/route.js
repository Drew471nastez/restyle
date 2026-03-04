import { NextResponse } from 'next/server';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No image file received.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: jpg, png, webp, gif.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const previewDataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json(
      {
        success: true,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        previewDataUrl
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Unexpected upload error.' }, { status: 500 });
  }
}
