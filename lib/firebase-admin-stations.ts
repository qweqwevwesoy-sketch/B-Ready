import { firebaseAdminManager } from './firebase-admin-setup';

/**
 * Firebase Admin SDK operations for stations
 * These functions should only be used in server-side code (API routes, scripts)
 */

export const fetchStations = async () => {
  try {
    const db = firebaseAdminManager.getFirestoreInstance();
    const stationsCollection = db.collection('emergency_stations');
    const snapshot = await stationsCollection.orderBy('name', 'asc').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error fetching stations with admin SDK:', error);
    throw new Error('Failed to fetch stations');
  }
};

export const fetchStationById = async (id: string) => {
  try {
    const db = firebaseAdminManager.getFirestoreInstance();
    const stationRef = db.collection('emergency_stations').doc(id);
    const docSnapshot = await stationRef.get();
    
    if (docSnapshot.exists) {
      return { id: docSnapshot.id, ...docSnapshot.data() };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching station by ID with admin SDK:', error);
    throw new Error('Failed to fetch station');
  }
};

export const createStation = async (stationData: any) => {
  try {
    const db = firebaseAdminManager.getFirestoreInstance();
    const stationsCollection = db.collection('emergency_stations');
    
    const newStationData = {
      ...stationData,
      emergencyContacts: stationData.emergencyContacts || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const docRef = await stationsCollection.add(newStationData);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating station with admin SDK:', error);
    throw new Error('Failed to create station');
  }
};

export const updateStation = async (id: string, stationData: any) => {
  try {
    const db = firebaseAdminManager.getFirestoreInstance();
    const stationRef = db.collection('emergency_stations').doc(id);
    
    const updatedData = {
      ...stationData,
      updated_at: new Date().toISOString()
    };
    
    await stationRef.update(updatedData);
  } catch (error) {
    console.error('❌ Error updating station with admin SDK:', error);
    throw new Error('Failed to update station');
  }
};

export const deleteStation = async (id: string) => {
  try {
    const db = firebaseAdminManager.getFirestoreInstance();
    const stationRef = db.collection('emergency_stations').doc(id);
    await stationRef.delete();
  } catch (error) {
    console.error('❌ Error deleting station with admin SDK:', error);
    throw new Error('Failed to delete station');
  }
};