import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';
import type { SafetyTip, EmergencyKitItem, EmergencyContact, Station, Report } from '@/types';

// Safety Tips Firestore operations
export const safetyTipsCollection = collection(db, 'safety_tips');

export const createSafetyTip = async (tip: Omit<SafetyTip, 'id' | 'updated_at'>): Promise<string> => {
  try {
    const docRef = await addDoc(safetyTipsCollection, {
      ...tip,
      updated_at: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating safety tip:', error);
    throw new Error('Failed to create safety tip');
  }
};

export const updateSafetyTip = async (id: string, tip: Partial<SafetyTip>): Promise<void> => {
  try {
    if (!id || id.trim() === '') {
      throw new Error('Safety tip ID cannot be empty');
    }
    
    const tipRef = doc(safetyTipsCollection, id);
    await updateDoc(tipRef, {
      ...tip,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating safety tip:', error);
    throw new Error('Failed to update safety tip');
  }
};

export const deleteSafetyTip = async (id: string): Promise<void> => {
  try {
    const tipRef = doc(safetyTipsCollection, id);
    await deleteDoc(tipRef);
  } catch (error) {
    console.error('Error deleting safety tip:', error);
    throw new Error('Failed to delete safety tip');
  }
};

export const fetchSafetyTips = async (): Promise<SafetyTip[]> => {
  try {
    const q = query(safetyTipsCollection, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    const tips: SafetyTip[] = [];
    
    querySnapshot.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() } as SafetyTip);
    });
    
    return tips;
  } catch (error) {
    console.error('Error fetching safety tips:', error);
    throw new Error('Failed to fetch safety tips');
  }
};

// Emergency Kit Items Firestore operations
export const emergencyKitCollection = collection(db, 'emergency_kit_items');

export const createEmergencyKitItem = async (item: Omit<EmergencyKitItem, 'id' | 'updated_at'>): Promise<string> => {
  try {
    const docRef = await addDoc(emergencyKitCollection, {
      ...item,
      updated_at: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating emergency kit item:', error);
    throw new Error('Failed to create emergency kit item');
  }
};

export const updateEmergencyKitItem = async (id: string, item: Partial<EmergencyKitItem>): Promise<void> => {
  try {
    const itemRef = doc(emergencyKitCollection, id);
    await updateDoc(itemRef, {
      ...item,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating emergency kit item:', error);
    throw new Error('Failed to update emergency kit item');
  }
};

export const deleteEmergencyKitItem = async (id: string): Promise<void> => {
  try {
    const itemRef = doc(emergencyKitCollection, id);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error('Error deleting emergency kit item:', error);
    throw new Error('Failed to delete emergency kit item');
  }
};

export const fetchEmergencyKitItems = async (): Promise<EmergencyKitItem[]> => {
  try {
    const q = query(emergencyKitCollection, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    const items: EmergencyKitItem[] = [];
    
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as EmergencyKitItem);
    });
    
    return items;
  } catch (error) {
    console.error('Error fetching emergency kit items:', error);
    throw new Error('Failed to fetch emergency kit items');
  }
};

// Emergency Contacts Firestore operations
export const emergencyContactsCollection = collection(db, 'emergency_contacts');

export const createEmergencyContact = async (contact: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    const docRef = await addDoc(emergencyContactsCollection, {
      ...contact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating emergency contact:', error);
    throw new Error('Failed to create emergency contact');
  }
};

export const updateEmergencyContact = async (id: string, contact: Partial<EmergencyContact>): Promise<void> => {
  try {
    const contactRef = doc(emergencyContactsCollection, id);
    await updateDoc(contactRef, {
      ...contact,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    throw new Error('Failed to update emergency contact');
  }
};

export const deleteEmergencyContact = async (id: string): Promise<void> => {
  try {
    const contactRef = doc(emergencyContactsCollection, id);
    await deleteDoc(contactRef);
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    throw new Error('Failed to delete emergency contact');
  }
};

export const fetchEmergencyContacts = async (): Promise<EmergencyContact[]> => {
  try {
    const q = query(emergencyContactsCollection, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const contacts: EmergencyContact[] = [];
    
    querySnapshot.forEach((doc) => {
      contacts.push({ id: doc.id, ...doc.data() } as EmergencyContact);
    });
    
    return contacts;
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    throw new Error('Failed to fetch emergency contacts');
  }
};

// Stations Firestore operations
export const stationsCollection = collection(db, 'emergency_stations');

export const createStation = async (station: Omit<Station, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    const docRef = await addDoc(stationsCollection, {
      ...station,
      emergencyContacts: station.emergencyContacts || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating station:', error);
    throw new Error('Failed to create station');
  }
};

export const updateStation = async (id: string, station: Partial<Station>): Promise<void> => {
  try {
    if (!id || id.trim() === '') {
      throw new Error('Station ID cannot be empty');
    }
    
    const stationRef = doc(stationsCollection, id);
    await updateDoc(stationRef, {
      ...station,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating station:', error);
    throw new Error('Failed to update station');
  }
};

export const deleteStation = async (id: string): Promise<void> => {
  try {
    const stationRef = doc(stationsCollection, id);
    await deleteDoc(stationRef);
  } catch (error) {
    console.error('Error deleting station:', error);
    throw new Error('Failed to delete station');
  }
};

export const fetchStations = async (): Promise<Station[]> => {
  try {
    const q = query(stationsCollection, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const stations: Station[] = [];
    
    querySnapshot.forEach((doc) => {
      stations.push({ id: doc.id, ...doc.data() } as Station);
    });
    
    return stations;
  } catch (error) {
    console.error('Error fetching stations:', error);
    throw new Error('Failed to fetch stations');
  }
};

export const fetchStationById = async (id: string): Promise<Station | null> => {
  try {
    if (!id || id.trim() === '') {
      throw new Error('Station ID cannot be empty');
    }
    
    const stationRef = doc(stationsCollection, id);
    const docSnapshot = await getDoc(stationRef);
    
    if (docSnapshot.exists()) {
      return { id: docSnapshot.id, ...docSnapshot.data() } as Station;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching station by ID:', error);
    throw new Error('Failed to fetch station by ID');
  }
};

export const fetchStationsByType = async (type: Station['type']): Promise<Station[]> => {
  try {
    const q = query(stationsCollection, where('type', '==', type), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const stations: Station[] = [];
    
    querySnapshot.forEach((doc) => {
      stations.push({ id: doc.id, ...doc.data() } as Station);
    });
    
    return stations;
  } catch (error) {
    console.error('Error fetching stations by type:', error);
    throw new Error('Failed to fetch stations by type');
  }
};

export const fetchStationsByStatus = async (status: Station['status']): Promise<Station[]> => {
  try {
    const q = query(stationsCollection, where('status', '==', status), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const stations: Station[] = [];
    
    querySnapshot.forEach((doc) => {
      stations.push({ id: doc.id, ...doc.data() } as Station);
    });
    
    return stations;
  } catch (error) {
    console.error('Error fetching stations by status:', error);
    throw new Error('Failed to fetch stations by status');
  }
};

// Emergency Contacts operations (now part of stations)
export const addEmergencyContactToStation = async (stationId: string, contact: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
  try {
    const stationRef = doc(stationsCollection, stationId);
    const stationSnapshot = await getDoc(stationRef);
    
    if (!stationSnapshot.exists()) {
      throw new Error('Station not found');
    }
    
    const station = stationSnapshot.data() as Station;
    const newContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const updatedContacts = [...(station.emergencyContacts || []), newContact];
    
    await updateDoc(stationRef, {
      emergencyContacts: updatedContacts,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding emergency contact to station:', error);
    throw new Error('Failed to add emergency contact');
  }
};

export const updateEmergencyContactInStation = async (stationId: string, contactId: string, contact: Partial<EmergencyContact>): Promise<void> => {
  try {
    const stationRef = doc(stationsCollection, stationId);
    const stationSnapshot = await getDoc(stationRef);
    
    if (!stationSnapshot.exists()) {
      throw new Error('Station not found');
    }
    
    const station = stationSnapshot.data() as Station;
    const updatedContacts = (station.emergencyContacts || []).map(c => 
      c.id === contactId ? { ...c, ...contact, updated_at: new Date().toISOString() } : c
    );
    
    await updateDoc(stationRef, {
      emergencyContacts: updatedContacts,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating emergency contact in station:', error);
    throw new Error('Failed to update emergency contact');
  }
};

export const deleteEmergencyContactFromStation = async (stationId: string, contactId: string): Promise<void> => {
  try {
    const stationRef = doc(stationsCollection, stationId);
    const stationSnapshot = await getDoc(stationRef);
    
    if (!stationSnapshot.exists()) {
      throw new Error('Station not found');
    }
    
    const station = stationSnapshot.data() as Station;
    const updatedContacts = (station.emergencyContacts || []).filter(c => c.id !== contactId);
    
    await updateDoc(stationRef, {
      emergencyContacts: updatedContacts,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting emergency contact from station:', error);
    throw new Error('Failed to delete emergency contact');
  }
};

export const fetchEmergencyContactsByStation = async (stationId: string): Promise<EmergencyContact[]> => {
  try {
    const stationRef = doc(stationsCollection, stationId);
    const stationSnapshot = await getDoc(stationRef);
    
    if (!stationSnapshot.exists()) {
      throw new Error('Station not found');
    }
    
    const station = stationSnapshot.data() as Station;
    return station.emergencyContacts || [];
  } catch (error) {
    console.error('Error fetching emergency contacts by station:', error);
    throw new Error('Failed to fetch emergency contacts');
  }
};

// Reports Firestore operations
export const reportsCollection = collection(db, 'reports');

export const createReport = async (report: Partial<Report>): Promise<string> => {
  try {
    const docRef = await addDoc(reportsCollection, {
      ...report,
      timestamp: new Date().toISOString(),
      status: (report.status as string) || 'pending',
    });
    console.log('✅ Report created in Firebase:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to create report in Firebase:', error);
    throw new Error('Failed to create report');
  }
};

export const updateReport = async (id: string, updates: Partial<Report>): Promise<void> => {
  try {
    const reportRef = doc(reportsCollection, id);
    await updateDoc(reportRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Report updated in Firebase:', id);
  } catch (error) {
    console.error('❌ Failed to update report in Firebase:', error);
    throw new Error('Failed to update report');
  }
};

export const fetchReports = async (filters?: { userId?: string; status?: string }): Promise<Report[]> => {
  try {
    let q = query(reportsCollection, orderBy('timestamp', 'desc'));

    if (filters?.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const querySnapshot = await getDocs(q);
    const reports: Report[] = [];

    querySnapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
      } as unknown as Report);
    });

    console.log(`📋 Retrieved ${reports.length} reports from Firebase`);
    return reports;
  } catch (error) {
    console.error('❌ Failed to fetch reports from Firebase:', error);
    throw new Error('Failed to fetch reports');
  }
};

// Messages Firestore operations
export const messagesCollection = collection(db, 'messages');

export const createMessage = async (messageData: {
  reportId: string;
  text: string;
  userName: string;
  userRole: string;
  timestamp: string;
  imageData?: string;
}): Promise<string> => {
  try {
    const docRef = await addDoc(messagesCollection, messageData);
    console.log('✅ Message created in Firebase:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to create message in Firebase:', error);
    throw new Error('Failed to create message');
  }
};

export const fetchMessages = async (reportId: string): Promise<Record<string, unknown>[]> => {
  try {
    const q = query(
      messagesCollection,
      where('reportId', '==', reportId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const messages: Record<string, unknown>[] = [];

    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`💬 Retrieved ${messages.length} messages from Firebase for report ${reportId}`);
    return messages;
  } catch (error) {
    console.error('❌ Failed to fetch messages from Firebase:', error);
    throw new Error('Failed to fetch messages');
  }
};
