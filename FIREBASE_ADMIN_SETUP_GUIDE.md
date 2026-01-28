# Firebase Admin SDK Setup Guide

This guide will help you properly configure Firebase Admin SDK for your B-Ready application.

## Why Firebase Admin SDK is Needed

The Firebase Admin SDK allows your server to:
- Read and write to Firestore database
- Authenticate users server-side
- Send push notifications
- Manage Firebase services programmatically

## Step 1: Create Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (b-ready-b7603)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Go to the "Service accounts" tab
6. Click "Generate new private key"
7. Download the JSON file

## Step 2: Extract Environment Variables

From the downloaded JSON file, extract these values:

```json
{
  "type": "service_account",
  "project_id": "b-ready-b7603",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@b-ready-b7603.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40b-ready-b7603.iam.gserviceaccount.com"
}
```

## Step 3: Update Environment Variables

Replace the placeholder values in your `.env.local` and `server/.env` files:

```bash
# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=b-ready-b7603
FIREBASE_PRIVATE_KEY_ID=ACTUAL_PRIVATE_KEY_ID_FROM_JSON
FIREBASE_PRIVATE_KEY="ACTUAL_PRIVATE_KEY_FROM_JSON"
FIREBASE_CLIENT_EMAIL=ACTUAL_CLIENT_EMAIL_FROM_JSON
FIREBASE_CLIENT_ID=ACTUAL_CLIENT_ID_FROM_JSON
FIREBASE_CLIENT_X509_CERT_URL=ACTUAL_CERT_URL_FROM_JSON
```

**Important Notes:**
- Keep the private key in double quotes
- Replace newlines in private key with `\n` (the server code handles this)
- Never commit these credentials to version control

## Step 4: Set Firestore Rules

Ensure your Firestore rules allow read/write access for your service account:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 5: Restart Services

After updating environment variables:

1. Stop your current server
2. Restart the server: `cd server && npm start`
3. Restart the frontend: `npm run dev`

## Troubleshooting

### Error: "Missing Firebase Admin environment variables"
- Check that all required environment variables are set
- Verify the values are correct and not empty
- Ensure no typos in variable names

### Error: "Firebase Admin initialization failed"
- Verify the service account JSON is valid
- Check that the service account has proper Firestore permissions
- Ensure the project ID matches your Firebase project

### Error: "Permission denied"
- Check Firestore security rules
- Verify the service account has the correct IAM roles
- Ensure the service account is enabled in Firebase Console

## Testing

After setup, you should see these logs when starting the server:

```
✅ Firebase Admin initialized successfully
📊 Connected to Firestore project: b-ready-b7603
📋 Loaded X reports from Firebase
💬 Loaded messages from Firebase
📍 Loaded X stations from Firebase
```

If you see these logs, Firebase Admin SDK is working correctly and reports should now persist and display in your dashboard.