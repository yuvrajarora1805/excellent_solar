import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

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
          // Resolve file path
          const relPath = photo.file_path.startsWith('/') ? photo.file_path.slice(1) : photo.file_path;
          const absPath = path.join(process.cwd(), 'public', relPath);
          const content = await readFile(absPath);
          const fname = photo.file_name || path.basename(relPath);
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
          const relPath = photo.file_path.startsWith('/') ? photo.file_path.slice(1) : photo.file_path;
          const absPath = path.join(process.cwd(), 'public', relPath);
          const content = await readFile(absPath);
          const fname = photo.file_name || path.basename(relPath);
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
          const relPath = photo.file_path.startsWith('/') ? photo.file_path.slice(1) : photo.file_path;
          const absPath = path.join(process.cwd(), 'public', relPath);
          const content = await readFile(absPath);
          const fname = photo.file_name || path.basename(relPath);
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
