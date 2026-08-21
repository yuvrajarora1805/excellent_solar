import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const jobId = formData.get('job_id') as string;
    const documentType = formData.get('document_type') as string;

    if (!file || !jobId) {
      return NextResponse.json({ error: 'Missing file or job_id' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'jobs', jobId);
    await mkdir(uploadDir, { recursive: true });

    // Sanitize filename and make unique
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}_${sanitizedName}`;
    const path = join(uploadDir, filename);

    // Write file to disk
    await writeFile(path, buffer);

    const publicUrl = `/uploads/jobs/${jobId}/${filename}`;

    const { query } = await import('@/lib/db');
    
    const projects = await query('SELECT status FROM projects WHERE id = ?', [jobId]) as any[];
    if (projects.length > 0) {
      const status = projects[0].status;
      const isSurvey = status === 'NEW' || status === 'SITE_SURVEY' || status === 'SURVEY_SUBMITTED' || status === 'SURVEY_REJECTED';
      
      if (isSurvey) {
        let surveys = await query('SELECT id FROM site_surveys WHERE project_id = ?', [jobId]) as any[];
        if (surveys.length === 0) {
          await query('INSERT INTO site_surveys (project_id, created_by) VALUES (?, ?)', [jobId, 1]);
          surveys = await query('SELECT id FROM site_surveys WHERE project_id = ?', [jobId]) as any[];
        }
        
        await query(
          'INSERT INTO site_survey_photos (site_survey_id, category, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
          [surveys[0].id, documentType || 'GENERAL', file.name, publicUrl, file.size, file.type]
        );
      } else {
        let installs = await query('SELECT id FROM installations WHERE project_id = ?', [jobId]) as any[];
        if (installs.length === 0) {
          await query('INSERT INTO installations (project_id, created_by) VALUES (?, ?)', [jobId, 1]);
          installs = await query('SELECT id FROM installations WHERE project_id = ?', [jobId]) as any[];
        }
        
        await query(
          'INSERT INTO installation_photos (installation_id, category, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
          [installs[0].id, documentType || 'GENERAL', file.name, publicUrl, file.size, file.type]
        );
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      document_type: documentType 
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error during upload' }, { status: 500 });
  }
}
