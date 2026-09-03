import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import JSZip from 'jszip';
import { readFile, access } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

/**
 * Resolve a stored file_path to an absolute disk path.
 * Files may be stored in:
 *  1. public/uploads/...  (Next.js public dir)
 *  2. app/uploads/...     (direct write from mobile upload route)
 */
async function resolveFilePath(filePath: string): Promise<string | null> {
  const rel = filePath.startsWith('/') ? filePath.slice(1) : filePath;

  const candidates = [
    path.join(process.cwd(), 'public', rel),
    path.join(process.cwd(), 'app', rel),
    path.join(process.cwd(), rel),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // not found at this path, try next
    }
  }
  return null;
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const projectId = parseInt(idStr, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'survey'; // 'survey' | 'installation' | 'all'

    // Fetch project details
    const projects = await query<any>('SELECT project_id, customer_id FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const projectCode = projects[0].project_id || `project_${projectId}`;

    const zip = new JSZip();
    let fileCount = 0;

    if (type === 'survey' || type === 'all') {
      const surveyPhotos = await query<any>(
        `SELECT ssp.file_name, ssp.file_path, ssp.category
         FROM site_survey_photos ssp
         JOIN site_surveys ss ON ssp.site_survey_id = ss.id
         WHERE ss.project_id = ?`,
        [projectId]
      );

      const folder = zip.folder('Site_Survey_Photos');
      for (const photo of surveyPhotos) {
        try {
          const absPath = await resolveFilePath(photo.file_path);
          if (!absPath) {
            console.warn('File not found on disk, skipping:', photo.file_path);
            continue;
          }
          const content = await readFile(absPath);
          const fname = photo.file_name || path.basename(photo.file_path);
          folder?.file(`${photo.category || 'GENERAL'}_${fname}`, content);
          fileCount++;
        } catch (e) {
          console.warn('Skipping file in ZIP generation:', photo.file_path, e);
        }
      }
    }

    if (type === 'installation' || type === 'all') {
      const installPhotos = await query<any>(
        `SELECT ip.file_name, ip.file_path, ip.category
         FROM installation_photos ip
         JOIN installations i ON ip.installation_id = i.id
         WHERE i.project_id = ?`,
        [projectId]
      );

      const folder = zip.folder('Installation_Photos');
      for (const photo of installPhotos) {
        try {
          const absPath = await resolveFilePath(photo.file_path);
          if (!absPath) {
            console.warn('File not found on disk, skipping:', photo.file_path);
            continue;
          }
          const content = await readFile(absPath);
          const fname = photo.file_name || path.basename(photo.file_path);
          folder?.file(`${photo.category || 'GENERAL'}_${fname}`, content);
          fileCount++;
        } catch (e) {
          console.warn('Skipping file in ZIP generation:', photo.file_path, e);
        }
      }
    }

    // General project photos
    const generalPhotos = await query<any>('SELECT file_name, file_path, category FROM project_photos WHERE project_id = ?', [projectId]);
    if (generalPhotos.length > 0) {
      const folder = zip.folder('General_Photos');
      for (const photo of generalPhotos) {
        try {
          const absPath = await resolveFilePath(photo.file_path);
          if (!absPath) {
            console.warn('File not found on disk, skipping:', photo.file_path);
            continue;
          }
          const content = await readFile(absPath);
          const fname = photo.file_name || path.basename(photo.file_path);
          folder?.file(`${photo.category || 'GENERAL'}_${fname}`, content);
          fileCount++;
        } catch (e) {
          console.warn('Skipping file in ZIP generation:', photo.file_path, e);
        }
      }
    }

    if (fileCount === 0) {
      return NextResponse.json({ error: 'No photos found for this project and selection' }, { status: 404 });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const zipFilename = `${projectCode}_${type}_photos.zip`;

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating ZIP:', error);
    return NextResponse.json({ error: 'Failed to generate ZIP archive' }, { status: 500 });
  }
}
