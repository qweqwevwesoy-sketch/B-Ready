const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFirestore() {
  try {
    console.log('Testing Firestore connection...');
    
    // Try to get all documents from emergency_stations collection
    const snapshot = await db.collection('emergency_stations').get();
    console.log('Number of stations:', snapshot.size);
    
    snapshot.forEach(doc => {
      console.log('Station:', doc.id, doc.data());
    });
    
    console.log('✅ Firestore connection successful');
  } catch (error) {
    console.error('❌ Error connecting to Firestore:', error);
  }
}

testFirestore().then(() => {
  console.log('Test complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});