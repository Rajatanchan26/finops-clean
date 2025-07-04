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

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool using env variables
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Helper: Authenticate JWT and check role
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
}

// POST /login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /transactions
app.get('/transactions', authenticateToken, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('SELECT * FROM transactions ORDER BY timestamp DESC');
    } else {
      result = await pool.query('SELECT * FROM transactions WHERE department = $1 ORDER BY timestamp DESC', [req.user.department]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err); // Log error
    res.status(500).json({ message: 'Server error' });
  }
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /users (admin only)
app.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, department, employee_grade, designation FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /users/:id - fetch user details (self or admin)
app.get('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  // Only allow self or admin
  if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const result = await pool.query('SELECT id, name, email, role, department, profile_picture_url, employee_grade, designation FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /users/:id (admin only) - update user details in both DB and Firebase
app.patch('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, department, role, employee_grade, designation } = req.body;
  if (!name || !email || !department || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    // Get firebase_uid
    const userRes = await pool.query('SELECT firebase_uid FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const firebase_uid = userRes.rows[0].firebase_uid;
    // Update DB
    await pool.query(
      'UPDATE users SET name = $1, email = $2, department = $3, role = $4, employee_grade = $5, designation = $6 WHERE id = $7',
      [name, email, department, role, employee_grade, designation, id]
    );
    // Update Firebase Auth
    if (firebase_uid) {
      await admin.auth().updateUser(firebase_uid, {
        email,
        displayName: name,
      });
      await admin.auth().setCustomUserClaims(firebase_uid, { role });
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
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
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
  const { name, email, password, department, role, employee_grade, designation } = req.body;
  const ALLOWED_DEPARTMENTS = ['Finance', 'HR', 'Digital Transformation', 'Planning', 'Data&AI'];
  const ALLOWED_ROLES = ['user', 'admin'];
  if (!name || !email || !password || !department || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!ALLOWED_DEPARTMENTS.includes(department)) {
    return res.status(400).json({ message: 'Invalid department' });
  }
  if (!ALLOWED_ROLES.includes(role)) {
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
      await admin.auth().setCustomUserClaims(fbUser.uid, { role });
    } catch (fbErr) {
      return res.status(500).json({ message: 'Firebase: ' + fbErr.message });
    }
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    // Insert user in DB with firebase_uid
    await pool.query(
      'INSERT INTO users (name, email, role, password, department, employee_grade, designation, firebase_uid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [name, email, role, hashed, department, employee_grade || null, designation || null, fbUser.uid]
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
  const ALLOWED_ROLES = ['user', 'admin'];
  const parser = csv.parse({ columns: true, trim: true });
  parser.on('readable', async () => {
    let record;
    while ((record = parser.read())) {
      const { name, email, password, department, role } = record;
      if (!name || !email || !password || !department || !role) {
        errors.push({ email, error: 'Missing required fields' });
        continue;
      }
      if (!ALLOWED_DEPARTMENTS.includes(department)) {
        errors.push({ email, error: 'Invalid department' });
        continue;
      }
      if (!ALLOWED_ROLES.includes(role)) {
        errors.push({ email, error: 'Invalid role' });
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
          await admin.auth().setCustomUserClaims(fbUser.uid, { role });
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
          'INSERT INTO users (name, email, role, password, department, firebase_uid) VALUES ($1, $2, $3, $4, $5, $6)',
          [name, email, role, hashed, department, fbUser.uid]
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
