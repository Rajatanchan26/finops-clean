const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: In production, you should use environment variables for the service account
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Add your Firebase project configuration here if needed
  });
} catch (error) {
  console.log('Firebase Admin already initialized or failed to initialize:', error.message);
}

module.exports = admin; 