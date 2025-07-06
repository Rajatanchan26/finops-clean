const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  let pool;
  
  try {
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
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'finops',
      });
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    // Test the connection
    const result = await pool.query('SELECT NOW() as current_time');
    
    await pool.end();
    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    if (pool) {
      await pool.end();
    }
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 