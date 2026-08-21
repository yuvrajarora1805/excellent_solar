import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: filePathArray } = await params;
    // Construct the absolute path to the file in the public/uploads directory
    const filePath = join(process.cwd(), 'public', 'uploads', ...filePathArray);
    
    // Read the file
    const buffer = await readFile(filePath);
    
    // Determine the content type based on extension
    let contentType = 'application/octet-stream';
    const lowerPath = filePath.toLowerCase();
    
    if (lowerPath.endsWith('.png')) contentType = 'image/png';
    else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (lowerPath.endsWith('.gif')) contentType = 'image/gif';
    else if (lowerPath.endsWith('.webp')) contentType = 'image/webp';
    else if (lowerPath.endsWith('.pdf')) contentType = 'application/pdf';

    // Return the file buffer with the appropriate content type
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
