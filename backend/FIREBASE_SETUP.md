# Firebase Setup Guide for Railway

This guide explains how to set up Firebase Admin SDK for the FinOps application on Railway.

## Prerequisites

1. Firebase project created at https://console.firebase.google.com/
2. Project ID from your Firebase project

## Option 1: Service Account Key (Recommended)

### Step 1: Generate Service Account Key

1. Go to Firebase Console → Project Settings
2. Click on "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file

### Step 2: Set Railway Environment Variables

In your Railway project dashboard, add these environment variables:

```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
FIREBASE_PROJECT_ID=your-project-id
```

**Important**: The `FIREBASE_SERVICE_ACCOUNT_KEY` should be the entire JSON content as a single line.

## Option 2: Application Default Credentials

### Step 1: Set Project ID

In Railway, add this environment variable:

```
FIREBASE_PROJECT_ID=your-project-id
```

### Step 2: Set Google Application Credentials (Optional)

If you have a service account JSON file, you can also set:

```
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## Option 3: Local Development

For local development, you can:

1. Download the service account JSON file
2. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the file
3. Or use Firebase CLI: `firebase login`

## Environment Variables Summary

### Required
- `FIREBASE_PROJECT_ID` - Your Firebase project ID

### Optional (choose one)
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Full JSON service account key (recommended)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account file

## Testing the Setup

After setting up the environment variables:

1. Deploy to Railway
2. Check the logs for "Firebase Admin SDK initialized successfully"
3. Try logging in with a Firebase user

## Troubleshooting

### "Unable to detect a Project Id"

**Cause**: Firebase Admin SDK can't find the project configuration.

**Solutions**:
1. Set `FIREBASE_PROJECT_ID` environment variable
2. Use a service account key with `FIREBASE_SERVICE_ACCOUNT_KEY`
3. Check that the environment variables are properly set in Railway

### "Firebase Admin not initialized"

**Cause**: Firebase Admin SDK failed to initialize.

**Solutions**:
1. Check Railway logs for initialization errors
2. Verify service account key format (should be valid JSON)
3. Ensure project ID is correct

### "Invalid service account"

**Cause**: Service account key is malformed or invalid.

**Solutions**:
1. Regenerate the service account key
2. Ensure the JSON is properly formatted
3. Check that the key has the necessary permissions

## Security Notes

- Never commit service account keys to version control
- Use Railway's environment variables for sensitive data
- Regularly rotate service account keys
- Use the minimum required permissions for the service account

## Permissions Required

The service account needs these permissions:
- Firebase Authentication Admin
- Firebase Realtime Database Admin (if using)
- Firebase Firestore Admin (if using)

## Example Service Account Key Format

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"
}
``` 