# Data Migration Guide: Local to Railway

This guide helps you migrate your local PostgreSQL data to the Railway PostgreSQL database.

## Prerequisites

1. **Local PostgreSQL running** with your data
2. **Railway project set up** with PostgreSQL service
3. **DATABASE_URL environment variable** set in Railway
4. **Node.js** installed locally

## Method 1: Automated Migration (Recommended)

### Step 1: Set up Railway Environment Variables

In your Railway project dashboard, ensure you have:
```
DATABASE_URL=your_railway_postgresql_url
```

### Step 2: Run the Migration Script

```bash
# Navigate to backend directory
cd backend

# Run the backup and restore script
npm run backup-restore
```

This script will:
1. ✅ Connect to your local database
2. ✅ Create a backup of all tables
3. ✅ Save backup to `local-backup.json`
4. ✅ Connect to Railway database
5. ✅ Restore all data to Railway
6. ✅ Provide detailed progress logs

### Step 3: Verify Migration

Check the Railway logs to ensure:
- All tables were migrated successfully
- No errors occurred during migration
- Data counts match between local and Railway

## Method 2: Manual Migration

### Step 1: Export Local Data

```bash
# Export specific tables
pg_dump -h localhost -U postgres -d finops -t users > users_backup.sql
pg_dump -h localhost -U postgres -d finops -t invoices > invoices_backup.sql
pg_dump -h localhost -U postgres -d finops -t transactions > transactions_backup.sql

# Or export entire database
pg_dump -h localhost -U postgres -d finops > full_backup.sql
```

### Step 2: Import to Railway

```bash
# Get Railway database URL from Railway dashboard
# Then import using psql

# For specific tables
psql "your_railway_database_url" -f users_backup.sql
psql "your_railway_database_url" -f invoices_backup.sql
psql "your_railway_database_url" -f transactions_backup.sql

# For full database
psql "your_railway_database_url" -f full_backup.sql
```

## Method 3: Using Railway CLI

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Connect and Migrate

```bash
# Login to Railway
railway login

# Link your project
railway link

# Connect to Railway database
railway connect

# Now you can use psql commands
psql -h localhost -U postgres -d finops -c "COPY users TO STDOUT" | psql "your_railway_url" -c "COPY users FROM STDIN"
```

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to local database
```
Solution: Ensure PostgreSQL is running locally
- Windows: Check Services app
- Mac: brew services start postgresql
- Linux: sudo systemctl start postgresql
```

**Problem**: Can't connect to Railway database
```
Solution: Check DATABASE_URL environment variable
- Go to Railway dashboard
- Copy the PostgreSQL connection string
- Ensure it's set correctly
```

### Data Type Issues

**Problem**: Column type mismatch
```
Solution: Check schema compatibility
- Compare local and Railway table schemas
- Update Railway schema if needed
- Use the init-db.js script first
```

### Permission Issues

**Problem**: Access denied to local database
```
Solution: Check PostgreSQL permissions
- Ensure user 'postgres' has access
- Check pg_hba.conf file
- Try: ALTER USER postgres PASSWORD 'password';
```

## Data Verification

After migration, verify your data:

### Check Table Counts

```sql
-- In Railway database
SELECT 
  schemaname,
  tablename,
  n_tup_ins as rows
FROM pg_stat_user_tables
ORDER BY tablename;
```

### Compare Specific Tables

```sql
-- Check users table
SELECT COUNT(*) as user_count FROM users;

-- Check invoices table
SELECT COUNT(*) as invoice_count FROM invoices;

-- Check transactions table
SELECT COUNT(*) as transaction_count FROM transactions;
```

### Verify Data Integrity

```sql
-- Check for any NULL values in important columns
SELECT COUNT(*) FROM users WHERE email IS NULL;
SELECT COUNT(*) FROM invoices WHERE amount IS NULL;

-- Check date ranges
SELECT MIN(created_at), MAX(created_at) FROM invoices;
```

## Backup Strategy

### Before Migration

1. **Create local backup**:
   ```bash
   pg_dump -h localhost -U postgres -d finops > pre_migration_backup.sql
   ```

2. **Test migration** on a copy first

3. **Document current state**:
   ```sql
   SELECT table_name, COUNT(*) as row_count 
   FROM information_schema.tables t
   JOIN pg_stat_user_tables s ON t.table_name = s.relname
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

### After Migration

1. **Verify all data** migrated correctly
2. **Test application** with Railway database
3. **Keep local backup** for safety
4. **Update application** to use Railway

## Environment Variables

### Local Development

```bash
# .env file for local development
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finops
```

### Railway Production

```bash
# Railway environment variables
DATABASE_URL=postgresql://user:password@host:port/database
FIREBASE_PROJECT_ID=your-project-id
JWT_SECRET=your-secret-key
```

## Security Notes

- ✅ **Never commit** database credentials to version control
- ✅ **Use environment variables** for sensitive data
- ✅ **Encrypt backups** if containing sensitive information
- ✅ **Limit access** to production database
- ✅ **Regular backups** of Railway database

## Performance Tips

- **Batch operations** for large datasets
- **Index optimization** after migration
- **Connection pooling** for better performance
- **Monitor query performance** in Railway dashboard

## Rollback Plan

If migration fails:

1. **Keep local database** running
2. **Use local backup** to restore if needed
3. **Check Railway logs** for specific errors
4. **Fix issues** and retry migration
5. **Test thoroughly** before switching

## Support

If you encounter issues:

1. Check Railway logs for errors
2. Verify environment variables
3. Test database connections
4. Review this guide for troubleshooting
5. Check PostgreSQL documentation 