'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { notificationManager } from '@/components/NotificationManager';

// Dynamically import MapPicker to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/MapPicker').then(mod => ({ default: mod.MapPicker })), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading map...</p>
        </div>
      </div>
    </div>
  )
});

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateProfile, uploadProfilePicture, changePassword } = useAuth();
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    birthdate: '',
    employeeId: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        address: user.address || '',
        birthdate: user.birthdate || '',
        employeeId: user.employeeId || '',
      });
    }
  }, [user]);

  // Wait for authentication to complete before redirecting
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-xl text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await updateProfile(formData);
      notificationManager.success('Profile updated successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notificationManager.error('Error updating profile: ' + errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notificationManager.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      notificationManager.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);
    try {
      await uploadProfilePicture(file);
      notificationManager.success('Profile picture updated successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notificationManager.error('Error uploading profile picture: ' + errorMessage);
    } finally {
      setUploadingPicture(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangePassword = () => {
    const newPassword = prompt('Enter new password (must be at least 6 characters):');
    if (newPassword && newPassword.length >= 6) {
      changePassword(newPassword)
        .then(() => {
          notificationManager.success('Password updated successfully!');
        })
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          notificationManager.error('Error updating password: ' + errorMessage);
        });
    } else if (newPassword) {
      notificationManager.warning('Password must be at least 6 characters long');
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'url("/Blurred blue blended background.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
          <p className="text-gray-600 mb-8">Manage your personal information and account details.</p>

          <div className="bg-primary/10 p-6 rounded-xl mb-8 border-l-4 border-primary">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user.profilePictureUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.profilePictureUrl}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white"
        onError={(e) => {
          // If Firebase image fails to load due to CORS, try localStorage fallback
          if (typeof window !== 'undefined') {
            const localKey = `profile_pic_${user.uid}`;
            const localPicture = localStorage.getItem(localKey);
            if (localPicture && localPicture !== user.profilePictureUrl) {
              (e.target as HTMLImageElement).src = localPicture;
            } else {
              // Hide the image and show initials instead
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const initialsDiv = parent.querySelector('.initials-fallback') as HTMLElement;
                if (initialsDiv) initialsDiv.style.display = 'flex';
              }
            }
          } else {
            // On server side, just hide the image and show initials
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLElement).parentElement;
            if (parent) {
              const initialsDiv = parent.querySelector('.initials-fallback') as HTMLElement;
              if (initialsDiv) initialsDiv.style.display = 'flex';
            }
          }
        }}
                    />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-2xl initials-fallback hidden">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                  </>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-2xl">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark disabled:opacity-50"
                  title="Change profile picture"
                >
                  {uploadingPicture ? '⏳' : '📷'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{user.firstName} {user.lastName}</h2>
                <p className="text-gray-600">{user.role === 'admin' ? 'Administrator' : 'Resident'}</p>
                {uploadingPicture && (
                  <p className="text-sm text-primary mt-1">Uploading profile picture...</p>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.address}
                  readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="px-4 py-3 bg-primary text-white rounded-lg hover:opacity-90"
                >
                  📍 Map
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Birthdate</label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Account Type</label>
              <input
                type="text"
                value={user.role === 'admin' ? 'Administrator' : 'Resident'}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            {user.role === 'admin' && (
              <div>
                <label className="block text-sm font-semibold mb-2">Employee ID</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {formLoading ? 'Updating...' : 'Update Profile'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Back to Dashboard
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-bold mb-4">Location Settings</h3>
            <p className="text-gray-600 mb-4">If your automatic location detection is inaccurate, you can manually set your location here.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLocationPicker(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                📍 Set Location Manually
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This helps ensure emergency reports are submitted with accurate location data.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-bold mb-4">Account Security</h3>
            <div className="flex gap-4">
              <button
                onClick={handleChangePassword}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </main>

      {showMapPicker && (
        <MapPicker
          onSelect={(address) => {
            setFormData({ ...formData, address });
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {showLocationPicker && (
        <MapPicker
          onSelect={(address) => {
            // Store the manually selected location for future use
            const locationMatch = address.match(/Lat:\s*(-?\d+\.\d+),\s*Lng:\s*(-?\d+\.\d+)/);
            if (locationMatch) {
              const lat = parseFloat(locationMatch[1]);
              const lng = parseFloat(locationMatch[2]);
              setCurrentLocation({ lat, lng });
              // Store in localStorage for future location requests (only on client side)
              if (typeof window !== 'undefined') {
                localStorage.setItem('user_manual_location', JSON.stringify({ lat, lng, address }));
              }
              notificationManager.success('Location saved! Future reports will use this location.');
            }
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}
