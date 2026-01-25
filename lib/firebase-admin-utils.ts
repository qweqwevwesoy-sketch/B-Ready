import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin Utilities
 * These functions should only be used in server-side code or admin scripts
 */

// Initialize Firebase Admin SDK (only works on server-side)
let adminAuth: any = null;
let adminDb: any = null;

export const initializeAdminSDK = () => {
  try {
    // This will only work if Firebase Admin SDK is properly initialized
    if (typeof window === 'undefined') {
      // Server-side only
      const admin = require('firebase-admin');
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
      
      adminAuth = admin.auth();
      adminDb = admin.firestore();
      console.log('✅ Firebase Admin SDK initialized');
    }
  } catch (error) {
    console.warn('⚠️ Firebase Admin SDK not available:', error);
  }
};

/**
 * Set admin custom claim for a user
 * @param uid - User ID
 * @param isAdmin - Whether to set admin claim
 */
export const setAdminClaim = async (uid: string, isAdmin: boolean): Promise<void> => {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized. This function can only be used server-side.');
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { admin: isAdmin });
    console.log(`✅ Admin claim set for user ${uid}: ${isAdmin}`);
  } catch (error) {
    console.error('❌ Error setting admin claim:', error);
    throw new Error('Failed to set admin claim');
  }
};

/**
 * Set moderator custom claim for a user
 * @param uid - User ID
 * @param isModerator - Whether to set moderator claim
 */
export const setModeratorClaim = async (uid: string, isModerator: boolean): Promise<void> => {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized. This function can only be used server-side.');
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { moderator: isModerator });
    console.log(`✅ Moderator claim set for user ${uid}: ${isModerator}`);
  } catch (error) {
    console.error('❌ Error setting moderator claim:', error);
    throw new Error('Failed to set moderator claim');
  }
};

/**
 * Get user custom claims
 * @param uid - User ID
 */
export const getUserClaims = async (uid: string): Promise<any> => {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized. This function can only be used server-side.');
  }

  try {
    const user: any = await adminAuth.getUser(uid);
    return user.customClaims || {};
  } catch (error) {
    console.error('❌ Error getting user claims:', error);
    throw new Error('Failed to get user claims');
  }
};

/**
 * Check if user has admin privileges
 * @param uid - User ID
 */
export const isAdmin = async (uid: string): Promise<boolean> => {
  try {
    const claims = await getUserClaims(uid);
    return claims.admin === true;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if user has moderator privileges
 * @param uid - User ID
 */
export const isModerator = async (uid: string): Promise<boolean> => {
  try {
    const claims = await getUserClaims(uid);
    return claims.moderator === true || claims.admin === true; // Admins are also moderators
  } catch (error) {
    console.error('❌ Error checking moderator status:', error);
    return false;
  }
};

/**
 * List all users with admin claims
 */
export const listAdminUsers = async (): Promise<any[]> => {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized. This function can only be used server-side.');
  }

  try {
    const users: any[] = [];
    const listUsersResult = await adminAuth.listUsers();
    
    for (const user of listUsersResult.users) {
      if (user.customClaims?.admin === true) {
        users.push(user);
      }
    }
    
    return users;
  } catch (error) {
    console.error('❌ Error listing admin users:', error);
    throw new Error('Failed to list admin users');
  }
};

/**
 * Remove admin claim from a user
 * @param uid - User ID
 */
export const removeAdminClaim = async (uid: string): Promise<void> => {
  return setAdminClaim(uid, false);
};

/**
 * Remove moderator claim from a user
 * @param uid - User ID
 */
export const removeModeratorClaim = async (uid: string): Promise<void> => {
  return setModeratorClaim(uid, false);
};

/**
 * Grant both admin and moderator claims to a user
 * @param uid - User ID
 */
export const grantFullAdminAccess = async (uid: string): Promise<void> => {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized. This function can only be used server-side.');
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { 
      admin: true, 
      moderator: true 
    });
    console.log(`✅ Full admin access granted to user ${uid}`);
  } catch (error) {
    console.error('❌ Error granting full admin access:', error);
    throw new Error('Failed to grant full admin access');
  }
};

// Initialize on import (server-side only)
if (typeof window === 'undefined') {
  initializeAdminSDK();
}