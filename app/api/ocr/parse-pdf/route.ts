import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    let targetFilePath = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const tempDir = path.join(process.cwd(), 'public', 'uploads', 'ocr');
      await fs.mkdir(tempDir, { recursive: true });
      targetFilePath = path.join(tempDir, `ocr_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9\._-]/g, '_')}`);
      await fs.writeFile(targetFilePath, buffer);
    } else {
      const body = await req.json();
      targetFilePath = body.filePath || body.file_path;
      if (!targetFilePath) {
        return NextResponse.json({ error: 'filePath is required in body' }, { status: 400 });
      }
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'parse_pdf.py');
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${targetFilePath}"`);

    if (stderr && !stdout) {
      console.error('OCR Script stderr:', stderr);
    }

    try {
      const parsedData = JSON.parse(stdout);
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error('Failed to parse script output:', stdout);
      return NextResponse.json({ error: 'Failed to parse OCR output', raw: stdout }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in OCR API route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
