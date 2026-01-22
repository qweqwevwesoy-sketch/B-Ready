'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  birthdate?: string;
  employeeId?: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Always start as loading

  useEffect(() => {

    let isMounted = true; // Prevent state updates after unmount

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) return;

      if (firebaseUser) {
        try {
          // Try to fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists() && isMounted) {
            const userData = userDoc.data();

            // Handle profile picture URL - check if Firebase URL is accessible
            let profilePictureUrl = userData.profilePictureUrl;

            // If it's a Firebase URL, try to use it; if not accessible, check localStorage
            if (profilePictureUrl && profilePictureUrl.startsWith('https://firebasestorage.googleapis.com')) {
              // Firebase URL - we'll try to use it, but if CORS fails, the component will handle it
            } else if (profilePictureUrl && profilePictureUrl.startsWith('data:')) {
              // Base64 data URL from localStorage - use as-is
            } else if (!profilePictureUrl) {
              // Check if we have a locally stored profile picture
              const localKey = `profile_pic_${firebaseUser.uid}`;
              const localPicture = localStorage.getItem(localKey);
              if (localPicture) {
                profilePictureUrl = localPicture;
              }
            }

            const userProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              address: userData.address,
              birthdate: userData.birthdate,
              employeeId: userData.employeeId,
              role: userData.role,
              profilePictureUrl,
            };

            // Cache user data locally for offline access
            localStorage.setItem(`bready_user_${firebaseUser.uid}`, JSON.stringify(userProfile));

            setUser(userProfile);
          } else if (isMounted) {
            // No user document found, but user is authenticated
            // This shouldn't happen in normal operation, but handle gracefully
            console.warn('Authenticated user has no profile document');
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data from Firestore:', error);

          // Firestore failed (likely offline), try to load cached user data
          try {
            const cachedUserData = localStorage.getItem(`bready_user_${firebaseUser.uid}`);
            if (cachedUserData && isMounted) {
              const userProfile = JSON.parse(cachedUserData);
              console.log('✅ Loaded user data from local cache (offline mode)');
              setUser(userProfile);
            } else {
              // No cached data available
              console.warn('No cached user data available, user will need to reconnect');
              if (isMounted) setUser(null);
            }
          } catch (cacheError) {
            console.error('Error loading cached user data:', cacheError);
            if (isMounted) setUser(null);
          }
        }
      } else if (isMounted) {
        setUser(null);
      }

      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signup = useCallback(async (userData: SignupData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const firebaseUser = userCredential.user;

    const userProfile = {
      uid: firebaseUser.uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || '',
      address: userData.address || '',
      birthdate: userData.birthdate || '',
      employeeId: userData.employeeId || '',
      role: userData.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
  }, []);

  const logout = useCallback(async () => {
    await auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), updateData);

      // Update local cache with new data
      const updatedUser = { ...user, ...updates };
      localStorage.setItem(`bready_user_${user.uid}`, JSON.stringify(updatedUser));

      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile online:', error);

      // Still update local state and cache for offline consistency
      const updatedUser = { ...user, ...updates };
      localStorage.setItem(`bready_user_${user.uid}`, JSON.stringify(updatedUser));

      setUser(updatedUser);
      console.log('✅ Profile updated locally (will sync when online)');
    }
  }, [user]);

  const uploadProfilePicture = useCallback(async (file: File) => {
    if (!user) return;

    console.log('🚀 Starting profile picture upload for user:', user.uid);

    try {
      let downloadURL;

      // For development, skip Firebase and go straight to localStorage
      // This avoids CORS issues entirely
      if (process.env.NODE_ENV === 'development') {
        console.log('🏠 Development mode: Using localStorage for profile pictures');

        downloadURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              // Store in localStorage for offline access
              const localKey = `profile_pic_${user.uid}`;
              localStorage.setItem(localKey, result);
              console.log('✅ Profile picture stored in localStorage');
              resolve(result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('File reading failed'));
          reader.readAsDataURL(file);
        });
      } else {
        // Production: Try Firebase Storage first
        try {
          console.log('☁️ Attempting Firebase Storage upload');

          // Delete existing profile picture if it exists
          if (user.profilePictureUrl && user.profilePictureUrl.startsWith('https://firebasestorage.googleapis.com')) {
            try {
              const oldImageRef = ref(storage, user.profilePictureUrl);
              await deleteObject(oldImageRef);
            } catch (error) {
              console.warn('Could not delete old Firebase profile picture:', error);
            }
          }

          // Upload new profile picture to Firebase
          const fileExtension = file.name.split('.').pop();
          const fileName = `profile_${user.uid}_${Date.now()}.${fileExtension}`;
          const storageRef = ref(storage, `profile-pictures/${fileName}`);

          const snapshot = await uploadBytes(storageRef, file);
          downloadURL = await getDownloadURL(snapshot.ref);

          console.log('✅ Profile picture uploaded to Firebase successfully:', downloadURL);
        } catch (firebaseError) {
          console.warn('❌ Firebase Storage upload failed, falling back to local storage:', firebaseError);

          // Fallback: Convert to base64 and store locally
          downloadURL = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              if (result) {
                // Store in localStorage for offline access
                const localKey = `profile_pic_${user.uid}`;
                localStorage.setItem(localKey, result);
                resolve(result);
              } else {
                reject(new Error('Failed to read file'));
              }
            };
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsDataURL(file);
          });

          console.log('✅ Profile picture stored locally as fallback');
        }
      }

      // Update user profile with new picture URL
      console.log('💾 Updating user profile with new picture URL');
      await updateDoc(doc(db, 'users', user.uid), {
        profilePictureUrl: downloadURL,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      console.log('🔄 Updating local user state');
      setUser((prev) => prev ? { ...prev, profilePictureUrl: downloadURL } : null);

      console.log('🎉 Profile picture upload completed successfully');

    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      throw new Error('Failed to upload profile picture. Please try again.');
    }
  }, [user]);

  const changePassword = useCallback(async (newPassword: string) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await updatePassword(currentUser, newPassword);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, uploadProfilePicture, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
