// index.js - Express server for financial operations
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const csv = require('csv-parse');
const admin = require('../firebaseAdmin');
const { requireAdmin, requireGrade, blockAdmins } = require('./middleware/auth');
const auditLogger = require('./middleware/auditLogger');
const ExportService = require('./exportService');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://finops-clean-hwqdeu3si-rajats-projects-9f45924f.vercel.app',
    'https://finops-clean-po9r-ln6yzg9ko-rajats-projects-9f45924f.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Mock database for testing
const mockUsers = [
  {
    id: 15,
    name: 'Eddie Employee',
    email: 'employee@example.com',
    is_admin: false,
    grade: 1,
    department: 'HR',
    designation: 'Employee',
    firebase_uid: 'employee123'
  },
  {
    id: 2,
    name: 'Manager User',
    email: 'manager@example.com',
    is_admin: false,
    grade: 2,
    department: 'Sales',
    designation: 'Manager',
    firebase_uid: 'manager123'
  },
  {
    id: 3,
    name: 'Finance Head',
    email: 'finance@example.com',
    is_admin: false,
    grade: 3,
    department: 'Finance',
    designation: 'Finance Head',
    firebase_uid: 'finance123'
  }
];

// PostgreSQL connection pool using env variables (with fallback)
let pool;
try {
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'finops',
  });
} catch (error) {
  console.log('Database connection failed, using mock data');
  pool = null;
}

const exportService = new ExportService();

// Helper: Authenticate JWT and check role
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('authenticateToken - authHeader:', authHeader ? 'present' : 'missing');
  console.log('authenticateToken - token length:', token ? token.length : 'undefined');
  console.log('authenticateToken - token preview:', token ? token.substring(0, 20) + '...' : 'undefined');
  
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, user) => {
    if (err) {
      console.log('authenticateToken - JWT verification failed:', err.message);
      console.log('authenticateToken - JWT error name:', err.name);
      console.log('authenticateToken - JWT error stack:', err.stack);
      return res.status(403).json({ message: 'Forbidden: ' + err.message });
    }
    
    console.log('authenticateToken - JWT verified, user:', {
      id: user.id,
      is_admin: user.is_admin,
      grade: user.grade,
      department: user.department
    });
    
    req.user = user;
    next();
  });
}

// GET /transactions
app.get('/transactions', blockAdmins, async (req, res) => {
  let result;
  if (req.user.grade === 3) {
    result = await pool.query('SELECT * FROM transactions ORDER BY timestamp DESC');
  } else if (req.user.grade === 2) {
    result = await pool.query('SELECT * FROM transactions WHERE department = $1 ORDER BY timestamp DESC', [req.user.department]);
  } else {
    result = await pool.query('SELECT * FROM transactions WHERE department = $1', [req.user.department]);
  }
  res.json(result.rows);
});

// GET /summary
app.get('/summary', authenticateToken, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('SELECT department, category, SUM(amount) as total FROM transactions GROUP BY department, category');
    } else {
      result = await pool.query('SELECT department, category, SUM(amount) as total FROM transactions WHERE department = $1 GROUP BY department, category', [req.user.department]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err); // Log error
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /audit-logs (admin only)
app.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /users (admin only)
app.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  console.log('GET /users - route handler reached');
  try {
    const result = await pool.query('SELECT id, name, email, is_admin, grade, department, employee_grade, designation FROM users ORDER BY id');
    console.log('GET /users - query successful, rows:', result.rows.length);
    // Transform the data to include 'role' field for frontend compatibility
    const users = result.rows.map(user => ({
      ...user,
      role: user.is_admin ? 'admin' : 'user'
    }));
    res.json(users);
  } catch (err) {
    console.error('GET /users - database error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /users/:id - fetch user details (self or admin)
app.get('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  // Only allow self or admin
  console.log('GET /users/:id', { param_id: id, jwt_id: req.user.id, role: req.user.role });
  if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const result = await pool.query('SELECT id, name, email, role, department, profile_picture_url, employee_grade, designation FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in GET /users/:id:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /users/:id (admin only) - update user details in both DB and Firebase
app.patch('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, is_admin, grade, department, designation } = req.body;
  if (!name || !email || !is_admin || !grade || !department) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    // Get firebase_uid
    const userRes = await pool.query('SELECT firebase_uid FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const firebase_uid = userRes.rows[0].firebase_uid;
    // Update DB
    await pool.query(
      'UPDATE users SET name = $1, email = $2, is_admin = $3, grade = $4, department = $5, designation = $6 WHERE id = $7',
      [name, email, is_admin, grade, department, designation || null, id]
    );
    // Update Firebase Auth
    if (firebase_uid) {
      await admin.auth().updateUser(firebase_uid, {
        email,
        displayName: name,
      });
      await admin.auth().setCustomUserClaims(firebase_uid, { role: is_admin ? 'admin' : 'user' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /users/:id/role (admin only) - update role in both DB and Firebase
app.patch('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    // Prevent admin from demoting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({ message: 'You cannot change your own role' });
    }
    // Get firebase_uid
    const userRes = await pool.query('SELECT firebase_uid FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const firebase_uid = userRes.rows[0].firebase_uid;
    await pool.query('UPDATE users SET is_admin = $1 WHERE id = $2', [role === 'admin', id]);
    if (firebase_uid) {
      await admin.auth().setCustomUserClaims(firebase_uid, { role });
    }
    res.json({ message: 'Role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /users (admin only)
app.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  const { name, email, password, is_admin, grade, department, designation } = req.body;
  const ALLOWED_DEPARTMENTS = ['Finance', 'HR', 'Digital Transformation', 'Planning', 'Data&AI'];
  const ALLOWED_ROLES = ['user', 'admin'];
  if (!name || !email || !password || !is_admin || !grade || !department) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!ALLOWED_DEPARTMENTS.includes(department)) {
    return res.status(400).json({ message: 'Invalid department' });
  }
  if (!ALLOWED_ROLES.includes(is_admin ? 'admin' : 'user')) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    // Create user in Firebase Auth
    let fbUser;
    try {
      fbUser = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });
      // Set custom claims for role
      await admin.auth().setCustomUserClaims(fbUser.uid, { role: is_admin ? 'admin' : 'user' });
    } catch (fbErr) {
      return res.status(500).json({ message: 'Firebase: ' + fbErr.message });
    }
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    // Insert user in DB with firebase_uid
    await pool.query(
      'INSERT INTO users (name, email, is_admin, grade, department, password, firebase_uid, designation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [name, email, is_admin, grade, department, hashed, fbUser.uid, designation || null]
    );
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /users/:id/profile-picture - update profile picture URL
app.patch('/users/:id/profile-picture', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { profile_picture_url } = req.body;
  // Only allow self or admin
  if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (!profile_picture_url) {
    return res.status(400).json({ message: 'Profile picture URL required' });
  }
  try {
    await pool.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [profile_picture_url, id]);
    res.json({ message: 'Profile picture updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set up multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.params.id}_${Date.now()}${ext}`);
  },
});
const uploadImage = multer({ storage: diskStorage });
const uploadCSV = multer({ storage: multer.memoryStorage() });

// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// POST /users/:id/profile-picture/upload - upload profile picture file
app.post('/users/:id/profile-picture/upload', authenticateToken, (req, res, next) => {
  uploadImage.single('profile_picture')(req, res, async function (err) {
    const { id } = req.params;
    // Multer error handling
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ message: 'Multer error', error: err.message });
    }
    // Only allow self or admin
    if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    try {
      await pool.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [fileUrl, id]);
      res.json({ message: 'Profile picture uploaded', profile_picture_url: fileUrl });
    } catch (err) {
      console.error('DB update error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

// POST /users/import (admin only) - bulk import users from CSV
app.post('/users/import', authenticateToken, requireAdmin, uploadCSV.single('csv'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No CSV file uploaded or file is empty' });
  }
  const results = [];
  const errors = [];
  const ALLOWED_DEPARTMENTS = ['Finance', 'HR', 'Digital Transformation', 'Planning', 'Data&AI'];
  const parser = csv.parse({ columns: true, trim: true });
  parser.on('readable', async () => {
    let record;
    while ((record = parser.read())) {
      const { name, email, password, department, employee_grade, designation } = record;
      if (!name || !email || !password || !department) {
        errors.push({ email, error: 'Missing required fields' });
        continue;
      }
      if (!ALLOWED_DEPARTMENTS.includes(department)) {
        errors.push({ email, error: 'Invalid department' });
        continue;
      }
      try {
        // Create user in Firebase Auth
        let fbUser;
        try {
          fbUser = await admin.auth().createUser({
            email,
            password,
            displayName: name,
          });
          await admin.auth().setCustomUserClaims(fbUser.uid, { role: 'user' }); // Default to user role
        } catch (fbErr) {
          if (fbErr.code === 'auth/email-already-exists') {
            errors.push({ email, error: 'Firebase: Email already exists' });
            continue;
          } else {
            errors.push({ email, error: 'Firebase: ' + fbErr.message });
            continue;
          }
        }
        // Hash password for DB
        const hashed = await bcrypt.hash(password, 10);
        await pool.query(
          'INSERT INTO users (name, email, is_admin, grade, department, password, firebase_uid, designation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [name, email, false, employee_grade || '1', department, hashed, fbUser.uid, designation || null]
        );
        results.push({ email, status: 'Imported' });
      } catch (err) {
        errors.push({ email, error: err.message });
      }
    }
  });
  parser.on('error', err => {
    return res.status(400).json({ message: 'CSV parse error', error: err.message });
  });
  parser.on('end', () => {
    res.json({ imported: results, errors });
  });
  parser.write(req.file.buffer);
  parser.end();
});

// DELETE /users/:id (admin only) - delete user in both DB and Firebase
app.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete yourself' });
  }
  try {
    // Get firebase_uid
    const userRes = await pool.query('SELECT firebase_uid FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const firebase_uid = userRes.rows[0].firebase_uid;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (firebase_uid) {
      await admin.auth().deleteUser(firebase_uid);
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /me - fetch current user details
app.get('/me', authenticateToken, async (req, res) => {
  const id = req.user.id;
  try {
    let user;
    
    if (pool) {
      // Try database first
      try {
        const result = await pool.query('SELECT id, name, email, is_admin, grade, department, profile_picture_url, designation FROM users WHERE id = $1', [id]);
        if (result.rows.length > 0) {
          user = result.rows[0];
        }
      } catch (dbError) {
        console.log('Database lookup failed, using mock data');
      }
    }
    
    // If no user from database, use mock data
    if (!user) {
      user = mockUsers.find(u => u.id === id);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Always return grade as string (G1, G2, G3)
    if (user.grade && typeof user.grade === 'number') {
      user.grade = `G${user.grade}`;
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error in GET /me:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /login - verify Firebase Auth token and return backend JWT
app.post('/login', async (req, res) => {
  const { firebaseToken, email } = req.body;
  
  console.log('Login attempt - firebaseToken length:', firebaseToken ? firebaseToken.length : 'undefined');
  console.log('Login attempt - email:', email);
  
  if (!firebaseToken) {
    console.log('No Firebase token provided');
    return res.status(400).json({ message: 'Firebase token required' });
  }

  try {
    // For testing, skip Firebase verification and use mock data
    let user;
    
    if (pool) {
      // Try database first
      try {
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        const firebase_uid = decodedToken.uid;
        console.log('Firebase token verified, UID:', firebase_uid);
        
        const result = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
        user = result.rows[0];
        console.log('Database lookup result:', user ? 'User found' : 'User not found');
      } catch (dbError) {
        console.log('Database lookup failed, using mock data. Error:', dbError.message);
      }
    }
    
    // If no user from database, use mock data
    if (!user && email) {
      console.log('Trying mock user lookup for email:', email);
      user = mockUsers.find(u => u.email === email);
      console.log('Mock user lookup result:', user ? 'User found' : 'User not found');
      if (user) {
        console.log('Mock user details:', { id: user.id, name: user.name, email: user.email, grade: user.grade });
      }
    }
    
    // Additional fallback: if Firebase auth succeeded but user not in DB, create a mock user
    if (!user && email && firebaseToken) {
      console.log('Firebase auth succeeded but user not in DB, creating mock user for:', email);
      // Create a mock user with a generated ID
      const mockUser = {
        id: Date.now(), // Generate a unique ID
        name: email.split('@')[0], // Use email prefix as name
        email: email,
        is_admin: false,
        grade: 1, // Default to G1
        department: 'General',
        designation: 'Employee',
        firebase_uid: 'mock_' + Date.now()
      };
      user = mockUser;
      console.log('Created mock user:', mockUser);
    }
    
    if (!user) {
      console.log('User not found for email:', email);
      console.log('Available mock users:', mockUsers.map(u => u.email));
      return res.status(401).json({ message: 'User not found in database' });
    }
    
    console.log('User found:', user.email);
    
    // Generate backend JWT token
    const token = jwt.sign(
      { id: user.id, is_admin: user.is_admin, grade: user.grade, department: user.department },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '1h' }
    );
    
    console.log('Login successful for user:', user.email);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        is_admin: user.is_admin, 
        grade: `G${user.grade}`, 
        department: user.department,
        designation: user.designation
      } 
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(401).json({ message: 'Invalid Firebase token' });
  }
});

// Budget API endpoints
app.get('/budget', authenticateToken, async (req, res) => {
  try {
    const { scope } = req.query;
    const userId = req.user.id;
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;

    // Mock budget data for testing
    const mockBudgetData = {
      self: {
        budget: 50000,
        spent: 32000,
        remaining: 18000
      },
      department: {
        budget: 150000,
        spent: 95000,
        remaining: 55000,
        departments: [
          { name: 'Sales', budget: 80000, spent: 50000 },
          { name: 'Marketing', budget: 70000, spent: 45000 }
        ]
      },
      all: {
        budget: 500000,
        spent: 320000,
        remaining: 180000,
        departments: [
          { name: 'Sales', budget: 120000, spent: 75000 },
          { name: 'Marketing', budget: 80000, spent: 52000 },
          { name: 'Engineering', budget: 150000, spent: 95000 },
          { name: 'Finance', budget: 100000, spent: 68000 },
          { name: 'HR', budget: 50000, spent: 30000 }
        ]
      }
    };

    let budgetData = {};

    if (pool) {
      // Try database first
      try {
        if (scope === 'self' && userGrade === 'G1') {
          // G1 users see their team's budget (read-only)
          const [rows] = await pool.execute(`
            SELECT 
              COALESCE(SUM(budget_amount), 0) as budget,
              COALESCE(SUM(spent_amount), 0) as spent
            FROM team_budgets 
            WHERE team_id = (SELECT team_id FROM users WHERE id = ?)
          `, [userId]);
          
          budgetData = {
            budget: rows[0]?.budget || 0,
            spent: rows[0]?.spent || 0,
            remaining: (rows[0]?.budget || 0) - (rows[0]?.spent || 0)
          };
        } else if (scope === 'department' && userGrade === 'G2') {
          // G2 users see their department's budget
          const [rows] = await pool.execute(`
            SELECT 
              COALESCE(SUM(budget_amount), 0) as budget,
              COALESCE(SUM(spent_amount), 0) as spent
            FROM department_budgets 
            WHERE department = ?
          `, [userDepartment]);
          
          budgetData = {
            budget: rows[0]?.budget || 0,
            spent: rows[0]?.spent || 0,
            remaining: (rows[0]?.budget || 0) - (rows[0]?.spent || 0)
          };
        } else if (scope === 'all' && userGrade === 'G3') {
          // G3 users see all departments
          const [rows] = await pool.execute(`
            SELECT 
              department,
              COALESCE(SUM(budget_amount), 0) as budget,
              COALESCE(SUM(spent_amount), 0) as spent
            FROM department_budgets 
            GROUP BY department
          `);
          
          const totalBudget = rows.reduce((sum, dept) => sum + dept.budget, 0);
          const totalSpent = rows.reduce((sum, dept) => sum + dept.spent, 0);
          
          budgetData = {
            budget: totalBudget,
            spent: totalSpent,
            remaining: totalBudget - totalSpent,
            departments: rows.map(dept => ({
              name: dept.department,
              budget: dept.budget,
              spent: dept.spent
            }))
          };
        }
      } catch (dbError) {
        console.log('Database budget lookup failed, using mock data');
      }
    }
    
    // If no data from database, use mock data
    if (!budgetData || Object.keys(budgetData).length === 0) {
      budgetData = mockBudgetData[scope] || mockBudgetData.self;
    }

    res.json(budgetData);
  } catch (error) {
    console.error('Budget API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Commission API endpoints
app.get('/commission', authenticateToken, async (req, res) => {
  try {
    const { scope, range } = req.query;
    const userId = req.user.id;
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;

    // Mock commission data for testing
    const mockCommissionData = {
      self: {
        totalRevenue: 45000,
        totalCommission: 4500,
        avgCommissionRate: 10.0,
        monthlyData: [
          { month: '2024-01', revenue: 8000, commission: 800 },
          { month: '2024-02', revenue: 12000, commission: 1200 },
          { month: '2024-03', revenue: 15000, commission: 1500 },
          { month: '2024-04', revenue: 10000, commission: 1000 }
        ]
      },
      team: {
        totalRevenue: 125000,
        totalCommission: 12500,
        avgCommissionRate: 10.0,
        monthlyData: [
          { month: '2024-01', revenue: 25000, commission: 2500 },
          { month: '2024-02', revenue: 30000, commission: 3000 },
          { month: '2024-03', revenue: 35000, commission: 3500 },
          { month: '2024-04', revenue: 35000, commission: 3500 }
        ]
      },
      all: {
        totalRevenue: 350000,
        totalCommission: 35000,
        avgCommissionRate: 10.0,
        monthlyData: [
          { month: '2024-01', revenue: 80000, commission: 8000 },
          { month: '2024-02', revenue: 90000, commission: 9000 },
          { month: '2024-03', revenue: 95000, commission: 9500 },
          { month: '2024-04', revenue: 85000, commission: 8500 }
        ],
        topPerformers: [
          { name: 'John Smith', commission: 8500 },
          { name: 'Sarah Johnson', commission: 7200 },
          { name: 'Mike Davis', commission: 6800 },
          { name: 'Lisa Wilson', commission: 6200 },
          { name: 'Tom Brown', commission: 5300 }
        ]
      }
    };

    let commissionData = {};

    if (pool) {
      // Try database first
      try {
        let months = 6; // default
        if (range === '3months') months = 3;
        else if (range === '1year') months = 12;

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        if (scope === 'self' && userGrade === 'G1') {
          // Personal commission data
          const [rows] = await pool.execute(`
            SELECT 
              DATE_FORMAT(created_at, '%Y-%m') as month,
              COALESCE(SUM(amount), 0) as revenue,
              COALESCE(SUM(commission_amount), 0) as commission
            FROM invoices 
            WHERE user_id = ? AND created_at >= ?
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month
          `, [userId, startDate]);

          const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
          const totalCommission = rows.reduce((sum, row) => sum + row.commission, 0);

          commissionData = {
            totalRevenue,
            totalCommission,
            avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
            monthlyData: rows
          };
        } else if (scope === 'team' && userGrade === 'G2') {
          // Department commission data
          const [rows] = await pool.execute(`
            SELECT 
              DATE_FORMAT(i.created_at, '%Y-%m') as month,
              COALESCE(SUM(i.amount), 0) as revenue,
              COALESCE(SUM(i.commission_amount), 0) as commission
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            WHERE u.department = ? AND i.created_at >= ?
            GROUP BY DATE_FORMAT(i.created_at, '%Y-%m')
            ORDER BY month
          `, [userDepartment, startDate]);

          const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
          const totalCommission = rows.reduce((sum, row) => sum + row.commission, 0);

          commissionData = {
            totalRevenue,
            totalCommission,
            avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
            monthlyData: rows
          };
        } else if (scope === 'all' && userGrade === 'G3') {
          // Company-wide commission data
          const [rows] = await pool.execute(`
            SELECT 
              DATE_FORMAT(created_at, '%Y-%m') as month,
              COALESCE(SUM(amount), 0) as revenue,
              COALESCE(SUM(commission_amount), 0) as commission
            FROM invoices 
            WHERE created_at >= ?
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month
          `, [startDate]);

          const [topPerformers] = await pool.execute(`
            SELECT 
              u.name,
              COALESCE(SUM(i.commission_amount), 0) as commission
            FROM users u
            LEFT JOIN invoices i ON u.id = i.user_id AND i.created_at >= ?
            WHERE u.grade IN ('G1', 'G2')
            GROUP BY u.id, u.name
            ORDER BY commission DESC
            LIMIT 5
          `, [startDate]);

          const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
          const totalCommission = rows.reduce((sum, row) => sum + row.commission, 0);

          commissionData = {
            totalRevenue,
            totalCommission,
            avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
            monthlyData: rows,
            topPerformers
          };
        }
      } catch (dbError) {
        console.log('Database commission lookup failed, using mock data');
      }
    }
    
    // If no data from database, use mock data
    if (!commissionData || Object.keys(commissionData).length === 0) {
      commissionData = mockCommissionData[scope] || mockCommissionData.self;
    }

    res.json(commissionData);
  } catch (error) {
    console.error('Commission API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /projects - fetch projects based on user role
app.get('/projects', authenticateToken, async (req, res) => {
  try {
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;

    // Mock project data for testing
    const mockProjects = [
      {
        id: 1,
        name: 'Website Redesign',
        description: 'Complete redesign of company website with modern UI/UX',
        budget_amount: 25000,
        spent_amount: 18000,
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        status: 'active',
        department: 'Marketing',
        manager_name: 'Sarah Johnson'
      },
      {
        id: 2,
        name: 'Sales CRM Implementation',
        description: 'Implement new CRM system for sales team with advanced analytics',
        budget_amount: 50000,
        spent_amount: 35000,
        start_date: '2024-02-01',
        end_date: '2024-05-31',
        status: 'active',
        department: 'Sales',
        manager_name: 'John Smith'
      },
      {
        id: 3,
        name: 'Mobile App Development',
        description: 'Develop mobile app for customer engagement and loyalty',
        budget_amount: 75000,
        spent_amount: 60000,
        start_date: '2024-01-15',
        end_date: '2024-06-30',
        status: 'active',
        department: 'Engineering',
        manager_name: 'Mike Davis'
      },
      {
        id: 4,
        name: 'Data Analytics Platform',
        description: 'Build comprehensive analytics platform for business intelligence',
        budget_amount: 100000,
        spent_amount: 85000,
        start_date: '2024-03-01',
        end_date: '2024-08-31',
        status: 'on-hold',
        department: 'Engineering',
        manager_name: 'Lisa Wilson'
      },
      {
        id: 5,
        name: 'Marketing Campaign Q2',
        description: 'Execute comprehensive marketing campaign for Q2 product launch',
        budget_amount: 30000,
        spent_amount: 22000,
        start_date: '2024-04-01',
        end_date: '2024-06-30',
        status: 'active',
        department: 'Marketing',
        manager_name: 'Sarah Johnson'
      },
      {
        id: 6,
        name: 'Employee Training Program',
        description: 'Develop and implement comprehensive employee training program',
        budget_amount: 15000,
        spent_amount: 15000,
        start_date: '2024-01-01',
        end_date: '2024-02-28',
        status: 'completed',
        department: 'HR',
        manager_name: 'Tom Brown'
      },
      {
        id: 7,
        name: 'Cloud Migration',
        description: 'Migrate all systems to cloud infrastructure for scalability',
        budget_amount: 120000,
        spent_amount: 95000,
        start_date: '2024-02-15',
        end_date: '2024-07-31',
        status: 'active',
        department: 'Engineering',
        manager_name: 'Mike Davis'
      },
      {
        id: 8,
        name: 'Customer Support Portal',
        description: 'Build self-service portal for customer support and FAQs',
        budget_amount: 40000,
        spent_amount: 28000,
        start_date: '2024-03-15',
        end_date: '2024-05-31',
        status: 'active',
        department: 'Engineering',
        manager_name: 'Lisa Wilson'
      }
    ];

    let projects = [];

    if (pool) {
      // Try database first
      try {
        if (userGrade === 'G3') {
          // G3 users see all projects
          const [rows] = await pool.execute(`
            SELECT 
              p.id,
              p.name,
              p.description,
              p.budget_amount,
              p.spent_amount,
              p.start_date,
              p.end_date,
              p.status,
              p.department,
              u.name as manager_name
            FROM projects p
            JOIN users u ON p.manager_id = u.id
            ORDER BY p.created_at DESC
          `);
          projects = rows;
        } else if (userGrade === 'G2') {
          // G2 users see their department's projects
          const [rows] = await pool.execute(`
            SELECT 
              p.id,
              p.name,
              p.description,
              p.budget_amount,
              p.spent_amount,
              p.start_date,
              p.end_date,
              p.status,
              p.department,
              u.name as manager_name
            FROM projects p
            JOIN users u ON p.manager_id = u.id
            WHERE p.department = ?
            ORDER BY p.created_at DESC
          `, [userDepartment]);
          projects = rows;
        } else {
          // G1 users see no projects (read-only access)
          projects = [];
        }
      } catch (dbError) {
        console.log('Database project lookup failed, using mock data');
      }
    }
    
    // If no data from database, use mock data
    if (!projects || projects.length === 0) {
      if (userGrade === 'G3') {
        projects = mockProjects;
      } else if (userGrade === 'G2') {
        projects = mockProjects.filter(p => p.department === userDepartment);
      } else {
        projects = [];
      }
    }

    res.json(projects);
  } catch (error) {
    console.error('Projects API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/projects', authenticateToken, async (req, res) => {
  try {
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;
    const { name, description, budget, startDate, endDate, status } = req.body;

    // Handle both string grades (G2) and numeric grades (2)
    const isG2User = userGrade === 'G2' || userGrade === 2 || userGrade === '2';
    
    if (!isG2User) {
      console.log('Project creation denied - user grade:', userGrade, 'type:', typeof userGrade);
      return res.status(403).json({ message: 'Only G2 users can create projects' });
    }

    // Mock project creation for testing
    const newProject = {
      id: Date.now(),
      name,
      description,
      budget_amount: parseFloat(budget),
      spent_amount: 0,
      start_date: startDate,
      end_date: endDate,
      status: status || 'active',
      department: userDepartment,
      manager_name: req.user.name,
      created_at: new Date().toISOString()
    };

    res.status(201).json({ 
      message: 'Project created successfully',
      project: newProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.patch('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;
    const updates = req.body;

    // Handle both string grades (G2) and numeric grades (2)
    const isG2User = userGrade === 'G2' || userGrade === 2 || userGrade === '2';
    
    if (!isG2User) {
      console.log('Project update denied - user grade:', userGrade, 'type:', typeof userGrade);
      return res.status(403).json({ message: 'Only G2 users can update projects' });
    }

    // Verify project belongs to user's department
    const [project] = await pool.execute(`
      SELECT department FROM projects WHERE id = ?
    `, [id]);

    if (!project.length || project[0].department !== userDepartment) {
      return res.status(403).json({ message: 'Project not found or access denied' });
    }

    const updateFields = [];
    const updateValues = [];

    if (updates.spent !== undefined) {
      updateFields.push('spent_amount = ?');
      updateValues.push(updates.spent);
    }

    if (updates.status) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateValues.push(id);

    await pool.execute(`
      UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues);

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /invoices - fetch invoices based on user role
app.get('/invoices', authenticateToken, async (req, res) => {
  try {
    const { scope, status, department, dateFrom, dateTo } = req.query;
    const userId = req.user.id;
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;

    // Mock invoice data for testing
    const mockInvoices = {
      self: [
        {
          id: 1,
          invoice_number: 'INV-001',
          client_name: 'ABC Corp',
          amount: 5000,
          commission_amount: 500,
          status: 'approved',
          created_at: '2024-01-15',
          due_date: '2024-02-15',
          description: 'Website development services',
          category: 'software'
        },
        {
          id: 2,
          invoice_number: 'INV-002',
          client_name: 'XYZ Ltd',
          amount: 8000,
          commission_amount: 800,
          status: 'pending',
          created_at: '2024-01-20',
          due_date: '2024-02-20',
          description: 'Marketing campaign design',
          category: 'marketing'
        },
        {
          id: 3,
          invoice_number: 'INV-003',
          client_name: 'DEF Inc',
          amount: 12000,
          commission_amount: 1200,
          status: 'approved',
          created_at: '2024-01-25',
          due_date: '2024-02-25',
          description: 'Consulting services for Q1',
          category: 'consulting'
        },
        {
          id: 4,
          invoice_number: 'INV-004',
          client_name: 'GHI Solutions',
          amount: 3500,
          commission_amount: 350,
          status: 'rejected',
          created_at: '2024-02-01',
          due_date: '2024-03-01',
          description: 'Office supplies and equipment',
          category: 'office'
        },
        {
          id: 5,
          invoice_number: 'INV-005',
          client_name: 'JKL Enterprises',
          amount: 9500,
          commission_amount: 950,
          status: 'pending',
          created_at: '2024-02-05',
          due_date: '2024-03-05',
          description: 'Training program development',
          category: 'training'
        }
      ],
      department: [
        {
          id: 1,
          invoice_number: 'INV-001',
          client_name: 'ABC Corp',
          amount: 5000,
          commission_amount: 500,
          status: 'approved',
          created_at: '2024-01-15',
          due_date: '2024-02-15',
          user_name: 'John Smith',
          description: 'Website development services',
          category: 'software'
        },
        {
          id: 2,
          invoice_number: 'INV-002',
          client_name: 'XYZ Ltd',
          amount: 8000,
          commission_amount: 800,
          status: 'pending',
          created_at: '2024-01-20',
          due_date: '2024-02-20',
          user_name: 'Sarah Johnson',
          description: 'Marketing campaign design',
          category: 'marketing'
        },
        {
          id: 3,
          invoice_number: 'INV-003',
          client_name: 'DEF Inc',
          amount: 12000,
          commission_amount: 1200,
          status: 'approved',
          created_at: '2024-01-25',
          due_date: '2024-02-25',
          user_name: 'Mike Davis',
          description: 'Consulting services for Q1',
          category: 'consulting'
        },
        {
          id: 4,
          invoice_number: 'INV-004',
          client_name: 'GHI Solutions',
          amount: 3500,
          commission_amount: 350,
          status: 'rejected',
          created_at: '2024-02-01',
          due_date: '2024-03-01',
          user_name: 'Lisa Wilson',
          description: 'Office supplies and equipment',
          category: 'office'
        },
        {
          id: 5,
          invoice_number: 'INV-005',
          client_name: 'JKL Enterprises',
          amount: 9500,
          commission_amount: 950,
          status: 'pending',
          created_at: '2024-02-05',
          due_date: '2024-03-05',
          user_name: 'Tom Brown',
          description: 'Training program development',
          category: 'training'
        },
        {
          id: 6,
          invoice_number: 'INV-006',
          client_name: 'MNO Industries',
          amount: 15000,
          commission_amount: 1500,
          status: 'approved',
          created_at: '2024-02-10',
          due_date: '2024-03-10',
          user_name: 'Emma Wilson',
          description: 'Software licensing and support',
          category: 'software'
        },
        {
          id: 7,
          invoice_number: 'INV-007',
          client_name: 'PQR Systems',
          amount: 6500,
          commission_amount: 650,
          status: 'pending',
          created_at: '2024-02-12',
          due_date: '2024-03-12',
          user_name: 'David Lee',
          description: 'Travel expenses for client meeting',
          category: 'travel'
        }
      ],
      all: [
        {
          id: 1,
          invoice_number: 'INV-001',
          client_name: 'ABC Corp',
          amount: 5000,
          commission_amount: 500,
          status: 'approved',
          created_at: '2024-01-15',
          due_date: '2024-02-15',
          user_name: 'John Smith',
          department: 'Sales',
          description: 'Website development services',
          category: 'software'
        },
        {
          id: 2,
          invoice_number: 'INV-002',
          client_name: 'XYZ Ltd',
          amount: 8000,
          commission_amount: 800,
          status: 'pending',
          created_at: '2024-01-20',
          due_date: '2024-02-20',
          user_name: 'Sarah Johnson',
          department: 'Marketing',
          description: 'Marketing campaign design',
          category: 'marketing'
        },
        {
          id: 3,
          invoice_number: 'INV-003',
          client_name: 'DEF Inc',
          amount: 12000,
          commission_amount: 1200,
          status: 'approved',
          created_at: '2024-01-25',
          due_date: '2024-02-25',
          user_name: 'Mike Davis',
          department: 'Sales',
          description: 'Consulting services for Q1',
          category: 'consulting'
        },
        {
          id: 4,
          invoice_number: 'INV-004',
          client_name: 'GHI Solutions',
          amount: 3500,
          commission_amount: 350,
          status: 'rejected',
          created_at: '2024-02-01',
          due_date: '2024-03-01',
          user_name: 'Lisa Wilson',
          department: 'Engineering',
          description: 'Office supplies and equipment',
          category: 'office'
        },
        {
          id: 5,
          invoice_number: 'INV-005',
          client_name: 'JKL Enterprises',
          amount: 9500,
          commission_amount: 950,
          status: 'pending',
          created_at: '2024-02-05',
          due_date: '2024-03-05',
          user_name: 'Tom Brown',
          department: 'HR',
          description: 'Training program development',
          category: 'training'
        },
        {
          id: 6,
          invoice_number: 'INV-006',
          client_name: 'MNO Industries',
          amount: 15000,
          commission_amount: 1500,
          status: 'approved',
          created_at: '2024-02-10',
          due_date: '2024-03-10',
          user_name: 'Emma Wilson',
          department: 'Sales',
          description: 'Software licensing and support',
          category: 'software'
        },
        {
          id: 7,
          invoice_number: 'INV-007',
          client_name: 'PQR Systems',
          amount: 6500,
          commission_amount: 650,
          status: 'pending',
          created_at: '2024-02-12',
          due_date: '2024-03-12',
          user_name: 'David Lee',
          department: 'Marketing',
          description: 'Travel expenses for client meeting',
          category: 'travel'
        },
        {
          id: 8,
          invoice_number: 'INV-008',
          client_name: 'STU Technologies',
          amount: 22000,
          commission_amount: 2200,
          status: 'approved',
          created_at: '2024-02-15',
          due_date: '2024-03-15',
          user_name: 'Alex Chen',
          department: 'Engineering',
          description: 'Cloud infrastructure setup',
          category: 'software'
        }
      ]
    };

    let invoices = [];

    if (pool) {
      // Try database first
      try {
        let query = '';
        let params = [];

        if (scope === 'self' && userGrade === 'G1') {
          query = 'SELECT * FROM invoices WHERE user_id = ?';
          params = [userId];
        } else if (scope === 'department' && userGrade === 'G2') {
          query = `
            SELECT i.*, u.name as user_name 
            FROM invoices i 
            JOIN users u ON i.user_id = u.id 
            WHERE u.department = ?
          `;
          params = [userDepartment];
        } else if (scope === 'all' && userGrade === 'G3') {
          query = `
            SELECT i.*, u.name as user_name, u.department 
            FROM invoices i 
            JOIN users u ON i.user_id = u.id
          `;
        }

        // Add filters
        if (status) {
          query += query.includes('WHERE') ? ' AND' : ' WHERE';
          query += ' i.status = ?';
          params.push(status);
        }

        if (department && scope === 'all') {
          query += query.includes('WHERE') ? ' AND' : ' WHERE';
          query += ' u.department = ?';
          params.push(department);
        }

        if (dateFrom) {
          query += query.includes('WHERE') ? ' AND' : ' WHERE';
          query += ' i.created_at >= ?';
          params.push(dateFrom);
        }

        if (dateTo) {
          query += query.includes('WHERE') ? ' AND' : ' WHERE';
          query += ' i.created_at <= ?';
          params.push(dateTo);
        }

        query += ' ORDER BY i.created_at DESC';

        const [rows] = await pool.execute(query, params);
        invoices = rows;
      } catch (dbError) {
        console.log('Database invoice lookup failed, using mock data');
      }
    }
    
    // If no data from database, use mock data
    if (!invoices || invoices.length === 0) {
      invoices = mockInvoices[scope] || mockInvoices.self;
    }

    res.json(invoices);
  } catch (error) {
    console.error('Invoices API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/invoices', authenticateToken, async (req, res) => {
  try {
    const { amount, description, commission_rate, category, department, date } = req.body;
    const userId = req.user.id;
    const userGrade = req.user.grade;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Calculate commission amount
    const commissionAmount = amount * (commission_rate / 100);

    // Mock invoice creation for testing
    const newInvoice = {
      id: Date.now(),
      invoice_number: invoiceNumber,
      amount: parseFloat(amount),
      commission_amount: commissionAmount,
      commission_rate: parseFloat(commission_rate),
      status: 'pending',
      description,
      category,
      department: department || req.user.department,
      user_name: req.user.name,
      created_at: date || new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    res.status(201).json({ 
      message: 'Invoice created successfully',
      invoice: newInvoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.patch('/invoices/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userGrade = req.user.grade;

    if (userGrade !== 'G3') {
      return res.status(403).json({ message: 'Only G3 users can approve/reject invoices' });
    }

    await pool.execute(`
      UPDATE invoices SET status = ? WHERE id = ?
    `, [status, id]);

    res.json({ message: 'Invoice status updated successfully' });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /kpi - fetch KPI data
app.get('/kpi', authenticateToken, async (req, res) => {
  try {
    const { scope } = req.query;
    const userId = req.user.id;
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;

    // Mock KPI data for testing
    const mockKPIData = {
      self: {
        totalInvoices: 15,
        totalAmount: 45000,
        totalCommission: 4500,
        pendingInvoices: 3
      },
      department: {
        totalInvoices: 45,
        totalAmount: 125000,
        totalCommission: 12500,
        pendingInvoices: 8
      },
      all: {
        totalInvoices: 120,
        totalAmount: 350000,
        totalCommission: 35000,
        totalUsers: 25
      }
    };

    let kpiData = {};

    if (pool) {
      // Try database first
      try {
        if (scope === 'self' && userGrade === 'G1') {
          const [rows] = await pool.execute(`
            SELECT 
              COUNT(*) as totalInvoices,
              COALESCE(SUM(amount), 0) as totalAmount,
              COALESCE(SUM(commission_amount), 0) as totalCommission
            FROM invoices 
            WHERE user_id = ?
          `, [userId]);
          
          const [pendingRows] = await pool.execute(`
            SELECT COUNT(*) as pendingInvoices
            FROM invoices 
            WHERE user_id = ? AND status = 'pending'
          `, [userId]);
          
          kpiData = {
            totalInvoices: rows[0]?.totalInvoices || 0,
            totalAmount: rows[0]?.totalAmount || 0,
            totalCommission: rows[0]?.totalCommission || 0,
            pendingInvoices: pendingRows[0]?.pendingInvoices || 0
          };
        } else if (scope === 'department' && userGrade === 'G2') {
          const [rows] = await pool.execute(`
            SELECT 
              COUNT(*) as totalInvoices,
              COALESCE(SUM(amount), 0) as totalAmount,
              COALESCE(SUM(commission_amount), 0) as totalCommission
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            WHERE u.department = ?
          `, [userDepartment]);
          
          const [pendingRows] = await pool.execute(`
            SELECT COUNT(*) as pendingInvoices
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            WHERE u.department = ? AND i.status = 'pending'
          `, [userDepartment]);
          
          kpiData = {
            totalInvoices: rows[0]?.totalInvoices || 0,
            totalAmount: rows[0]?.totalAmount || 0,
            totalCommission: rows[0]?.totalCommission || 0,
            pendingInvoices: pendingRows[0]?.pendingInvoices || 0
          };
        } else if (scope === 'all' && userGrade === 'G3') {
          const [rows] = await pool.execute(`
            SELECT 
              COUNT(*) as totalInvoices,
              COALESCE(SUM(amount), 0) as totalAmount,
              COALESCE(SUM(commission_amount), 0) as totalCommission
            FROM invoices
          `);
          
          const [userRows] = await pool.execute(`
            SELECT COUNT(*) as totalUsers
            FROM users
            WHERE is_admin = 0
          `);
          
          kpiData = {
            totalInvoices: rows[0]?.totalInvoices || 0,
            totalAmount: rows[0]?.totalAmount || 0,
            totalCommission: rows[0]?.totalCommission || 0,
            totalUsers: userRows[0]?.totalUsers || 0
          };
        }
      } catch (dbError) {
        console.log('Database KPI lookup failed, using mock data');
      }
    }
    
    // If no data from database, use mock data
    if (!kpiData || Object.keys(kpiData).length === 0) {
      kpiData = mockKPIData[scope] || mockKPIData.self;
    }

    res.json(kpiData);
  } catch (error) {
    console.error('KPI API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export API endpoints
app.get('/export/invoices/:format', authenticateToken, async (req, res) => {
  try {
    const { format } = req.params;
    const { scope, status, department } = req.query;
    const userId = req.user.id;
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;

    // Fetch invoices based on scope
    let query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.amount,
        i.commission_amount,
        i.commission_rate,
        i.status,
        i.created_at,
        i.description,
        u.name as user_name,
        u.department
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (scope === 'self' && userGrade === 'G1') {
      query += ' AND i.user_id = ?';
      params.push(userId);
    } else if (scope === 'department' && userGrade === 'G2') {
      query += ' AND u.department = ?';
      params.push(userDepartment);
    } else if (scope === 'all' && userGrade === 'G3') {
      // G3 can see all invoices
    } else {
      return res.status(403).json({ message: 'Access denied for this scope' });
    }

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    if (department && userGrade === 'G3') {
      query += ' AND u.department = ?';
      params.push(department);
    }

    query += ' ORDER BY i.created_at DESC';

    const [invoices] = await pool.execute(query, params);

    if (format === 'pdf') {
      const pdf = exportService.generateInvoicePDF(invoices, req.user);
      const filename = `invoices_${scope}_${Date.now()}.pdf`;
      const filePath = exportService.savePDF(pdf, filename);
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading file' });
        }
        // Clean up file after download
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    } else if (format === 'excel') {
      const workbook = exportService.generateInvoiceExcel(invoices, req.user);
      const filename = `invoices_${scope}_${Date.now()}.xlsx`;
      const filePath = exportService.saveExcel(workbook, filename);
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading file' });
        }
        // Clean up file after download
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    } else if (format === 'csv') {
      console.log('Invoice CSV export requested for scope:', scope);
      console.log('Number of invoices:', invoices.length);
      const csvContent = exportService.generateInvoiceCSV(invoices, req.user);
      console.log('CSV content generated, length:', csvContent.length);
      const filename = `invoices_${scope}_${Date.now()}.csv`;
      console.log('Saving CSV to:', filename);
      const filePath = exportService.saveCSV(csvContent, filename);
      console.log('CSV saved successfully to:', filePath);
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading file' });
        }
        // Clean up file after download
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    } else {
      res.status(400).json({ message: 'Invalid format. Use pdf, excel, or csv' });
    }
  } catch (error) {
    console.error('Export invoices error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/export/budget/:format', authenticateToken, async (req, res) => {
  try {
    const { format } = req.params;
    let { scope } = req.query;
    // Normalize scope to allow department:1, self:2, etc.
    scope = (scope || '').split(':')[0];
    const userId = req.user.id;
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;

    let budgetData = {};

    // Mock budget data for testing when database is unavailable or access is denied
    const mockBudgetData = {
      self: {
        budget: 50000,
        spent: 32000,
        remaining: 18000
      },
      department: {
        budget: 150000,
        spent: 95000,
        remaining: 55000,
        departments: [
          { name: 'Sales', budget: 80000, spent: 50000 },
          { name: 'Marketing', budget: 70000, spent: 45000 }
        ]
      },
      all: {
        budget: 500000,
        spent: 320000,
        remaining: 180000,
        departments: [
          { name: 'Sales', budget: 120000, spent: 75000 },
          { name: 'Marketing', budget: 80000, spent: 52000 },
          { name: 'Engineering', budget: 150000, spent: 95000 },
          { name: 'Finance', budget: 100000, spent: 68000 },
          { name: 'HR', budget: 50000, spent: 30000 }
        ]
      }
    };

    // Try to get data from database if available
    if (pool) {
      try {
        if (scope === 'self' && userGrade === 'G1') {
          const [rows] = await pool.execute(`
            SELECT 
              COALESCE(SUM(budget_amount), 0) as budget,
              COALESCE(SUM(spent_amount), 0) as spent
            FROM team_budgets 
            WHERE team_id = (SELECT team_id FROM users WHERE id = ?)
          `, [userId]);
          
          budgetData = {
            budget: rows[0]?.budget || 0,
            spent: rows[0]?.spent || 0,
            remaining: (rows[0]?.budget || 0) - (rows[0]?.spent || 0)
          };
        } else if (scope === 'department' && userGrade === 'G2') {
          const [rows] = await pool.execute(`
            SELECT 
              COALESCE(SUM(budget_amount), 0) as budget,
              COALESCE(SUM(spent_amount), 0) as spent
            FROM department_budgets 
            WHERE department = ?
          `, [userDepartment]);
          
          budgetData = {
            budget: rows[0]?.budget || 0,
            spent: rows[0]?.spent || 0,
            remaining: (rows[0]?.budget || 0) - (rows[0]?.spent || 0)
          };
        } else if (scope === 'all' && userGrade === 'G3') {
          const [rows] = await pool.execute(`
            SELECT 
              department,
              COALESCE(SUM(budget_amount), 0) as budget,
              COALESCE(SUM(spent_amount), 0) as spent
            FROM department_budgets 
            GROUP BY department
          `);
          
          const totalBudget = rows.reduce((sum, dept) => sum + dept.budget, 0);
          const totalSpent = rows.reduce((sum, dept) => sum + dept.spent, 0);
          
          budgetData = {
            budget: totalBudget,
            spent: totalSpent,
            remaining: totalBudget - totalSpent,
            departments: rows.map(dept => ({
              name: dept.department,
              budget: dept.budget,
              spent: dept.spent
            }))
          };
        }
      } catch (dbError) {
        console.log('Database budget export failed, using mock data');
      }
    }
    
    // If no data from database, use mock data based on scope
    if (!budgetData || Object.keys(budgetData).length === 0) {
      budgetData = mockBudgetData[scope] || mockBudgetData.self;
    }

    if (format === 'pdf') {
      try {
        console.log('Generating PDF for budget data:', budgetData);
        const pdf = exportService.generateBudgetPDF(budgetData, scope);
        const filename = `budget_${scope}_${Date.now()}.pdf`;
        console.log('Saving PDF to:', filename);
        const filePath = exportService.savePDF(pdf, filename);
        console.log('PDF saved successfully to:', filePath);
        
        res.download(filePath, filename, (err) => {
          if (err) {
            console.error('Download error:', err);
            res.status(500).json({ message: 'Error downloading file' });
          }
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting file:', unlinkErr);
          });
        });
      } catch (pdfError) {
        console.error('PDF generation/save error:', pdfError);
        res.status(500).json({ message: 'Error generating PDF: ' + pdfError.message });
      }
    } else if (format === 'excel') {
      const workbook = exportService.generateBudgetExcel(budgetData, scope);
      const filename = `budget_${scope}_${Date.now()}.xlsx`;
      const filePath = exportService.saveExcel(workbook, filename);
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading file' });
        }
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    } else if (format === 'csv') {
      const csvContent = exportService.generateBudgetCSV(budgetData, scope);
      const filename = `budget_${scope}_${Date.now()}.csv`;
      const filePath = exportService.saveCSV(csvContent, filename);
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading file' });
        }
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    } else {
      res.status(400).json({ message: 'Invalid format. Use pdf, excel, or csv' });
    }
  } catch (error) {
    console.error('Export budget error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/export/commission/:format', authenticateToken, async (req, res) => {
  try {
    const { format } = req.params;
    const { scope, range } = req.query;
    const userId = req.user.id;
    const userGrade = req.user.grade;
    const userDepartment = req.user.department;

    let months = 6;
    if (range === '3months') months = 3;
    else if (range === '1year') months = 12;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    let commissionData = {};

    if (scope === 'self' && userGrade === 'G1') {
      const [rows] = await pool.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COALESCE(SUM(amount), 0) as revenue,
          COALESCE(SUM(commission_amount), 0) as commission
        FROM invoices 
        WHERE user_id = ? AND created_at >= ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `, [userId, startDate]);

      const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
      const totalCommission = rows.reduce((sum, row) => sum + row.commission, 0);

      commissionData = {
        totalRevenue,
        totalCommission,
        avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
        monthlyData: rows
      };
    } else if (scope === 'team' && userGrade === 'G2') {
      const [rows] = await pool.execute(`
        SELECT 
          DATE_FORMAT(i.created_at, '%Y-%m') as month,
          COALESCE(SUM(i.amount), 0) as revenue,
          COALESCE(SUM(i.commission_amount), 0) as commission
        FROM invoices i
        JOIN users u ON i.user_id = u.id
        WHERE u.department = ? AND i.created_at >= ?
        GROUP BY DATE_FORMAT(i.created_at, '%Y-%m')
        ORDER BY month
      `, [userDepartment, startDate]);

      const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
      const totalCommission = rows.reduce((sum, row) => sum + row.commission, 0);

      commissionData = {
        totalRevenue,
        totalCommission,
        avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
        monthlyData: rows
      };
    } else if (scope === 'all' && userGrade === 'G3') {
      const [rows] = await pool.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COALESCE(SUM(amount), 0) as revenue,
          COALESCE(SUM(commission_amount), 0) as commission
        FROM invoices 
        WHERE created_at >= ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `, [startDate]);

      const [topPerformers] = await pool.execute(`
        SELECT 
          u.name,
          COALESCE(SUM(i.commission_amount), 0) as commission
        FROM users u
        LEFT JOIN invoices i ON u.id = i.user_id AND i.created_at >= ?
        WHERE u.grade IN ('G1', 'G2')
        GROUP BY u.id, u.name
        ORDER BY commission DESC
        LIMIT 5
      `, [startDate]);

      const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
      const totalCommission = rows.reduce((sum, row) => sum + row.commission, 0);

      commissionData = {
        totalRevenue,
        totalCommission,
        avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
        monthlyData: rows,
        topPerformers
      };
    } else {
      return res.status(403).json({ message: 'Access denied for this scope' });
    }

    if (format === 'pdf') {
      const pdf = exportService.generateCommissionPDF(commissionData, scope);
      const filename = `commission_${scope}_${Date.now()}.pdf`;
      const filePath = exportService.savePDF(pdf, filename);
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading file' });
        }
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    } else if (format === 'excel') {
      const workbook = exportService.generateCommissionExcel(commissionData, scope);
      const filename = `commission_${scope}_${Date.now()}.xlsx`;
      const filePath = exportService.saveExcel(workbook, filename);
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading file' });
        }
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    } else if (format === 'csv') {
      console.log('Commission CSV export requested for scope:', scope);
      console.log('Commission data keys:', Object.keys(commissionData));
      const csvContent = exportService.generateCommissionCSV(commissionData, scope);
      console.log('CSV content generated, length:', csvContent.length);
      const filename = `commission_${scope}_${Date.now()}.csv`;
      console.log('Saving CSV to:', filename);
      const filePath = exportService.saveCSV(csvContent, filename);
      console.log('CSV saved successfully to:', filePath);
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading file' });
        }
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    } else {
      res.status(400).json({ message: 'Invalid format. Use pdf, excel, or csv' });
    }
  } catch (error) {
    console.error('Export commission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Analytics API endpoint for G3 executives
app.get('/analytics', authenticateToken, requireGrade('G3'), async (req, res) => {
  try {
    const { range = '6months', metric = 'revenue' } = req.query;
    
    let months = 6;
    if (range === '3months') months = 3;
    else if (range === '1year') months = 12;
    else if (range === '2years') months = 24;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Check if database is available
    if (!pool) {
      // Return mock analytics data
      const mockData = {
        trends: [
          { period: '2024-01', value: 50000 },
          { period: '2024-02', value: 65000 },
          { period: '2024-03', value: 75000 },
          { period: '2024-04', value: 80000 },
          { period: '2024-05', value: 90000 },
          { period: '2024-06', value: 95000 }
        ],
        predictions: [
          { period: '2024-07', value: 100000 },
          { period: '2024-08', value: 105000 },
          { period: '2024-09', value: 110000 }
        ],
        kpis: {
          growthRate: 12.5,
          targetAchievement: 85,
          efficiencyScore: 8.5,
          avgProcessingTime: 3.2
        },
        departments: [
          { name: 'Sales', revenue: 45000, commission: 2250, efficiency: 5.0 },
          { name: 'Marketing', revenue: 30000, commission: 1500, efficiency: 5.0 },
          { name: 'Finance', revenue: 20000, commission: 1000, efficiency: 5.0 }
        ],
        insights: [
          {
            type: 'trend',
            title: 'Positive Growth Trend',
            message: 'Revenue has increased by $15,000 in the last month.',
            confidence: 85,
            recommendation: 'Consider expanding successful strategies to other departments.'
          }
        ],
        anomalies: []
      };
      return res.json(mockData);
    }

    // Fetch trends data using PostgreSQL syntax
    const trendsResult = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as period,
        COALESCE(SUM(${metric === 'revenue' ? 'amount' : metric === 'commission' ? 'commission_amount' : '1'}), 0) as value
      FROM invoices 
      WHERE created_at >= $1
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY period
    `, [startDate]);

    const trends = trendsResult.rows;

    // Generate predictions (simplified linear regression)
    const predictions = generatePredictions(trends, 3);

    // Calculate KPIs using PostgreSQL syntax
    const kpiResult = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as totalRevenue,
        COALESCE(SUM(commission_amount), 0) as totalCommission,
        COUNT(*) as totalInvoices,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avgProcessingTime
      FROM invoices 
      WHERE created_at >= $1
    `, [startDate]);

    const kpiData = kpiResult.rows[0];

    const prevPeriodResult = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as prevRevenue,
        COALESCE(SUM(commission_amount), 0) as prevCommission
      FROM invoices 
      WHERE created_at >= $1 - INTERVAL '${months} months'
      AND created_at < $1
    `, [startDate]);

    const prevPeriodData = prevPeriodResult.rows[0];

    const growthRate = prevPeriodData?.prevRevenue > 0 
      ? ((kpiData?.totalRevenue - prevPeriodData.prevRevenue) / prevPeriodData.prevRevenue) * 100 
      : 0;

    const targetAchievement = 85; // Mock target
    const efficiencyScore = kpiData?.totalRevenue > 0 
      ? (kpiData.totalCommission / kpiData.totalRevenue) * 100 
      : 0;

    // Department comparison using PostgreSQL syntax
    const departmentsResult = await pool.query(`
      SELECT 
        u.department as name,
        COALESCE(SUM(i.amount), 0) as revenue,
        COALESCE(SUM(i.commission_amount), 0) as commission,
        COUNT(*) as invoiceCount
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.created_at >= $1
      GROUP BY u.department
      ORDER BY revenue DESC
    `, [startDate]);

    const departments = departmentsResult.rows;

    // Calculate efficiency for each department
    departments.forEach(dept => {
      dept.efficiency = dept.revenue > 0 ? (dept.commission / dept.revenue) * 100 : 0;
    });

    // Generate insights
    const insights = generateInsights(trends, kpiData, departments);

    // Generate anomaly detection
    const anomalies = generateAnomalies(trends, kpiData);

    res.json({
      trends,
      predictions,
      kpis: {
        growthRate,
        targetAchievement,
        efficiencyScore,
        avgProcessingTime: kpiData?.avgProcessingTime || 0
      },
      departments,
      insights,
      anomalies
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper functions for analytics
function generatePredictions(trends, periods) {
  if (trends.length < 2) return [];

  // Simple linear regression
  const n = trends.length;
  const sumX = trends.reduce((sum, _, i) => sum + i, 0);
  const sumY = trends.reduce((sum, t) => sum + t.value, 0);
  const sumXY = trends.reduce((sum, t, i) => sum + (i * t.value), 0);
  const sumXX = trends.reduce((sum, _, i) => sum + (i * i), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predictions = [];
  for (let i = 0; i < periods; i++) {
    const monthIndex = n + i;
    const predictedValue = slope * monthIndex + intercept;
    
    // Generate month name
    const lastMonth = new Date(trends[trends.length - 1].period + '-01');
    const nextMonth = new Date(lastMonth);
    nextMonth.setMonth(lastMonth.getMonth() + i + 1);
    
    predictions.push({
      period: nextMonth.toISOString().slice(0, 7),
      value: Math.max(0, predictedValue)
    });
  }

  return predictions;
}

function generateInsights(trends, kpiData, departments) {
  const insights = [];

  // Growth insight
  if (trends.length >= 2) {
    const recentGrowth = trends[trends.length - 1].value - trends[trends.length - 2].value;
    if (recentGrowth > 0) {
      insights.push({
        type: 'trend',
        title: 'Positive Growth Trend',
        message: `Revenue has increased by $${recentGrowth.toLocaleString()} in the last month.`,
        confidence: 85,
        recommendation: 'Consider expanding successful strategies to other departments.'
      });
    } else if (recentGrowth < 0) {
      insights.push({
        type: 'warning',
        title: 'Declining Revenue',
        message: `Revenue has decreased by $${Math.abs(recentGrowth).toLocaleString()} in the last month.`,
        confidence: 90,
        recommendation: 'Investigate the cause and implement corrective measures.'
      });
    }
  }

  // Department performance insight
  const topDepartment = departments[0];
  const avgEfficiency = departments.reduce((sum, dept) => sum + dept.efficiency, 0) / departments.length;
  
  if (topDepartment && topDepartment.efficiency > avgEfficiency * 1.2) {
    insights.push({
      type: 'opportunity',
      title: 'High Performing Department',
      message: `${topDepartment.name} is performing ${((topDepartment.efficiency / avgEfficiency - 1) * 100).toFixed(1)}% better than average.`,
      confidence: 88,
      recommendation: 'Study and replicate best practices from this department.'
    });
  }

  // Commission efficiency insight
  const commissionRate = kpiData.totalRevenue > 0 ? (kpiData.totalCommission / kpiData.totalRevenue) * 100 : 0;
  if (commissionRate > 15) {
    insights.push({
      type: 'warning',
      title: 'High Commission Rate',
      message: `Commission rate is ${commissionRate.toFixed(1)}%, which is above industry average.`,
      confidence: 75,
      recommendation: 'Review commission structure to ensure profitability.'
    });
  }

  return insights;
}

function generateAnomalies(trends, kpiData) {
  const anomalies = [];

  if (trends.length >= 3) {
    // Calculate moving average
    const movingAverages = [];
    for (let i = 2; i < trends.length; i++) {
      const avg = (trends[i-2].value + trends[i-1].value + trends[i].value) / 3;
      movingAverages.push(avg);
    }

    // Check for anomalies
    trends.slice(2).forEach((trend, index) => {
      const avg = movingAverages[index];
      const deviation = Math.abs(trend.value - avg) / avg;
      
      if (deviation > 0.3) { // 30% deviation threshold
        anomalies.push({
          severity: deviation > 0.5 ? 'high' : deviation > 0.4 ? 'medium' : 'low',
          title: 'Revenue Anomaly Detected',
          description: `Revenue for ${trend.period} is ${deviation > 0 ? 'above' : 'below'} expected levels by ${(deviation * 100).toFixed(1)}%.`,
          impact: `This represents a $${Math.abs(trend.value - avg).toLocaleString()} deviation from expected performance.`,
          date: new Date(trend.period + '-01').toISOString()
        });
      }
    });
  }

  // Processing time anomaly
  if (kpiData.avgProcessingTime > 7) {
    anomalies.push({
      severity: 'medium',
      title: 'Slow Processing Time',
      description: `Average invoice processing time is ${kpiData.avgProcessingTime.toFixed(1)} days, which is above target.`,
      impact: 'This may affect cash flow and customer satisfaction.',
      date: new Date().toISOString()
    });
  }

  return anomalies;
}

app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
