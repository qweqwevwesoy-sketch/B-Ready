import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';
import type { SafetyTip, EmergencyKitItem, EmergencyContact } from '@/types';

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