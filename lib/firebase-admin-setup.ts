import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin Setup Utility
 * This helps with proper initialization of Firebase Admin SDK
 */

export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface FirebaseAdminUser {
  uid: string;
  email?: string;
  displayName?: string;
  customClaims?: Record<string, any>;
}

export class FirebaseAdminManager {
  private static instance: FirebaseAdminManager;
  private app: any = null;
  private auth: any = null;
  private db: any = null;

  private constructor() {}

  static getInstance(): FirebaseAdminManager {
    if (!FirebaseAdminManager.instance) {
      FirebaseAdminManager.instance = new FirebaseAdminManager();
    }
    return FirebaseAdminManager.instance;
  }

  /**
   * Initialize Firebase Admin SDK with proper error handling
   */
  async initialize(): Promise<void> {
    try {
      // Check if already initialized
      if (this.app) {
        console.log('✅ Firebase Admin already initialized');
        return;
      }

      // Check environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      console.log('🔧 Firebase Admin initialization check:');
      console.log('  Project ID:', projectId ? '✅ Set' : '❌ Missing');
      console.log('  Client Email:', clientEmail ? '✅ Set' : '❌ Missing');
      console.log('  Private Key:', privateKey ? '✅ Set' : '❌ Missing');

      if (!projectId || !clientEmail || !privateKey) {
        console.warn('⚠️ Missing Firebase Admin credentials. Using application default credentials.');
        console.warn('💡 For production, set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env.local file');
      }

      // Initialize Firebase Admin
      if (!getApps().length) {
        if (projectId && clientEmail && privateKey) {
          console.log('🔑 Initializing with explicit credentials');
          this.app = initializeApp({
            credential: cert({
              projectId: projectId!,
              clientEmail: clientEmail!,
              privateKey: privateKey!.replace(/\\n/g, '\n'),
            }),
          });
        } else {
          console.log('🔑 Initializing with application default credentials');
          this.app = initializeApp();
        }
      } else {
        this.app = getApps()[0];
      }

      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase Admin initialization failed:', error);
      throw new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get Firebase Admin Auth instance
   */
  getAuthInstance(): any {
    if (!this.auth) {
      throw new Error('Firebase Admin not initialized. Call initialize() first.');
    }
    return this.auth;
  }

  /**
   * Get Firebase Admin Firestore instance
   */
  getFirestoreInstance(): any {
    if (!this.db) {
      throw new Error('Firebase Admin not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Verify Firebase ID token
   */
  async verifyToken(token: string): Promise<any> {
    if (!this.auth) {
      throw new Error('Firebase Admin not initialized. Call initialize() first.');
    }
    return await this.auth.verifyIdToken(token);
  }

  /**
   * Check if user is admin
   */
  async isAdmin(uid: string): Promise<boolean> {
    if (!this.auth) {
      throw new Error('Firebase Admin not initialized. Call initialize() first.');
    }
    const user = await this.auth.getUser(uid);
    return user.customClaims?.admin === true;
  }

  /**
   * Get user info
   */
  async getUser(uid: string): Promise<any> {
    if (!this.auth) {
      throw new Error('Firebase Admin not initialized. Call initialize() first.');
    }
    return await this.auth.getUser(uid);
  }
}

// Export singleton instance
export const firebaseAdminManager = FirebaseAdminManager.getInstance();

// Auto-initialize on import (server-side only)
if (typeof window === 'undefined') {
  firebaseAdminManager.initialize().catch(console.error);
}