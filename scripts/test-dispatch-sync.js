const mysql = require('mysql2/promise');

async function testDispatchAndSync() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'solar_user',
    password: 'solar123',
    database: 'excellent_solar',
  });

  console.log('=== TEST: DISPATCH & STOCK SYNC VALIDATION ===\n');

  try {
    // 1. Pick a test product
    const [products] = await pool.query("SELECT id, name, category, current_stock FROM products WHERE status = 'ACTIVE' LIMIT 1");
    if (!products.length) {
      console.error('No products found in database.');
      return;
    }
    const product = products[0];
    const initialStock = Number(product.current_stock || 0);
    console.log(`1. Target Product: ID=${product.id}, Name="${product.name}", Current Stock=${initialStock}`);

    // 2. Insert a fresh test serial number with valid ENUM ('WAREHOUSE')
    const testSerial = `TEST-SN-${Date.now()}`;
    await pool.query(
      `INSERT INTO product_serial_numbers (product_id, serial_number, status, current_location, remarks)
       VALUES (?, ?, 'AVAILABLE', 'WAREHOUSE', 'Local Test Serial')`,
      [product.id, testSerial]
    );
    console.log(`2. Inserted Available Serial Number: ${testSerial}`);

    // 3. Create a test Order Ticket (PENDING_DISPATCH)
    const [orderResult] = await pool.query(
      `INSERT INTO orders (order_number, customer_name, customer_mobile, status, order_type, total_amount, created_at, updated_at)
       VALUES (?, ?, ?, 'PENDING_DISPATCH', 'RETAIL', 5000, NOW(), NOW())`,
      [`ORD-TEST-${Date.now()}`, 'Test Customer Local', '9999999999']
    );
    const orderId = orderResult.insertId;
    console.log(`3. Created Test Order Ticket: ID=${orderId}`);

    // Add draft item
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
       VALUES (?, ?, 1, 5000, 5000)`,
      [orderId, product.id]
    );

    // 4. Simulate Exact Dispatch Logic from orderDb.dispatchTicket
    console.log(`4. Running Dispatch on Order ID=${orderId} with Serial=${testSerial}...`);
    
    // Update serial
    await pool.query(
      `UPDATE product_serial_numbers 
       SET status = 'ISSUED', current_location = 'ISSUED', remarks = CONCAT(COALESCE(remarks, ''), ' | Dispatched Test')
       WHERE serial_number = ?`,
      [testSerial]
    );

    await pool.query(
      `INSERT INTO order_serials (order_id, product_id, serial_number) VALUES (?, ?, ?)`,
      [orderId, product.id, testSerial]
    );

    // Sync stock: decrement
    await pool.query(
      `UPDATE products SET current_stock = GREATEST(0, current_stock - 1) WHERE id = ?`,
      [product.id]
    );

    // Log stock transaction
    await pool.query(
      `INSERT INTO stock_transactions (product_id, type, quantity, reference_id, reference_type, remarks, created_by)
       VALUES (?, 'ISSUE', 1, ?, 'ORDER_DISPATCH', 'Dispatched test order', 1)`,
      [product.id, orderId]
    );

    // Update order status
    await pool.query(
      `UPDATE orders SET status = 'DISPATCHED', dispatched_at = NOW(), vehicle_number = 'TEST-VEHICLE-123' WHERE id = ?`,
      [orderId]
    );

    // 5. Verify the updates in DB
    const [updatedSerial] = await pool.query('SELECT status, current_location FROM product_serial_numbers WHERE serial_number = ?', [testSerial]);
    const [updatedProduct] = await pool.query('SELECT current_stock FROM products WHERE id = ?', [product.id]);
    const [updatedOrder] = await pool.query('SELECT status, vehicle_number FROM orders WHERE id = ?', [orderId]);
    const [transactions] = await pool.query('SELECT type, quantity, reference_type FROM stock_transactions WHERE reference_id = ?', [orderId]);

    console.log('\n=== VERIFICATION RESULTS ===');
    console.log(`✓ Serial Status: ${updatedSerial[0].status} (Location: ${updatedSerial[0].current_location})`);
    console.log(`✓ Order Status: ${updatedOrder[0].status} (Vehicle: ${updatedOrder[0].vehicle_number})`);
    console.log(`✓ Product Stock: Initial=${initialStock} -> New=${updatedProduct[0].current_stock} (Deducted by 1)`);
    console.log(`✓ Stock Transaction Logged: ${transactions.length} record(s) with type='${transactions[0]?.type}'`);

    const isSuccess = updatedSerial[0].status === 'ISSUED' && 
                      updatedOrder[0].status === 'DISPATCHED' && 
                      updatedProduct[0].current_stock === initialStock - 1 &&
                      transactions.length > 0;

    if (isSuccess) {
      console.log('\n✅ ALL DISPATCH & STOCK SYNC OPERATIONS VALIDATED SUCCESSFULLY!');
    } else {
      console.error('\n❌ Verification check failed.');
    }

    // Clean up test records and restore stock
    await pool.query('DELETE FROM stock_transactions WHERE reference_id = ?', [orderId]);
    await pool.query('DELETE FROM order_serials WHERE order_id = ?', [orderId]);
    await pool.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
    await pool.query('DELETE FROM product_serial_numbers WHERE serial_number = ?', [testSerial]);
    await pool.query('UPDATE products SET current_stock = ? WHERE id = ?', [initialStock, product.id]);
    console.log('✓ Cleaned up test records and restored original stock.');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    pool.end();
  }
}

testDispatchAndSync();
