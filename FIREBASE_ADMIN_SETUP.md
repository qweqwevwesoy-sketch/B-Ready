# Firebase Admin SDK Setup Guide

This guide will help you properly configure Firebase Admin SDK credentials to fix the 401 Unauthorized error when using admin features.

## Problem

The 401 Unauthorized error occurs because the Firebase Admin SDK is not properly initialized on the server side. This prevents the server from verifying Firebase ID tokens and checking admin privileges.

## Solution

### Step 1: Generate Firebase Admin SDK Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (b-ready-b7603)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Go to the "Service accounts" tab
6. Click "Generate new private key"
7. Download the JSON file

### Step 2: Extract Credentials

From the downloaded JSON file, extract these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com"
}
```

### Step 3: Update Environment Variables

Update your `.env.local` file with the extracted values:

```env
# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com
```

**Important Notes:**
- Replace `\n` with actual newlines in the private key
- The private key should be a single string with escaped newlines
- Make sure the service account has Firebase Authentication Admin permissions

### Step 4: Verify Admin User Privileges

1. In Firebase Console, go to "Authentication" → "Users"
2. Find your user (aldreigiftf@gmail.com)
3. Click on the user to view details
4. Check if they have custom claims with `admin: true`

If the user doesn't have admin privileges, you can add them using the Firebase Admin SDK or Firebase CLI.

### Step 5: Test the Setup

Run the admin verification script to check if everything is working:

```bash
npm run check-admin SJfXlzMcY7PoPYPD6cVhMLgGhlm1
```

This will:
- Verify Firebase Admin SDK initialization
- Check if the user exists
- Display their custom claims
- Confirm admin status

### Step 6: Restart Your Application

After updating the environment variables, restart your development server:

```bash
npm run dev
```

## Troubleshooting

### Common Issues

1. **"Missing Firebase Admin credentials"**
   - Check that all required environment variables are set
   - Verify the private key format (escaped newlines)

2. **"Firebase Admin initialization failed"**
   - Ensure the service account has proper permissions
   - Check that the project ID matches your Firebase project

3. **"User not found"**
   - Verify the user exists in Firebase Authentication
   - Check the user ID is correct

4. **"Admin status: NO"**
   - The user doesn't have admin custom claims
   - Add admin privileges using Firebase Admin SDK

### Adding Admin Privileges

To make a user an admin, you can use the Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');

// Initialize with your service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

// Set custom claims for a user
await auth.setCustomUserClaims('user-uid', { admin: true });
```

### Environment Variable Format

Make sure your `.env.local` file has the correct format:

```env
FIREBASE_PROJECT_ID=b-ready-b7603
FIREBASE_PRIVATE_KEY_ID=abc123def456
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=admin@b-ready-b7603.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/admin%40b-ready-b7603.iam.gserviceaccount.com
```

## Security Notes

- Never commit the `.env.local` file to version control
- Keep your private key secure and never share it
- Use different service accounts for development and production
- Regularly rotate your service account keys

## Next Steps

Once the Firebase Admin SDK is properly configured:

1. The 401 Unauthorized error should be resolved
2. Admin users should be able to use the "En Route" and "On Site" buttons
3. All admin features should work correctly
4. You can verify the fix by testing the admin response functionality

If you continue to experience issues, check the server logs for detailed error messages and ensure all environment variables are correctly set.