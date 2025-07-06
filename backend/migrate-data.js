const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Local database configuration
const localPool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'finops',
});

// Railway database configuration
let railwayPool;
try {
  if (process.env.DATABASE_URL) {
    railwayPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  } else {
    railwayPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'finops',
    });
  }
} catch (error) {
  console.error('Failed to connect to Railway database:', error.message);
  process.exit(1);
}

async function migrateData() {
  try {
    console.log('Starting data migration from local to Railway database...');
    
    // Test connections
    console.log('Testing database connections...');
    await localPool.query('SELECT NOW() as local_time');
    await railwayPool.query('SELECT NOW() as railway_time');
    console.log('✅ Both database connections successful');
    
    // Get all tables from local database
    const tablesResult = await localPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Found tables:', tables);
    
    for (const table of tables) {
      console.log(`\n🔄 Migrating table: ${table}`);
      
      try {
        // Get data from local database
        const localData = await localPool.query(`SELECT * FROM ${table}`);
        console.log(`   📊 Found ${localData.rows.length} rows in local ${table}`);
        
        if (localData.rows.length === 0) {
          console.log(`   ⏭️  Skipping ${table} (no data)`);
          continue;
        }
        
        // Check if table exists in Railway database
        const tableExists = await railwayPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);
        
        if (!tableExists.rows[0].exists) {
          console.log(`   ⚠️  Table ${table} doesn't exist in Railway database, skipping`);
          continue;
        }
        
        // Get column names
        const columns = Object.keys(localData.rows[0]);
        const columnList = columns.join(', ');
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        
        // Clear existing data (optional - comment out if you want to append)
        await railwayPool.query(`DELETE FROM ${table}`);
        console.log(`   🗑️  Cleared existing data from Railway ${table}`);
        
        // Insert data into Railway database
        let insertedCount = 0;
        for (const row of localData.rows) {
          const values = columns.map(col => row[col]);
          
          // Handle sequences for auto-increment columns
          if (table === 'users' && row.id) {
            // Reset sequence for users table
            await railwayPool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
          }
          
          await railwayPool.query(
            `INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`,
            values
          );
          insertedCount++;
        }
        
        console.log(`   ✅ Successfully migrated ${insertedCount} rows to Railway ${table}`);
        
      } catch (error) {
        console.error(`   ❌ Error migrating ${table}:`, error.message);
      }
    }
    
    console.log('\n🎉 Data migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await localPool.end();
    await railwayPool.end();
  }
}

// Export function for use in other scripts
module.exports = { migrateData };

// Run if this file is executed directly
if (require.main === module) {
  migrateData();
} 