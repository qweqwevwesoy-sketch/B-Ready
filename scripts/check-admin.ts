#!/usr/bin/env ts-node

/**
 * Admin User Verification Script
 * This script helps verify if a user has admin privileges in Firebase
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkAdminUser() {
  try {
    console.log('🔧 Checking admin user privileges...\n');

    // Check environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('❌ Missing Firebase Admin credentials in environment variables');
      console.log('💡 Please set the following in your .env.local file:');
      console.log('   FIREBASE_PROJECT_ID=your-project-id');
      console.log('   FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com');
      console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY\\n-----END PRIVATE KEY-----\\n"');
      process.exit(1);
    }

    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    const auth = getAuth(app);

    // Get user ID from command line argument or prompt
    const userId = process.argv[2];
    if (!userId) {
      console.log('Usage: npm run check-admin <user-id>');
      console.log('Example: npm run check-admin SJfXlzMcY7PoPYPD6cVhMLgGhlm1');
      process.exit(1);
    }

    console.log(`🔍 Checking user: ${userId}`);

    // Get user info
    const user = await auth.getUser(userId);
    console.log('\n📋 User Information:');
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email || 'Not provided'}`);
    console.log(`   Display Name: ${user.displayName || 'Not provided'}`);
    console.log(`   Phone: ${user.phoneNumber || 'Not provided'}`);

    // Check custom claims
    console.log('\n🔐 Custom Claims:');
    if (user.customClaims) {
      console.log('   Claims found:');
      Object.entries(user.customClaims).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    } else {
      console.log('   No custom claims found');
    }

    // Check admin status
    const isAdmin = user.customClaims?.admin === true;
    console.log(`\n👑 Admin Status: ${isAdmin ? '✅ YES' : '❌ NO'}`);

    if (!isAdmin) {
      console.log('\n💡 To make this user an admin, run:');
      console.log(`   npm run set-admin ${userId}`);
    }

    console.log('\n✅ Admin check completed successfully!');

  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    process.exit(1);
  }
}

// Run the script
checkAdminUser();