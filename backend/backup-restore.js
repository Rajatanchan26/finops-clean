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

async function backupLocalData() {
  try {
    console.log('📦 Creating backup of local database...');
    
    // Test local connection
    await localPool.query('SELECT NOW() as local_time');
    console.log('✅ Local database connection successful');
    
    // Get all tables
    const tablesResult = await localPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Found tables:', tables);
    
    const backup = {};
    
    for (const table of tables) {
      console.log(`📊 Backing up table: ${table}`);
      
      const data = await localPool.query(`SELECT * FROM ${table}`);
      backup[table] = data.rows;
      
      console.log(`   ✅ Backed up ${data.rows.length} rows from ${table}`);
    }
    
    // Save backup to file
    const backupPath = path.join(__dirname, 'local-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`💾 Backup saved to: ${backupPath}`);
    console.log(`📄 Backup file size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
    
    return backup;
    
  } catch (error) {
    console.error('Backup failed:', error.message);
    throw error;
  } finally {
    await localPool.end();
  }
}

async function restoreToRailway(backup) {
  try {
    console.log('🚀 Restoring data to Railway database...');
    
    // Test Railway connection
    await railwayPool.query('SELECT NOW() as railway_time');
    console.log('✅ Railway database connection successful');
    
    for (const [table, rows] of Object.entries(backup)) {
      console.log(`\n🔄 Restoring table: ${table}`);
      
      if (rows.length === 0) {
        console.log(`   ⏭️  Skipping ${table} (no data)`);
        continue;
      }
      
      try {
        // Check if table exists
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
        
        // Clear existing data
        await railwayPool.query(`DELETE FROM ${table}`);
        console.log(`   🗑️  Cleared existing data from Railway ${table}`);
        
        if (rows.length === 0) {
          console.log(`   ⏭️  No data to restore for ${table}`);
          continue;
        }
        
        // Get column names from first row
        const columns = Object.keys(rows[0]);
        const columnList = columns.join(', ');
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        
        // Insert data
        let insertedCount = 0;
        for (const row of rows) {
          const values = columns.map(col => row[col]);
          
          await railwayPool.query(
            `INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`,
            values
          );
          insertedCount++;
        }
        
        console.log(`   ✅ Successfully restored ${insertedCount} rows to Railway ${table}`);
        
      } catch (error) {
        console.error(`   ❌ Error restoring ${table}:`, error.message);
      }
    }
    
    console.log('\n🎉 Data restoration completed!');
    
  } catch (error) {
    console.error('Restoration failed:', error.message);
    throw error;
  } finally {
    await railwayPool.end();
  }
}

async function migrateData() {
  try {
    console.log('🚀 Starting data migration from local to Railway...\n');
    
    // Step 1: Backup local data
    const backup = await backupLocalData();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 2: Restore to Railway
    await restoreToRailway(backup);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📁 Backup file saved as: local-backup.json');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = { backupLocalData, restoreToRailway, migrateData };

// Run if this file is executed directly
if (require.main === module) {
  migrateData();
} 