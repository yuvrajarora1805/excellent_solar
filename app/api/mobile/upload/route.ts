import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const jobId = formData.get('job_id') as string;
    const documentType = (formData.get('document_type') || formData.get('document_type_id')) as string;

    const discomId = formData.get('discom_id') as string;

    if (!file || (!jobId && !discomId)) {
      return NextResponse.json({ error: 'Missing file or job_id/discom_id' }, { status: 400 });
    }

    // Security Check 1: File size cap (Max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 25MB' }, { status: 400 });
    }

    // Security Check 2: Reject dangerous script file extensions
    const dangerousExts = ['.php', '.phtml', '.php3', '.php4', '.php5', '.phps', '.cgi', '.exe', '.pl', '.py', '.sh', '.js', '.html', '.htm', '.svg', '.htaccess', '.jsp'];
    const originalExt = (file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2)).toLowerCase();
    if (dangerousExts.includes(`.${originalExt}`)) {
      return NextResponse.json({ error: 'Forbidden file extension for security reasons' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let finalBuffer: Buffer = Buffer.from(bytes);
    let finalFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    let mimeType = file.type;

    // Server-side Image Compression for uploads (compress to WebP/JPEG)
    if (file.type.startsWith('image/')) {
      try {
        const sharp = (await import('sharp')).default;
        finalBuffer = await sharp(Buffer.from(bytes))
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        
        finalFileName = finalFileName.replace(/\.[^/.]+$/, "") + ".webp";
        mimeType = 'image/webp';
      } catch (err) {
        console.warn('Sharp image compression fallback:', err);
      }
    }

    // Security Check 3: Sanitize folderName to prevent Path Traversal attacks
    const folderName = (jobId || discomId).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!folderName) {
      return NextResponse.json({ error: 'Invalid folder target' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'jobs', folderName);
    await mkdir(uploadDir, { recursive: true });

    // Sanitize filename and make unique with crypto UUID timestamp
    const filename = `${Date.now()}_${finalFileName}`;
    const path = join(uploadDir, filename);


    // Write compressed file to disk
    await writeFile(path, finalBuffer);

    const publicUrl = `/uploads/jobs/${folderName}/${filename}`;

    const { query } = await import('@/lib/db');

    
    // Check if this is a DISCOM document upload
    if (discomId) {
      let docTypeId = 1;

      if (documentType) {
        const parsed = parseInt(documentType, 10);
        if (!isNaN(parsed)) {
          docTypeId = parsed;
        } else {
          // Find document_type by matching name
          const docTypeRows = await query<any>(
            'SELECT id FROM document_types WHERE name LIKE ? OR name LIKE ? LIMIT 1',
            [`%${documentType}%`, `%${documentType.replace(/_/g, ' ')}%`]
          );
          if (docTypeRows.length > 0) {
            docTypeId = docTypeRows[0].id;
          } else {
            const insertRes: any = await query(
              'INSERT INTO document_types (name, description, mandatory) VALUES (?, ?, FALSE)',
              [documentType, documentType]
            );
            docTypeId = insertRes.insertId;
          }
        }
      }

      await query(
        'INSERT INTO documents (discom_application_id, document_type_id, file_name, file_path, file_size, mime_type, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [discomId, docTypeId, finalFileName, publicUrl, finalBuffer.length, mimeType, 'PENDING', 1]
      );
      
      // Update checklist to reflect it's uploaded
      await query(
        'INSERT INTO document_checklists (discom_application_id, document_type_id, is_uploaded) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_uploaded = 1',
        [discomId, docTypeId]
      );
    } else {
      // Standard Job Upload (Site Survey / Installation)
      const workerIdVal = formData.get('worker_id') || formData.get('user_id');
      const uploaderId = workerIdVal ? parseInt(workerIdVal.toString(), 10) : 1;

      const projects = await query('SELECT status FROM projects WHERE id = ?', [jobId]) as any[];
      if (projects.length > 0) {
        const status = projects[0].status;
        const isSurvey = status === 'NEW' || status === 'SITE_SURVEY' || status === 'SURVEY_SUBMITTED' || status === 'SURVEY_REJECTED';
        
        if (isSurvey) {
          let surveys = await query('SELECT id FROM site_surveys WHERE project_id = ?', [jobId]) as any[];
          if (surveys.length === 0) {
            await query('INSERT INTO site_surveys (project_id, created_by) VALUES (?, ?)', [jobId, uploaderId]);
            surveys = await query('SELECT id FROM site_surveys WHERE project_id = ?', [jobId]) as any[];
          }
          
          await query(
            'INSERT INTO site_survey_photos (site_survey_id, category, file_name, file_path, file_size, mime_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [surveys[0].id, documentType || 'GENERAL', finalFileName, publicUrl, finalBuffer.length, mimeType, uploaderId]
          );
        } else {
          let installs = await query('SELECT id FROM installations WHERE project_id = ?', [jobId]) as any[];
          if (installs.length === 0) {
            await query('INSERT INTO installations (project_id, created_by) VALUES (?, ?)', [jobId, uploaderId]);
            installs = await query('SELECT id FROM installations WHERE project_id = ?', [jobId]) as any[];
          }
          
          await query(
            'INSERT INTO installation_photos (installation_id, category, file_name, file_path, file_size, mime_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [installs[0].id, documentType || 'GENERAL', finalFileName, publicUrl, finalBuffer.length, mimeType, uploaderId]
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
