import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/dashboard/discom - Get DISCOM dashboard data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'urgent', 'pending-docs', 'recent-approvals'

    let sql = '';
    let params: any[] = [];

    if (type === 'urgent') {
      sql = `
        SELECT
          da.id,
          da.application_id,
          p.project_id,
          c.name as customer,
          p.discom,
          da.status,
          DATEDIFF(NOW(), da.updated_at) as pending_days
        FROM discom_applications da
        JOIN projects p ON da.project_id = p.id
        JOIN customers c ON p.customer_id = c.id
        WHERE da.status IN ('JE_PENDING', 'SDO_PENDING', 'XEN_PENDING', 'DOCUMENTS_PENDING')
        AND da.updated_at < DATE_SUB(NOW(), INTERVAL 3 DAY)
        ORDER BY pending_days DESC
      `;
    } else if (type === 'pending-docs') {
      sql = `
        SELECT
          da.id,
          da.application_id,
          c.name as customer,
          GROUP_CONCAT(dt.name) as missing_docs,
          da.created_at as submitted
        FROM discom_applications da
        JOIN projects p ON da.project_id = p.id
        JOIN customers c ON p.customer_id = c.id
        LEFT JOIN document_checklists dc ON da.id = dc.discom_application_id
        LEFT JOIN document_types dt ON dc.document_type_id = dt.id
        WHERE da.status = 'DOCUMENTS_PENDING'
        AND dc.is_uploaded = 0
        GROUP BY da.id, da.application_id, c.name, da.created_at
      `;
    } else if (type === 'recent-approvals') {
      sql = `
        SELECT
          da.id,
          da.application_id,
          c.name as customer,
          p.discom,
          da.status,
          da.updated_at as approved
        FROM discom_applications da
        JOIN projects p ON da.project_id = p.id
        JOIN customers c ON p.customer_id = c.id
        WHERE da.status IN ('JE_APPROVED', 'SDO_APPROVED', 'XEN_APPROVED', 'APPROVED')
        AND da.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY da.updated_at DESC
      `;
    }

    const data = await query(sql, params);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching DISCOM data:', error);
    return NextResponse.json({ error: 'Failed to fetch DISCOM data' }, { status: 500 });
  }
}
