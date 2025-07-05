# Revenue Management System

A full-stack web application for managing revenue, commissions, and user data with role-based access control.

## Features

- **User Management**: Role-based access control (G1, G2, G3 users)
- **Revenue Tracking**: Monitor revenue and commission data
- **Invoice Management**: Create and track invoices
- **Analytics Dashboard**: Visualize data with charts and graphs
- **Export Functionality**: Export data to Excel and CSV formats
- **Admin Panel**: User management and data import capabilities

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Firebase Authentication**
- **JWT** for session management
- **Multer** for file uploads
- **ExcelJS** for Excel file generation

### Frontend
- **React.js** with functional components
- **React Router** for navigation
- **Chart.js** for data visualization
- **Axios** for API calls
- **CSS3** with modern styling

## Project Structure

```
├── backend/                 # Backend server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Authentication & validation
│   │   ├── models/         # Database models
│   │   └── utils/          # Utility functions
│   ├── schema.sql          # Database schema
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main app component
│   └── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Firebase project setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory with:
   ```
   PORT=5000
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   FIREBASE_PROJECT_ID=your_firebase_project_id
   ```

4. Set up the database:
   ```bash
   # Run the schema file
   psql -d your_database -f schema.sql
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

### User Roles
- **G1 Users**: Full access to all features including admin panel
- **G2 Users**: Can create projects and manage invoices
- **G3 Users**: View-only access to dashboards

### Key Features
1. **Dashboard**: View revenue, commission, and project data
2. **Invoice Management**: Create and track invoices
3. **Export Data**: Export to Excel or CSV formats
4. **Admin Panel**: Manage users and import data

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Dashboard
- `GET /api/dashboard/:grade` - Get dashboard data by user grade
- `GET /api/analytics` - Get analytics data

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/export` - Export invoices

### Users
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `POST /api/users/import` - Import users from CSV (admin only)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository. 