#!/usr/bin/env node

/**
 * Test script to verify server configuration
 * Run this script to check if your Firebase and WebSocket setup is correct
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Testing B-Ready Server Configuration...\n');

// Test 1: Check environment variables
console.log('📋 Environment Variables Check:');
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID', 
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_CLIENT_X509_CERT_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing Firebase Admin environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n📝 To fix this, set these variables in your .env.local and server/.env files');
  console.log('💡 See FIREBASE_ADMIN_SETUP_GUIDE.md for detailed instructions\n');
} else {
  console.log('✅ All required Firebase environment variables are set');
}

// Test 2: Check WebSocket URL configuration
console.log('🌐 WebSocket Configuration Check:');
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
if (!socketUrl) {
  console.log('❌ NEXT_PUBLIC_SOCKET_URL is not set');
} else {
  console.log(`✅ WebSocket URL: ${socketUrl}`);
  
  // Check if URL is localhost (recommended for development)
  if (socketUrl.includes('localhost') || socketUrl.includes('127.0.0.1')) {
    console.log('✅ Using localhost WebSocket URL (recommended for development)');
  } else {
    console.log('⚠️  Using network WebSocket URL - ensure server is accessible from this address');
  }
}

// Test 3: Check offline mode setting
console.log('\n📱 Offline Mode Check:');
const useLocalBackend = process.env.USE_LOCAL_BACKEND === 'true';
if (useLocalBackend) {
  console.log('⚠️  Offline mode is enabled (USE_LOCAL_BACKEND=true)');
  console.log('   Reports will be stored in memory only and lost on restart');
} else {
  console.log('✅ Offline mode is disabled - Firebase persistence enabled');
}

// Test 4: Check if we can import required modules
console.log('\n📦 Module Import Check:');
try {
  const admin = await import('firebase-admin');
  console.log('✅ firebase-admin module imported successfully');
} catch (error) {
  console.log('❌ Failed to import firebase-admin:', error.message);
}

try {
  const socketIo = await import('socket.io');
  console.log('✅ socket.io module imported successfully');
} catch (error) {
  console.log('❌ Failed to import socket.io:', error.message);
}

// Test 5: Check Firebase Admin initialization (dry run)
console.log('\n🔧 Firebase Admin Initialization Test:');
if (missingVars.length === 0) {
  try {
    const admin = await import('firebase-admin');
    
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    // Don't actually initialize, just validate the config
    if (serviceAccount.project_id && serviceAccount.client_email) {
      console.log('✅ Firebase service account configuration looks valid');
      console.log(`   Project ID: ${serviceAccount.project_id}`);
      console.log(`   Client Email: ${serviceAccount.client_email}`);
    } else {
      console.log('❌ Invalid Firebase service account configuration');
    }
  } catch (error) {
    console.log('❌ Firebase Admin configuration test failed:', error.message);
  }
} else {
  console.log('⚠️  Skipping Firebase Admin test due to missing environment variables');
}

console.log('\n🎯 Summary:');
if (missingVars.length === 0 && socketUrl) {
  console.log('✅ Configuration looks good! You can now start your server.');
  console.log('   Run: cd server && npm start');
  console.log('   Run: npm run dev (for frontend)');
} else {
  console.log('⚠️  Configuration has issues. Please fix the problems above before starting the server.');
}

console.log('\n💡 For more help, see FIREBASE_ADMIN_SETUP_GUIDE.md');