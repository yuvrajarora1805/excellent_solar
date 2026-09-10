import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const ticketId = resolvedParams.id;
    
    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Security Check: File size cap (Max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 15MB' }, { status: 400 });
    }

    const dangerousExts = ['.php', '.exe', '.sh', '.js', '.html'];
    const originalExt = (file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2)).toLowerCase();
    if (dangerousExts.includes(`.${originalExt}`)) {
      return NextResponse.json({ error: 'Forbidden file extension' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let finalBuffer: Buffer = Buffer.from(bytes);
    let finalFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Simple image processing/compression if sharp is available
    if (file.type.startsWith('image/')) {
      try {
        const sharp = (await import('sharp')).default;
        finalBuffer = await sharp(Buffer.from(bytes))
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
          
        finalFileName = finalFileName.replace(/\.[^/.]+$/, "") + ".webp";
      } catch (err) {
        console.warn('Sharp compression fallback:', err);
      }
    }

    const folderName = `ticket_${ticketId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'tickets', folderName);
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${finalFileName}`;
    const path = join(uploadDir, filename);

    await writeFile(path, finalBuffer);

    const publicUrl = `/uploads/tickets/${folderName}/${filename}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl
    });
  } catch (error) {
    console.error('Ticket Photo Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
