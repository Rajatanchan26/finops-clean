# FinOps Backend

Express.js backend server for the Financial Operations Management System.

## Features

- **User Authentication**: Firebase Auth integration with JWT tokens
- **Database Management**: PostgreSQL with Railway integration
- **Role-based Access Control**: Admin, G1, G2, G3 user roles
- **Invoice Management**: CRUD operations for invoices
- **Budget Tracking**: Department and user-level budget management
- **Commission Tracking**: Revenue and commission calculations
- **Export Functionality**: PDF, Excel, and CSV exports
- **Real-time Notifications**: WebSocket-based notifications
- **Audit Logging**: Comprehensive audit trail

## Tech Stack

- **Node.js** with Express.js
- **PostgreSQL** database (Railway)
- **Firebase Authentication**
- **JWT** for session management
- **WebSocket** for real-time features
- **Multer** for file uploads
- **ExcelJS** for Excel file generation

## Prerequisites

- Node.js (v16 or higher)
- Railway PostgreSQL database (recommended) or local PostgreSQL
- Firebase project setup

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file or set Railway environment variables:
   ```
   DATABASE_URL=your_railway_postgresql_url
   JWT_SECRET=your_jwt_secret_key
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FRONTEND_URL=your_frontend_url
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the server**
   ```bash
   npm start
   ```

## Environment Variables

### Required
- `DATABASE_URL` - Railway PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `FIREBASE_PROJECT_ID` - Your Firebase project ID

### Optional
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS

## Database Setup

The application automatically uses Railway's `DATABASE_URL` environment variable. See `RAILWAY_SETUP.md` for detailed database configuration instructions.

## API Endpoints

### Authentication
- `POST /login` - User login with Firebase token
- `POST /sync-user` - Sync Firebase user with database
- `POST /sync-all-users` - Bulk sync all Firebase users (admin only)

### Users
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user details
- `POST /users` - Create new user (admin only)
- `PATCH /users/:id` - Update user (admin only)
- `DELETE /users/:id` - Delete user (admin only)

### Invoices
- `GET /invoices` - Get all invoices
- `POST /invoices` - Create new invoice
- `PATCH /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice
- `GET /invoices/export` - Export invoices

### Budget
- `GET /budget` - Get budget data by scope

### Commission
- `GET /commission` - Get commission data by scope

### Analytics
- `GET /analytics` - Get analytics data
- `GET /transactions` - Get transaction data

## Development

### Running in Development Mode
```bash
npm run dev
```

### Database Initialization
```bash
npm run init-db
```

### Testing Database Connection
The application includes automatic database connection testing and fallback to mock data if the database is unavailable.

## Deployment

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
- `DATABASE_URL` - Railway PostgreSQL URL
- `JWT_SECRET` - Strong secret key
- `FIREBASE_PROJECT_ID` - Production Firebase project
- `FRONTEND_URL` - Production frontend URL

## Security

- SSL/TLS encryption for database connections
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting (recommended for production)

## Monitoring

- Database connection logging
- Error tracking and logging
- Performance monitoring
- Audit trail for all user actions

## Troubleshooting

See `RAILWAY_SETUP.md` for database-specific troubleshooting.

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Verify Railway PostgreSQL service is running
   - Check SSL configuration

2. **Authentication Issues**
   - Verify Firebase configuration
   - Check JWT secret is set
   - Ensure Firebase project ID is correct

3. **CORS Errors**
   - Update `FRONTEND_URL` environment variable
   - Check CORS configuration in `index.js`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
