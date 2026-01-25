# Firebase Admin Setup Guide

This guide explains how to set up admin users and manage Firebase permissions for the B-Ready application.

## Overview

The B-Ready application uses Firebase Authentication custom claims to manage user permissions. There are two types of privileged users:

- **Admin Users**: Full access to all admin features including safety tips, emergency kit items, and emergency contacts
- **Moderator Users**: Access to safety tips and emergency kit items (subset of admin permissions)

## Firebase Security Rules

The updated security rules in `firestore.rules` now support both admin and moderator roles:

```javascript
// Allow write access for admins and moderators
allow write: if request.auth != null && (request.auth.token.admin == true || request.auth.token.moderator == true);
```

## Setting Up Admin Users

### Method 1: Using Firebase Admin SDK (Recommended)

1. **Install Firebase Admin SDK** (if not already installed):
   ```bash
   npm install firebase-admin
   ```

2. **Create a service account**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

3. **Use the admin utilities** (located in `lib/firebase-admin-utils.ts`):

   ```typescript
   import { setAdminClaim, grantFullAdminAccess } from '@/lib/firebase-admin-utils';

   // Grant admin access to a user
   await setAdminClaim('user-uid-here', true);

   // Grant both admin and moderator access
   await grantFullAdminAccess('user-uid-here');
   ```

### Method 2: Using Firebase CLI

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login and initialize**:
   ```bash
   firebase login
   firebase init
   ```

3. **Set custom claims using CLI**:
   ```bash
   firebase auth:export users.json
   # Edit users.json to add custom claims
   firebase auth:import users.json --hash-algo=scrypt --rounds=8 --mem-cost=14
   ```

### Method 3: Using Firebase Console (Limited)

While you cannot directly set custom claims through the Firebase Console UI, you can:
1. Identify user UIDs
2. Use the admin utilities or CLI to set claims for those UIDs

## Admin User Management

### Granting Admin Access

```typescript
import { grantFullAdminAccess } from '@/lib/firebase-admin-utils';

// Grant admin access to a user
await grantFullAdminAccess('user-uid-here');
```

### Checking User Permissions

```typescript
import { isAdmin, isModerator } from '@/lib/firebase-admin-utils';

// Check if user is admin
const isAdminUser = await isAdmin('user-uid-here');

// Check if user is moderator (includes admins)
const isModUser = await isModerator('user-uid-here');
```

### Listing Admin Users

```typescript
import { listAdminUsers } from '@/lib/firebase-admin-utils';

// Get all users with admin claims
const adminUsers = await listAdminUsers();
console.log('Admin users:', adminUsers);
```

### Removing Admin Access

```typescript
import { removeAdminClaim, removeModeratorClaim } from '@/lib/firebase-admin-utils';

// Remove admin claim
await removeAdminClaim('user-uid-here');

// Remove moderator claim
await removeModeratorClaim('user-uid-here');
```

## Client-Side Permission Checking

The application includes client-side permission checking in `lib/client-utils.ts`:

```typescript
import { checkAdminPermissions } from '@/lib/client-utils';

// Check if current user has admin permissions
const hasAdminAccess = await checkAdminPermissions();
```

## Troubleshooting

### Common Issues

1. **"Missing or insufficient permissions" errors**:
   - Ensure the user has the proper custom claims set
   - Check that the Firebase Admin SDK is properly initialized
   - Verify the service account has the necessary permissions

2. **Custom claims not appearing immediately**:
   - Custom claims are cached and may take up to 1 hour to refresh
   - Users need to sign out and sign back in to get updated claims
   - For development, you can force token refresh

3. **Firebase Admin SDK initialization errors**:
   - Ensure the service account key file is properly configured
   - Check that the application is running server-side (not client-side)
   - Verify the Firebase project ID is correct

### Debugging Tips

1. **Check user claims**:
   ```typescript
   import { getUserClaims } from '@/lib/firebase-admin-utils';

   const claims = await getUserClaims('user-uid-here');
   console.log('User claims:', claims);
   ```

2. **Verify Firebase Admin SDK initialization**:
   ```typescript
   import { initializeAdminSDK } from '@/lib/firebase-admin-utils';

   try {
     initializeAdminSDK();
     console.log('Firebase Admin SDK initialized successfully');
   } catch (error) {
     console.error('Failed to initialize Firebase Admin SDK:', error);
   }
   ```

## Security Best Practices

1. **Keep service account keys secure**: Never commit service account keys to version control
2. **Use environment variables**: Store sensitive configuration in environment variables
3. **Limit admin users**: Only grant admin access to trusted users who need it
4. **Monitor access**: Regularly review the list of admin users
5. **Use moderator role when possible**: Grant moderator access instead of full admin when appropriate

## Development vs Production

### Development Environment
- Use test users with admin claims for development
- Consider using Firebase Emulator Suite for local testing
- Set up a separate Firebase project for development

### Production Environment
- Use real service accounts with minimal required permissions
- Implement proper user onboarding for admin users
- Monitor admin user activity
- Have a process for revoking admin access when needed

## Example: Setting Up Initial Admin User

```typescript
// setup-admin.ts
import { grantFullAdminAccess } from '@/lib/firebase-admin-utils';

async function setupInitialAdmin() {
  try {
    // Replace with the actual user UID
    const adminUserUid = 'your-admin-user-uid-here';
    
    await grantFullAdminAccess(adminUserUid);
    console.log('✅ Initial admin user set up successfully');
  } catch (error) {
    console.error('❌ Failed to set up initial admin user:', error);
  }
}

// Run the setup
setupInitialAdmin();
```

## Integration with Existing Authentication

The permission system works alongside your existing Firebase Authentication:

1. Users sign in using your existing auth flow
2. Admin users have custom claims set server-side
3. Client-side code checks permissions before allowing access to admin features
4. Server-side API routes validate permissions before processing requests

This approach ensures that only authorized users can access admin functionality while maintaining the security of your application.