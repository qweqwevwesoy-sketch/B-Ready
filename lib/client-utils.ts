import { auth } from './firebase';

/**
 * Utility functions for client-side only operations
 * These functions check if they're running in a browser environment
 * before accessing browser APIs to avoid SSR errors
 */

// Check if we're running in a browser environment
export const isClientSide = (): boolean => {
  return typeof window !== 'undefined';
};

// Safe localStorage access
export const getLocalStorageItem = (key: string): string | null => {
  if (!isClientSide()) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error accessing localStorage for key ${key}:`, error);
    return null;
  }
};

export const setLocalStorageItem = (key: string, value: string): void => {
  if (!isClientSide()) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting localStorage for key ${key}:`, error);
  }
};

export const removeLocalStorageItem = (key: string): void => {
  if (!isClientSide()) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage for key ${key}:`, error);
  }
};

// Safe navigator.onLine check
export const isOnline = (): boolean => {
  if (!isClientSide()) return true; // Assume online during SSR
  return navigator.onLine;
};

// Safe window event listeners
export const addOnlineEventListener = (callback: () => void): void => {
  if (!isClientSide()) return;
  window.addEventListener('online', callback);
};

export const addOfflineEventListener = (callback: () => void): void => {
  if (!isClientSide()) return;
  window.addEventListener('offline', callback);
};

export const removeOnlineEventListener = (callback: () => void): void => {
  if (!isClientSide()) return;
  window.removeEventListener('online', callback);
};

export const removeOfflineEventListener = (callback: () => void): void => {
  if (!isClientSide()) return;
  window.removeEventListener('offline', callback);
};

// Admin permission checking
export const checkAdminPermissions = async (): Promise<boolean> => {
  if (!isClientSide()) return false;
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    // Get the current user's ID token to check custom claims
    const idTokenResult = await currentUser.getIdTokenResult();
    const isAdmin = idTokenResult.claims.admin === true;
    
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return false;
  }
};

// Get current user (for convenience)
export const getCurrentUser = () => auth.currentUser;

// Sign out user (for convenience)
export const signOutUser = async () => {
  await auth.signOut();
};
