import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { serviceTicketDb } from '@/lib/db-helpers/service';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const body = await request.json();
    
    // Fetch the ticket first to get user references
    const ticket = await serviceTicketDb.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (body.status) {
      await serviceTicketDb.update(id, { 
        status: body.status, 
        resolution: body.resolution,
        resolution_photo_path: body.resolution_photo_path,
        resolution_latitude: body.resolution_latitude,
        resolution_longitude: body.resolution_longitude
      });
      
      // Notification logic for Reopened/Rejected/Closed tickets sent to INSTALLATION users
      if (body.status === 'REJECTED' || body.status === 'REOPENED' || body.status === 'CLOSED') {
        const installers = await query<{id: number}>('SELECT id FROM users WHERE role = ?', ['INSTALLATION']) as any[];
        
        for (const installer of installers) {
          const notifyUserId = installer.id;
          const title = `Ticket ${body.status === 'REJECTED' ? 'Rejected' : body.status === 'REOPENED' ? 'Reopened' : 'Closed'}`;
          const message = `Service Ticket #${ticket.ticket_number} has been ${body.status.toLowerCase()}.${body.resolution ? ' Reason: ' + body.resolution : ''}`;
          
          await execute(
            'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
            [notifyUserId, title, message, body.status === 'REJECTED' ? 'ERROR' : body.status === 'CLOSED' ? 'SUCCESS' : 'WARNING', `/service-tickets/${id}`]
          );
        }
      }
    }
    
    if (body.payment_status) {
      await execute('UPDATE service_tickets SET payment_status = ? WHERE id = ?', [body.payment_status, id]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating service ticket:', error);
    return NextResponse.json({ error: error.message || 'Failed to update ticket' }, { status: 500 });
  }
}
