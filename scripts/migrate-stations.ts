#!/usr/bin/env ts-node

/**
 * Stations Data Migration Script
 * This script migrates emergency stations data from MySQL to Firestore
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { mysqlConnection } from '@/lib/mysql-connection';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateStations() {
  try {
    console.log('🔧 Starting stations migration from MySQL to Firestore...');

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

    const db = getFirestore(app);

    // Connect to MySQL and fetch all stations
    console.log('📡 Fetching stations from MySQL...');
    const mysqlStations = await mysqlConnection.query('SELECT * FROM emergency_stations ORDER BY name');

    if (mysqlStations.length === 0) {
      console.log('⚠️  No stations found in MySQL database');
      return;
    }

    console.log('✅ Found stations in MySQL:', mysqlStations.length);

    // Prepare stations data for Firestore
    const stationsForFirestore = mysqlStations.map(station => ({
      id: station.id,
      name: station.name,
      type: 'fire', // Default type, can be enhanced based on station name
      location: {
        lat: station.lat,
        lng: station.lng
      },
      address: station.address,
      capacity: 100, // Default capacity
      currentLoad: 0, // Default current load
      status: 'operational', // Default status
      contact: station.phone || station.email || 'N/A',
      phone: station.phone,
      email: station.email,
      website: station.website,
      description: station.description,
      created_at: station.created_at.toISOString(),
      updated_at: station.updated_at.toISOString()
    }));

    console.log('🔄 Preparing to migrate stations to Firestore...');

    // Batch write stations to Firestore
    const batch = db.batch();
    const stationsCollection = db.collection('emergency_stations');

    stationsForFirestore.forEach(station => {
      const stationRef = stationsCollection.doc(station.id);
      batch.set(stationRef, station);
    });

    // Execute the batch write
    await batch.commit();

    console.log('✅ Successfully migrated stations to Firestore:', stationsForFirestore.length);
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the script
migrateStations();