'use client';

import { useState, useEffect } from 'react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {

    const handleOnline = () => {
      setIsOffline(false);
      setShowBanner(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
        isOffline
          ? 'bg-red-600 text-white'
          : 'bg-green-600 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">
              {isOffline ? '📱' : '🌐'}
            </span>
            <div>
              <p className="font-semibold">
                {isOffline
                  ? 'You are currently offline'
                  : 'Connection restored!'}
              </p>
              <p className="text-sm opacity-90">
                {isOffline
                  ? 'Some features may be limited, but you can still access Safety Tips and emergency reporting.'
                  : 'All features are now available.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Close banner"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  );
}
