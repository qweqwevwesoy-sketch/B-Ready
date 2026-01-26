'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path, 'User:', user);
    // Allow direct navigation to profile for authenticated users
    if (user) {
      router.push(path);
    } else {
      // If not authenticated, redirect to login
      router.push('/login');
    }
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
    onClose();
  };

  if (!user) return null;

  // When offline, only show Safety Tips
  const mainNavItems = isOffline ? [
    { path: '/safety-tips', label: 'Safety Tips', icon: '⚠️' },
  ] : [
    { path: '/dashboard', label: 'Home Dashboard', icon: '🏠' },
    { path: '/real-time-map', label: 'Real Time Map', icon: '🗺️' },
    { path: '/profile', label: 'Account Settings', icon: '👤' },
    { path: '/safety-tips', label: 'Safety Tips', icon: '⚠️' },
    ...(user.role === 'admin' ? [{ path: '/status-update', label: 'Status Update', icon: '📊' }] : []),
  ];

  // Bottom items (always visible)
  const bottomNavItems = [];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-lg shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* Top section - fixed to top */}
        <div className="flex-shrink-0">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Menu</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg mb-6 border-l-4 border-primary">
              <div className="flex items-center gap-3">
                {user.profilePictureUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.profilePictureUrl}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                      onError={(e) => {
                        // If Firebase image fails to load due to CORS, try localStorage fallback
                        const localKey = `profile_pic_${user.uid}`;
                        const localPicture = localStorage.getItem(localKey);
                        if (localPicture && localPicture !== user.profilePictureUrl) {
                          (e.target as HTMLImageElement).src = localPicture;
                        } else {
                          // Hide the image and show initials instead
                          (e.target as HTMLElement).style.display = 'none';
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            const initialsDiv = parent.querySelector('.sidebar-initials-fallback') as HTMLElement;
                            if (initialsDiv) initialsDiv.style.display = 'flex';
                          }
                        }
                      }}
                    />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg sidebar-initials-fallback hidden">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                  </>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-gray-600 bg-primary/10 px-2 py-1 rounded-full inline-block">
                    {user.role === 'admin' ? 'Administrator' : 'Resident'}
                  </p>
                </div>
              </div>
            </div>

            {/* Main navigation items */}
            <nav className="space-y-2">
              {mainNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full text-left p-4 rounded-lg transition-all flex items-center gap-3 ${
                    pathname === item.path
                      ? 'bg-primary/15 text-primary border-l-4 border-primary'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom section - fixed to bottom */}
        <div className="flex-shrink-0 mt-auto p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-left p-4 rounded-lg transition-all flex items-center gap-3 hover:bg-red-50 text-red-600"
          >
            <span className="text-xl">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
