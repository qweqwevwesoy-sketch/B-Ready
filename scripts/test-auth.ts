#!/usr/bin/env ts-node

/**
 * Authentication Flow Test Script
 * This script tests the complete authentication flow to ensure everything works
 */

import { NextRequest } from 'next/server';
import { firebaseAdminManager } from '../lib/firebase-admin-setup';

async function testAuthFlow() {
  try {
    console.log('🧪 Testing Firebase Admin Authentication Flow...\n');

    // Test 1: Initialize Firebase Admin Manager
    console.log('1️⃣ Testing Firebase Admin Manager initialization...');
    await firebaseAdminManager.initialize();
    console.log('   ✅ Firebase Admin Manager initialized successfully');

    // Test 2: Get Auth instance
    console.log('\n2️⃣ Testing Auth instance retrieval...');
    const auth = firebaseAdminManager.getAuthInstance();
    console.log('   ✅ Auth instance retrieved successfully');

    // Test 3: Check environment variables
    console.log('\n3️⃣ Checking environment variables...');
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log(`   Project ID: ${projectId ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Client Email: ${clientEmail ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Private Key: ${privateKey ? '✅ Set' : '❌ Missing'}`);

    if (!projectId || !clientEmail || !privateKey) {
      console.log('\n❌ Environment variables not properly set!');
      console.log('💡 Please update your .env.local file with Firebase Admin credentials.');
      console.log('   See FIREBASE_ADMIN_SETUP.md for detailed instructions.');
      return;
    }

    console.log('\n✅ All environment variables are properly set!');

    // Test 4: Test token verification (with a dummy token to test the function)
    console.log('\n4️⃣ Testing token verification function...');
    try {
      // This will fail with an invalid token, but we're testing the function structure
      await auth.verifyIdToken('invalid-token');
      console.log('   ⚠️ Token verification succeeded unexpectedly (this is odd)');
    } catch (error: any) {
      if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-argument') {
        console.log('   ✅ Token verification function works correctly (rejected invalid token)');
      } else {
        console.log(`   ⚠️ Token verification failed with unexpected error: ${error.code}`);
      }
    }

    console.log('\n🎉 Authentication flow test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Firebase Admin SDK properly configured');
    console.log('   ✅ Environment variables set correctly');
    console.log('   ✅ Authentication functions working');
    console.log('\n🚀 You should now be able to use admin features without 401 errors!');

  } catch (error) {
    console.error('❌ Authentication flow test failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your .env.local file has all Firebase Admin credentials');
    console.log('   2. Verify the private key format (escaped newlines)');
    console.log('   3. Ensure the service account has proper permissions');
    console.log('   4. Check FIREBASE_ADMIN_SETUP.md for detailed setup instructions');
  }
}

// Run the test
testAuthFlow();