/**
 * MySQL Database Connection Pool Configuration
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'setlone_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
});

/**
 * Execute a query with automatic connection management
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export async function query(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a transaction
 * @param {Function} callback - Transaction callback function
 * @returns {Promise} Transaction result
 */
export async function transaction(callback) {
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

/**
 * Get a connection from the pool (for advanced usage)
 * @returns {Promise} Database connection
 */
export async function getConnection() {
  return await pool.getConnection();
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export async function testConnection() {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    return rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get pool statistics
 * @returns {Object} Pool statistics
 */
export function getPoolStats() {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    queuedRequests: pool.pool._connectionQueue.length
  };
}

/**
 * Close all connections in the pool
 * @returns {Promise}
 */
export async function closePool() {
  return await pool.end();
}

// Test connection on module load
testConnection().then(isConnected => {
  if (isConnected) {
    console.log('✅ Database connection pool initialized successfully');
  } else {
    console.error('❌ Database connection pool initialization failed');
  }
});

export default pool;

