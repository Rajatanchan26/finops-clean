const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
try {
  let config = {};
  
  // Check if we have a service account key (preferred for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    config = {
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
    };
  } 
  // Check if we have project ID and can use application default
  else if (process.env.FIREBASE_PROJECT_ID) {
    config = {
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    };
  }
  // Fallback to application default (requires GOOGLE_APPLICATION_CREDENTIALS)
  else {
    config = {
      credential: admin.credential.applicationDefault()
    };
  }
  
  admin.initializeApp(config);
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase Admin initialization failed:', error.message);
  // Don't throw error, let the app continue without Firebase
}

module.exports = admin; 