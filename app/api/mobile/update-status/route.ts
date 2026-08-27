import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { reservationDb } from '@/lib/db-helpers/reservations';

// Valid project status ENUM values from DB
const VALID_PROJECT_STATUSES = [
  'NEW', 'SITE_SURVEY', 'SURVEY_SUBMITTED', 'SURVEY_VERIFIED',
  'MATERIAL_ALLOCATED', 'INSTALLATION_STARTED', 'INSTALLATION_COMPLETED',
  'FINAL_VERIFICATION', 'PROJECT_COMPLETED',
];

export async function POST(request: Request) {
  try {
    const { type, id, status, notes } = await request.json();

    if (!type || !id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'JOB') {
      // Map generic mobile status to correct DB ENUM value
      let dbStatus = status;

      if (status === 'COMPLETED') {
        // Look up current project status to decide correct next state
        const project = await queryOne<{ status: string }>(
          'SELECT status FROM projects WHERE id = ?', [id]
        );
        const currentStatus = project?.status || '';

        if (
          currentStatus === 'SITE_SURVEY' ||
          currentStatus === 'NEW' ||
          currentStatus === 'SURVEY_SUBMITTED'
        ) {
          dbStatus = 'SURVEY_SUBMITTED';
        } else {
          // Installation phase or later → mark installation as completed
          dbStatus = 'INSTALLATION_COMPLETED';
        }
      }

      // Validate final status against allowed ENUM values
      if (!VALID_PROJECT_STATUSES.includes(dbStatus)) {
        return NextResponse.json(
          { error: `Invalid status value: ${dbStatus}` },
          { status: 400 }
        );
      }

      await query('UPDATE projects SET status = ? WHERE id = ?', [dbStatus, id]);

      // If notes/pending remarks provided, save to site_surveys or installations
      if (notes) {
        await query('UPDATE installations SET remarks = ? WHERE project_id = ?', [notes, id]);
        await query('UPDATE site_surveys SET remarks = ? WHERE project_id = ?', [notes, id]);
      }

      // If it's a survey, ensure a site_surveys record exists so it shows in the web app
      if (dbStatus === 'SURVEY_SUBMITTED') {
        const existingSurvey = await queryOne<{ id: number }>('SELECT id FROM site_surveys WHERE project_id = ?', [id]);
        if (!existingSurvey) {
          await query(
            `INSERT INTO site_surveys (project_id, status, submitted_at, created_by, shading, extra_structure, remarks) 
             VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
            [id, 'SUBMITTED', 1, false, false, notes || null]
          );
        } else {
          await query('UPDATE site_surveys SET status = ?, submitted_at = NOW(), remarks = COALESCE(?, remarks) WHERE project_id = ?', ['SUBMITTED', notes || null, id]);
        }
      }

      // If it's an installation, ensure an installations record exists so it shows in the web app
      if (dbStatus === 'INSTALLATION_COMPLETED') {
        const existingInst = await queryOne<{ id: number }>('SELECT id FROM installations WHERE project_id = ?', [id]);
        if (!existingInst) {
          await query(
            `INSERT INTO installations (project_id, status, submitted_at, created_by, structure_installed, earthing_completed, wiring_completed, testing_completed, remarks) 
             VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
            [id, 'SUBMITTED', 1, true, true, true, true, notes || null]
          );
        } else {
          await query('UPDATE installations SET status = ?, submitted_at = NOW(), remarks = COALESCE(?, remarks) WHERE project_id = ?', ['SUBMITTED', notes || null, id]);
        }

        // Reduce reserved items and make them SOLD/ISSUED
        await reservationDb.issue(id);
      }


    } else if (type === 'TICKET') {
      // Update Ticket Status
      let updateSql = 'UPDATE service_tickets SET status = ?';
      const params: any[] = [status];

      if (notes) {
        updateSql += ', resolution = ?';
        params.push(notes);
      }

      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateSql += ', resolved_at = CURRENT_TIMESTAMP';
      }

      updateSql += ' WHERE id = ?';
      params.push(id);

      await query(updateSql, params);
    } else {
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Status updated successfully' });

  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
