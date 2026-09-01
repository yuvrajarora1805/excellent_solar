import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/inventory/products - Get all products with available stock
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const search = searchParams.get('search');

    let sql = `SELECT *, 
      (current_stock - COALESCE(reserved_stock, 0)) AS available_stock
      FROM products WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as count FROM products WHERE 1=1`;
    
    let params: any[] = [];
    
    let conditions = '';
    if (category) {
      conditions += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      conditions += ' AND (name LIKE ? OR product_code LIKE ? OR brand LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    if (lowStock === 'true') {
      conditions += ' AND current_stock <= minimum_stock';
    }

    sql += conditions;
    countSql += conditions;
    
    sql += ' ORDER BY category, name';

    const countParams = [...params]; // Copy params before adding limit/offset

    if (limitParam) {
      const limit = Number(limitParam);
      if (!isNaN(limit)) {
        sql += ` LIMIT ${limit}`;
        if (offsetParam) {
          const offset = Number(offsetParam);
          if (!isNaN(offset)) {
            sql += ` OFFSET ${offset}`;
          }
        }
      }
    }

    const [products, countResult, categoryResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams),
      query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category')
    ]);

    console.log('Fetched products count:', products.length, 'with conditions:', conditions);

    const total = (countResult as any)[0]?.count || 0;
    const categories = (categoryResult as any).map((c: any) => c.category);

    // Return the object format expected by the dashboard, plus the flat array for mobile compatibility if needed? 
    // Actually, mobile just decodes a list. Oh wait! Mobile `jsonDecode(response.body)` assumes a list!
    // If I return an object, mobile will break!
    
    // Ah, wait. Mobile:
    // final List<dynamic> data = jsonDecode(response.body);
    // If I return an object, it throws an error on mobile.
    // I can make it return a list if a specific flag is passed, or if 'limit' is NOT present!
    const formattedProducts = products.map((p: any) => ({
      ...p,
      available_stock: parseInt(p.available_stock, 10) || 0,
      current_stock: parseInt(p.current_stock, 10) || 0,
    }));

    if (!limitParam) {
      return NextResponse.json(formattedProducts);
    }

    return NextResponse.json({ products: formattedProducts, total, categories });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/inventory/products - Create a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_code, name, category, brand, model, specification, unit, minimum_stock, current_stock } = body;

    if (!product_code || !name || !category) {
      return NextResponse.json({ error: 'Product code, name, and category are required' }, { status: 400 });
    }

    const insertRes: any = await query(
      `INSERT INTO products (product_code, name, category, brand, model, specification, unit, minimum_stock, current_stock, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        product_code,
        name,
        category,
        brand || null,
        model || null,
        specification || null,
        unit || 'Piece',
        Number(minimum_stock) || 0,
        Number(current_stock) || 0,
      ]
    );

    return NextResponse.json({ id: insertRes.insertId, ...body }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Product code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

