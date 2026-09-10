import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { reservationDb } from '@/lib/db-helpers/reservations';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Save image if provided
    let photoPath = '';
    const sitePhoto = formData.get('sitePhoto') as File | null;
    if (sitePhoto && sitePhoto.size > 0) {
      const buffer = Buffer.from(await sitePhoto.arrayBuffer());
      const filename = `booking_${Date.now()}_${sitePhoto.name.replaceAll(' ', '_')}`;
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      photoPath = `/uploads/${filename}`;
    }

    // Extract all fields
    const customerName   = formData.get('customerName') as string;
    const mobileNumber   = formData.get('mobileNumber') as string;
    const emailId        = formData.get('emailId') as string;
    const address        = formData.get('address') as string;
    const pspclAccountNo = formData.get('pspclAccountNo') as string;
    const pspclSubDiv    = formData.get('pspclSubDivision') as string;
    const sanctionedLoad = formData.get('sanctionedLoad') as string;
    const proposedLoad   = formData.get('proposedLoad') as string;
    const connectionType = formData.get('connectionType') as string;
    const connectionPhase= formData.get('connectionPhase') as string;
    const panelType      = formData.get('panelType') as string;
    const panelMake      = formData.get('panelMake') as string;
    const panelWattage   = formData.get('panelWattage') as string;
    const inverter       = formData.get('inverterCapacityMake') as string;
    const numPanels      = formData.get('numberOfPanels') as string;
    const bookingAmount  = formData.get('bookingAmount') as string;
    const totalAmount    = formData.get('totalAmount') as string;
    const geotag         = formData.get('geotag') as string;

    const workerIdRaw = formData.get('workerId') as string;
    const workerId = workerIdRaw ? parseInt(workerIdRaw) : 1;
    const reservationsRaw = formData.get('reservations') as string;

    const customerType = formData.get('customerType') as string || 'PROJECT';

    // 1. Find or Insert Customer
    let customerId;
    const existingCust = await query('SELECT id FROM customers WHERE mobile = ?', [mobileNumber]) as any[];
    
    if (existingCust && existingCust.length > 0) {
      customerId = existingCust[0].id;
      // Optionally update customer_type if they are now a RETAIL dealer? We'll just leave it.
    } else {
      const custResult = await query(
        'INSERT INTO customers (name, mobile, email, address, city, district, state, customer_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [customerName, mobileNumber, emailId || null, address, 'N/A', 'N/A', 'N/A', customerType]
      ) as any;
      customerId = custResult.insertId;
    }
    const projectId = `ES-${new Date().getFullYear()}-${customerId.toString().padStart(4, '0')}`;

    if (customerType === 'RETAIL') {
      // For RETAIL, we might just create the customer and maybe an order/ticket if there are reservations.
      // For now, if there are reservations, we can store them as a retail requirement (ticket).
      if (reservationsRaw) {
        try {
          const reservationItems = JSON.parse(reservationsRaw);
          if (Array.isArray(reservationItems) && reservationItems.length > 0) {
             const { insertRetailTicket } = await import('@/lib/db-helpers/orders').catch(() => ({ insertRetailTicket: null }));
             if (insertRetailTicket) {
                // If we have an order helper for retail tickets, we could use it here.
                // Or just insert directly into `orders` with RETAIL_REQUIREMENT.
                const totalAmountNum = totalAmount ? parseFloat(totalAmount) : 0;
                const orderResult = await query(
                  'INSERT INTO orders (customer_id, order_type, status, total_amount) VALUES (?, ?, ?, ?)',
                  [customerId, 'RETAIL_REQUIREMENT', 'PENDING_DISPATCH', totalAmountNum]
                ) as any;
                
                for (const item of reservationItems) {
                  await query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
                    [orderResult.insertId, item.product_id, item.quantity, 0, 0] // using 0 price since we don't have it here
                  );
                }
             }
          }
        } catch (e) {
          console.warn('Failed to create retail reservations:', e);
        }
      }
      return NextResponse.json({ 
        success: true, 
        message: 'Retail Dealer created successfully',
      });
    }

    // 2. Insert Project with all technical data (ONLY FOR PROJECT TYPE)
    const projectResult = await query(
      `INSERT INTO projects (
        project_id, customer_id, status, created_by, discom,
        account_number, consumer_number, subdivision, sanctioned_load, solar_load,
        site_address, capacity, geotag_location, site_photo_path
      ) VALUES (?, ?, ?, ?, 'PSPCL', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId, customerId, 'NEW', workerId,
        pspclAccountNo || null,
        pspclAccountNo || null,
        pspclSubDiv || null,
        sanctionedLoad ? parseFloat(sanctionedLoad) : null,
        proposedLoad ? parseFloat(proposedLoad) : null,
        address,
        proposedLoad ? parseFloat(proposedLoad) : null,
        geotag || null,
        photoPath || null,
      ]
    ) as any;

    const dbProjectId = projectResult.insertId;

    // 3. Create inventory reservations if provided
    if (reservationsRaw) {
      try {
        const reservationItems = JSON.parse(reservationsRaw);
        if (Array.isArray(reservationItems) && reservationItems.length > 0) {
          await reservationDb.createBatch(dbProjectId, reservationItems, workerId);
        }
      } catch (e) {
        console.warn('Failed to create reservations:', e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking created successfully',
      project_id: projectId,
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
}

