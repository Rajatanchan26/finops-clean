# Railway Database Setup Guide

This guide explains how to set up and configure the PostgreSQL database on Railway for the FinOps application.

## Prerequisites

1. Railway account and project created
2. PostgreSQL service added to your Railway project

## Environment Variables

Railway automatically provides a `DATABASE_URL` environment variable when you add a PostgreSQL service. The application is configured to use this automatically.

### Required Environment Variables

- `DATABASE_URL` - Automatically provided by Railway PostgreSQL service
- `JWT_SECRET` - Your JWT secret key for authentication
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FRONTEND_URL` - Your frontend URL (e.g., Vercel deployment URL)

### Optional Environment Variables (Fallback)

If `DATABASE_URL` is not available, the app will fall back to these individual variables:
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password  
- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name

## Database Initialization

### Option 1: Automatic (Recommended)

The database will be automatically initialized when the application starts for the first time.

### Option 2: Manual Initialization

If you need to manually initialize the database:

1. Connect to your Railway PostgreSQL service
2. Run the schema file:
   ```sql
   -- Copy and paste the contents of schema.sql
   ```

### Option 3: Using the Init Script

You can also use the provided initialization script:

```bash
npm run init-db
```

## Database Schema

The application uses the following tables:

- `users` - User accounts and authentication
- `invoices` - Invoice management
- `transactions` - Financial transactions
- `audit_logs` - System audit trail

## Connection Details

The application automatically detects and uses Railway's `DATABASE_URL` which includes:
- SSL connection (required for Railway)
- Proper authentication
- Connection pooling

## Troubleshooting

### Connection Issues

1. **SSL Error**: The app is configured with `rejectUnauthorized: false` for Railway
2. **Connection Timeout**: Check if the `DATABASE_URL` is properly set
3. **Authentication Error**: Verify the database credentials in Railway dashboard

### Database Not Found

If you get "database does not exist" errors:
1. Go to Railway dashboard
2. Navigate to your PostgreSQL service
3. Check if the database was created automatically
4. If not, create it manually or run the initialization script

### Schema Issues

If tables are missing:
1. Run the initialization script: `npm run init-db`
2. Or manually execute the `schema.sql` file

## Monitoring

You can monitor your database connection in the Railway dashboard:
1. Go to your PostgreSQL service
2. Check the "Metrics" tab for connection stats
3. View logs for any connection issues

## Backup and Restore

Railway provides automatic backups for PostgreSQL services. You can also:
1. Use Railway's backup feature in the dashboard
2. Export data using standard PostgreSQL tools
3. Use the application's export features for data backup

## Security Notes

- The `DATABASE_URL` contains sensitive credentials - never commit it to version control
- Railway automatically rotates database credentials
- SSL is enabled by default for secure connections
- Connection pooling is configured for optimal performance 