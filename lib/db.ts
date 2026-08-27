import mysql from 'mysql2/promise';
import { env } from 'process';

// Database connection pool
const pool = mysql.createPool({
  host: env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(env.MYSQL_PORT || '3306'),
  user: env.MYSQL_USER || 'root',
  password: env.MYSQL_PASSWORD || '',
  database: env.MYSQL_DATABASE || 'excellent_solar',
  socketPath: env.MYSQL_SOCKET || undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});



// Helper function to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

// Helper function to get a single row
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper function for insert operations
export async function insert(sql: string, params?: any[]): Promise<number> {
  const [result] = await pool.execute(sql, params);
  const resultAny = result as any;
  return resultAny.insertId;
}

// Helper function for update/delete operations
export async function execute(sql: string, params?: any[]): Promise<number> {
  const [result] = await pool.execute(sql, params);
  const resultAny = result as any;
  return resultAny.affectedRows;
}

// Transaction helper
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
