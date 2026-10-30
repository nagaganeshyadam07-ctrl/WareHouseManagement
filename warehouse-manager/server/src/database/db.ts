import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const poolConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'warehouse_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// If socket path exists and is configured, use it for local Mac connection
if (process.env.DB_SOCKET_PATH && process.env.DB_SOCKET_PATH.length > 0) {
  poolConfig.socketPath = process.env.DB_SOCKET_PATH;
}

export const pool = mysql.createPool(poolConfig);

/**
 * Execute query with parameters
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

/**
 * Execute single row query helper
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<any[]>(sql, params);
  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0] as T;
  }
  return null;
}

/**
 * Execute within a MySQL transaction with automatic rollback on error.
 * Supports row locking (SELECT ... FOR UPDATE) inside the callback.
 */
export async function withTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
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
