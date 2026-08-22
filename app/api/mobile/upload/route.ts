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

    const discomId = formData.get('discom_id') as string;

    if (!file || (!jobId && !discomId)) {
      return NextResponse.json({ error: 'Missing file or job_id/discom_id' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the upload directory exists
    const folderName = jobId || discomId;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'jobs', folderName);
    await mkdir(uploadDir, { recursive: true });

    // Sanitize filename and make unique
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}_${sanitizedName}`;
    const path = join(uploadDir, filename);

    // Write file to disk
    await writeFile(path, buffer);

    const publicUrl = `/uploads/jobs/${folderName}/${filename}`;

    const { query } = await import('@/lib/db');
    
    // Check if this is a DISCOM document upload
    if (discomId) {
      // 1 is a generic document type ID if none is provided
      const docTypeId = documentType ? parseInt(documentType) : 1; 
      
      await query(
        'INSERT INTO documents (discom_application_id, document_type_id, file_name, file_path, file_size, mime_type, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [discomId, docTypeId, file.name, publicUrl, file.size, file.type, 'PENDING', 1]
      );
      
      // Update checklist to reflect it's uploaded
      await query(
        'INSERT INTO document_checklists (discom_application_id, document_type_id, is_uploaded) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_uploaded = 1',
        [discomId, docTypeId]
      );
    } else {
      // Standard Job Upload (Site Survey / Installation)
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
