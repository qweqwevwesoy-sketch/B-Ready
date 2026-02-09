const admin = require('firebase-admin');
const serviceAccount = require('../b-ready-b7603-firebase-adminsdk-fbsvc-ddf5a334d5.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testAddStation() {
  try {
    console.log('🧪 Testing add station functionality...');
    
    // Test data
    const testStation = {
      name: 'Test Fire Station',
      type: 'fire',
      location: { lat: 14.5995, lng: 120.9842 },
      address: 'Test Address',
      capacity: 50,
      currentLoad: 0,
      status: 'operational',
      contact: '123-456-7890',
      phone: '123-456-7890',
      email: 'test@example.com',
      website: 'https://example.com',
      description: 'Test fire station for emergency response',
      emergencyContacts: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add test station
    const docRef = await db.collection('emergency_stations').add(testStation);
    console.log('✅ Test station added successfully with ID:', docRef.id);
    
    // Verify station was added
    const docSnapshot = await db.collection('emergency_stations').doc(docRef.id).get();
    if (docSnapshot.exists()) {
      console.log('✅ Station verified in Firestore:', docSnapshot.data().name);
    } else {
      console.error('❌ Station not found in Firestore');
    }
    
    // Clean up test station
    await db.collection('emergency_stations').doc(docRef.id).delete();
    console.log('✅ Test station deleted successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAddStation();