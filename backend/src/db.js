const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  // Use Railway's DATABASE_URL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Fallback to individual environment variables
  pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });
}

module.exports = pool; 