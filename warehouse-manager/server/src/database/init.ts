import fs from 'fs';
import path from 'path';
import { pool } from './db';

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

export async function initializeDatabase(): Promise<void> {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  // Strip line comments
  const cleanSql = schema
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  // Split schema into individual SQL statements
  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const connection = await pool.getConnection();
  try {
    console.log(`Executing ${statements.length} MySQL DDL statements...`);
    for (const stmt of statements) {
      if (stmt) {
        await connection.query(stmt);
      }
    }
    console.log('MySQL database schema initialized successfully.');
  } finally {
    connection.release();
  }
}

// Run directly if called as a script
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}
