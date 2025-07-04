const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/rajat/OneDrive/Desktop/Hackathon/backend/firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin; 