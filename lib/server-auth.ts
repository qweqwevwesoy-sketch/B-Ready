import { NextRequest } from 'next/server';

/**
 * Server-side authentication utilities for API routes
 * These functions should only be used in server-side code
 */

// Initialize Firebase Admin SDK
let adminAuth: any = null;
let adminDb: any = null;

const initializeAdminSDK = () => {
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
      console.log('✅ Firebase Admin SDK initialized for server auth');
    }
  } catch (error) {
    console.warn('⚠️ Firebase Admin SDK not available:', error);
  }
};

// Initialize on import (server-side only)
if (typeof window === 'undefined') {
  initializeAdminSDK();
}

/**
 * Verify Firebase ID token from request headers
 * @param request - NextRequest object
 * @returns Decoded token or null if invalid
 */
export const verifyFirebaseToken = async (request: NextRequest): Promise<{ uid: string; [key: string]: unknown } | null> => {
  try {
    // Get the admin's authentication token from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header found');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('🔑 Verifying Firebase token...');

    if (!adminAuth) {
      console.error('❌ Firebase Admin SDK not initialized');
      return null;
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('✅ Firebase token verified successfully for user:', decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error);
    return null;
  }
};

/**
 * Check if user is an admin
 * @param uid - User ID
 * @returns Promise<boolean> indicating if user is admin
 */
export const checkAdmin = async (uid: string): Promise<boolean> => {
  try {
    if (!adminAuth) {
      console.error('❌ Firebase Admin SDK not initialized for admin check');
      return false;
    }

    const user: any = await adminAuth.getUser(uid);
    const isAdmin = user.customClaims?.admin === true;
    console.log(`👤 Admin check for user ${uid}: ${isAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}`);
    return isAdmin;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    return false;
  }
};

/**
 * Complete authentication middleware for API routes
 * @param request - NextRequest object
 * @returns Object with success status, decoded token, and admin status
 */
export const authenticateAdminRequest = async (request: NextRequest): Promise<{
  success: boolean;
  decodedToken: { uid: string; [key: string]: unknown } | null;
  isAdmin: boolean;
  error?: string;
}> => {
  // Step 1: Verify Firebase token
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return {
      success: false,
      decodedToken: null,
      isAdmin: false,
      error: 'Unauthorized: Invalid or missing Firebase token'
    };
  }

  // Step 2: Check if user is admin
  const isAdmin = await checkAdmin(decodedToken.uid);
  if (!isAdmin) {
    return {
      success: false,
      decodedToken,
      isAdmin: false,
      error: 'Forbidden: Admin access required'
    };
  }

  return {
    success: true,
    decodedToken,
    isAdmin: true
  };
};