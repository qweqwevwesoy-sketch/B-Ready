# Firebase Security Rules Setup

This document explains how to set up Firebase security rules for the B-Ready application.

## Overview

The application uses Firebase Firestore and Storage with security rules to protect data access. The rules are defined in:

- `firestore.rules` - Firestore database security rules
- `storage.rules` - Firebase Storage security rules

## Required Firebase Setup

### 1. Firebase Project Configuration

Ensure your Firebase project is properly configured with the following environment variables in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Admin User Setup

For admin functionality to work, users need to have the `admin` custom claim set in Firebase Authentication. This can be done using Firebase Admin SDK or Firebase CLI.

#### Using Firebase CLI:

```bash
# Set admin claim for a user
firebase auth:set-custom-claims <user-id> '{"admin": true}'
```

#### Using Firebase Admin SDK (Node.js):

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Set admin claim
const uid = 'user-uid-here';
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('Admin claim set successfully');
  })
  .catch((error) => {
    console.error('Error setting admin claim:', error);
  });
```

## Deploying Security Rules

### Using Firebase CLI

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase project** (if not already done):
   ```bash
   firebase init
   ```
   Select Firestore and Storage when prompted.

4. **Deploy Firestore rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Deploy Storage rules**:
   ```bash
   firebase deploy --only storage:rules
   ```

### Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database → Rules
4. Copy the content from `firestore.rules` and paste it into the rules editor
5. Click "Publish"

6. Navigate to Storage → Rules
7. Copy the content from `storage.rules` and paste it into the rules editor
8. Click "Publish"

## Security Rules Explanation

### Firestore Rules

- **Public Collections**: `emergency_contacts`, `safety_tips`, `emergency_kit`, `emergency_stations`, `disaster_warnings` are readable by all users
- **Admin-Only Writes**: Only authenticated admin users can write to these collections
- **User Data**: Users can only read/write their own user data
- **Anonymous Reports**: Authenticated users can create reports, but they are immutable once created
- **Chat Messages**: Authenticated users can create messages and only the author can edit/delete their own messages
- **Notifications**: Only admin users can create, update, or delete notifications

### Storage Rules

- **Public Files**: Files in `/public/` are readable by all users, writable only by admins
- **Profile Pictures**: Users can upload and manage their own profile pictures
- **Emergency Resources**: Only admin users can upload emergency resources
- **Anonymous Reports**: Authenticated users can upload files for anonymous reports

## Testing Security Rules

### Using Firebase Emulator

1. **Start the Firebase emulator**:
   ```bash
   firebase emulators:start --only firestore,storage
   ```

2. **Test rules locally** before deploying to production

### Using Firebase Console

1. Go to Firebase Console
2. Navigate to Firestore Database or Storage
3. Use the "Rules Playground" to test your rules with different user scenarios

## Troubleshooting

### Common Issues

1. **"Missing or insufficient permissions" Error**:
   - Ensure the user is authenticated
   - Check if the user has the required custom claims (admin role)
   - Verify the security rules are deployed correctly

2. **Authentication Issues**:
   - Ensure Firebase Authentication is enabled in the Firebase Console
   - Check that the user is properly signed in
   - Verify the Firebase configuration in `.env.local`

3. **Rule Deployment Issues**:
   - Ensure you're logged into the correct Firebase project
   - Check the Firebase CLI version
   - Verify the rules syntax is correct

### Debugging Tips

1. **Check Firebase Console Logs**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Check for any authentication errors

2. **Use Firebase Emulator**:
   - Test rules locally before deploying
   - Use the emulator UI to debug rule violations

3. **Console Logging**:
   - Add console.log statements in your application to debug authentication state
   - Check the Firebase Auth state: `console.log(firebase.auth().currentUser)`

## Security Best Practices

1. **Least Privilege**: Only grant the minimum necessary permissions
2. **Input Validation**: Always validate and sanitize user input
3. **Regular Audits**: Regularly review and update security rules
4. **Environment Separation**: Use different Firebase projects for development and production
5. **Monitor Usage**: Keep an eye on Firebase usage and billing

## Support

For additional help with Firebase security rules, refer to:
- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Guide](https://firebase.google.com/docs/storage/security/start)