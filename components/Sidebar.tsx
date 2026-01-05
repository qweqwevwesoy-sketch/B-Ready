'use client';

import { useEffect } from 'react';
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

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
    onClose(); 
  };

  if (!user) return null;

  const navItems = [
    { path: '/', label: 'Landing Page', icon: '🏠' },
    { path: '/dashboard', label: 'Home Dashboard', icon: '🏠' },
    { path: '/real-time-map', label: 'Real Time Map', icon: '🗺️' },
    { path: '/profile', label: 'Account Settings', icon: '👤' },
    { path: '/safety-tips', label: 'Safety Tips', icon: '⚠️' },
    ...(user.role === 'admin' ? [{ path: '/status-update', label: 'Status Update', icon: '📊' }] : []),
  ];

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
        }`}
      >
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                <p className="text-sm text-gray-600 bg-primary/10 px-2 py-1 rounded-full inline-block">
                  {user.role === 'admin' ? 'Administrator' : 'Resident'}
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
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
            <button
              onClick={handleLogout}
              className="w-full text-left p-4 rounded-lg transition-all flex items-center gap-3 hover:bg-red-50 text-red-600"
            >
              <span className="text-xl">🚪</span>
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
