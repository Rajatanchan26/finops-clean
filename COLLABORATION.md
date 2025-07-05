# Collaboration Guide

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Git
- Firebase project (for authentication)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone git@github.com:Rajatanchan26/finops-clean.git
   cd finops-clean
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   FIREBASE_PROJECT_ID=your_firebase_project_id
   ```
   
   **Important**: Never commit the `.env` file or any Firebase service account keys to Git.

4. **Database Setup**
   ```bash
   # Run the schema file
   psql -d your_database -f backend/schema.sql
   ```

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `clean-main`: Clean branch without sensitive data
- `rajat-dev`: Development branch (contains sensitive data - avoid using)
- Feature branches: Create from `clean-main`

### Creating a Feature Branch
```bash
git checkout clean-main
git pull origin clean-main
git checkout -b feature/your-feature-name
```

### Making Changes
1. Make your changes
2. Test thoroughly
3. Commit with descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add user management functionality"
   ```

### Pushing Changes
```bash
git push origin feature/your-feature-name
```

### Creating Pull Requests
1. Go to GitHub and create a PR from your feature branch to `clean-main`
2. Add description of changes
3. Request review from team members
4. Merge after approval

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
├── .gitignore              # Git ignore rules
├── README.md               # Project documentation
└── COLLABORATION.md        # This file
```

## Running the Application

### Backend
```bash
cd backend
npm start
```
Server runs on `http://localhost:5000`

### Frontend
```bash
cd frontend
npm start
```
App runs on `http://localhost:3000`

## Code Standards

### JavaScript/Node.js
- Use ES6+ features
- Follow consistent naming conventions
- Add JSDoc comments for functions
- Handle errors properly

### React
- Use functional components with hooks
- Follow React best practices
- Use proper prop types
- Keep components small and focused

### Git Commit Messages
Use conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Security Guidelines

### Never Commit
- `.env` files
- Firebase service account keys
- Database credentials
- API keys
- Private keys

### Always Use
- Environment variables for sensitive data
- Input validation
- Authentication middleware
- HTTPS in production

## Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## Deployment

### Backend Deployment
1. Set up environment variables on server
2. Install dependencies: `npm install --production`
3. Run database migrations
4. Start server: `npm start`

### Frontend Deployment
1. Build the app: `npm run build`
2. Deploy the `build` folder to your hosting service

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `npm install` in both backend and frontend directories
   - Check if you're in the correct directory

2. **Database connection issues**
   - Verify PostgreSQL is running
   - Check connection string in `.env`
   - Ensure database exists

3. **Port already in use**
   - Change port in `.env` file
   - Kill existing processes using the port

4. **Git push issues**
   - Always pull latest changes before pushing
   - Resolve conflicts before pushing
   - Use `clean-main` branch to avoid secret scanning issues

## Communication

### Team Communication
- Use GitHub Issues for bug reports
- Use GitHub Discussions for questions
- Use Pull Request comments for code reviews
- Keep commits atomic and well-documented

### Getting Help
1. Check existing issues and discussions
2. Search documentation
3. Create a new issue with detailed description
4. Tag team members for urgent issues

## Contributing Guidelines

1. **Fork the repository** (if you don't have write access)
2. **Create a feature branch** from `clean-main`
3. **Make your changes** following code standards
4. **Test your changes** thoroughly
5. **Commit with clear messages**
6. **Push to your branch**
7. **Create a Pull Request**
8. **Request review** from team members
9. **Address feedback** and make necessary changes
10. **Merge after approval**

## Branch Protection Rules

The `clean-main` branch has protection rules:
- Requires pull request reviews
- Requires status checks to pass
- No direct pushes allowed
- Must be up to date before merging

## Release Process

1. Create release branch from `clean-main`
2. Update version numbers
3. Update changelog
4. Test thoroughly
5. Create pull request to `main`
6. Merge after approval
7. Create GitHub release
8. Deploy to production

---

**Remember**: Always work on the `clean-main` branch to avoid secret scanning issues. The `rajat-dev` branch contains sensitive data and should not be used for collaboration. 