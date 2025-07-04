// migrate_firebase_uids.js
require('dotenv').config();
const { Pool } = require('pg');
const admin = require('./firebaseAdmin');
const crypto = require('crypto');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function migrate() {
  const users = (await pool.query('SELECT id, name, email, role, firebase_uid FROM users')).rows;
  let updated = 0, created = 0, failed = 0;
  for (const user of users) {
    if (user.firebase_uid) continue;
    let fbUser;
    try {
      // Try to find user in Firebase
      try {
        fbUser = await admin.auth().getUserByEmail(user.email);
        console.log(`Found Firebase user for ${user.email}`);
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          // Create user in Firebase with random password
          const randomPassword = crypto.randomBytes(10).toString('base64');
          fbUser = await admin.auth().createUser({
            email: user.email,
            displayName: user.name,
            password: randomPassword,
          });
          created++;
          console.log(`Created Firebase user for ${user.email}`);
        } else {
          throw e;
        }
      }
      // Set custom claims
      await admin.auth().setCustomUserClaims(fbUser.uid, { role: user.role });
      // Update DB
      await pool.query('UPDATE users SET firebase_uid = $1 WHERE id = $2', [fbUser.uid, user.id]);
      updated++;
    } catch (err) {
      failed++;
      console.error(`Failed for ${user.email}:`, err.message);
    }
  }
  console.log(`\nMigration complete. Updated: ${updated}, Created: ${created}, Failed: ${failed}`);
  process.exit(0);
}

migrate(); 