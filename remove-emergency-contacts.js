const admin = require('firebase-admin');
const serviceAccount = require('../b-ready-b7603-firebase-adminsdk-fbsvc-ddf5a334d5.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function removeEmergencyContacts() {
  try {
    console.log('🧹 Removing existing emergency contacts...');
    
    // Get all emergency contacts
    const snapshot = await db.collection('emergency_contacts').get();
    console.log(`📋 Found ${snapshot.size} emergency contacts`);
    
    // Remove all emergency contacts
    const deletePromises = [];
    snapshot.forEach(doc => {
      console.log(`- Deleting contact: ${doc.id} (${doc.data().name})`);
      deletePromises.push(doc.ref.delete());
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Successfully deleted ${deletePromises.length} emergency contacts`);
    
  } catch (error) {
    console.error('❌ Error removing emergency contacts:', error);
  }
}

removeEmergencyContacts();