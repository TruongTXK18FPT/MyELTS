import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/auth';

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'myelts';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: folder,
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
