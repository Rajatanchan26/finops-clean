const pool = require('../db');
module.exports = async function auditLogger(req, res, next) {
  if (req.user) {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action) VALUES ($1, $2)',
      [req.user.id, `${req.method} ${req.originalUrl}`]
    );
  }
  next();
}; 