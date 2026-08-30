import { NextRequest, NextResponse } from 'next/server';
import { serialNumberDb } from '@/lib/db-helpers/serial-numbers';
import { query, queryOne, execute } from '@/lib/db';

// Auto-add invoice_no column if it doesn't exist (runs once on first call)
let columnChecked = false;
async function ensureInvoiceNoColumn() {
  if (columnChecked) return;
  try {
    // Check if column exists first (works on all MySQL versions)
    const cols = await query<{ COLUMN_NAME: string }>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'product_serial_numbers' 
       AND COLUMN_NAME = 'invoice_no'`
    );
    if (cols.length === 0) {
      await execute(`ALTER TABLE product_serial_numbers ADD COLUMN invoice_no VARCHAR(100) DEFAULT NULL`);
    }
    columnChecked = true;
  } catch (e) {
    columnChecked = true; // Don't block imports if migration fails
  }
}


export async function POST(req: NextRequest) {
  try {
    // Ensure invoice_no column exists (auto-migration)
    await ensureInvoiceNoColumn();

    const body = await req.json();
    const { product_id, invoice_no, warehouse_id, modules, user_id } = body;
    let targetProductId = product_id ? Number(product_id) : 0;

    // Only auto-resolve product if no product_id was provided from the UI
    if (!targetProductId) {
      let prodRes = await queryOne<{ id: number }>('SELECT id FROM products WHERE product_code = "BIN-21-615" LIMIT 1');
      if (!prodRes) {
        prodRes = await queryOne<{ id: number }>('SELECT id FROM products LIMIT 1');
      }
      if (prodRes?.id) {
        targetProductId = prodRes.id;
      } else {
        await queryOne<{ id: number }>(
          `INSERT INTO products (product_code, name, category, unit, current_stock) 
           VALUES ('BIN-21-615', 'Solar Panel 540W/550W (BIN-21-615)', 'SOLAR_PANEL', 'Piece', 0)`
        );
        const fetchedProd = await queryOne<{ id: number }>('SELECT id FROM products WHERE product_code = "BIN-21-615" LIMIT 1');
        targetProductId = fetchedProd?.id || 1;
      }
    }



    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json({ error: 'modules array is required' }, { status: 400 });
    }

    const userId = user_id || 1; // Default to admin if unauthenticated

    const result = await serialNumberDb.importFlasherReport({
      product_id: targetProductId,
      invoice_no,
      warehouse_id: warehouse_id ? Number(warehouse_id) : undefined,
      modules,
      userId,
    });


    return NextResponse.json({
      success: true,
      message: result.newlyInsertedCount > 0
        ? `Successfully registered ${result.newlyInsertedCount} new unique solar panel serial numbers into stock!`
        : `All ${result.importedCount} solar panel serial numbers already exist. Updated specifications without duplicating stock.`,
      ...result,
    });

  } catch (error: any) {
    console.error('Error importing FTR report:', error);
    return NextResponse.json({ error: error.message || 'Failed to import FTR report' }, { status: 500 });
  }
}
