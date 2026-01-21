'use client';

import { useEffect, useState } from 'react';

export function ServiceWorker() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'registering' | 'registered' | 'failed' | 'unavailable'>(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return 'unavailable';
    }
    return 'registering';
  });

  useEffect(() => {
    // Register service worker for both development and production
    if ('serviceWorker' in navigator) {
      console.log('🔧 Registering Service Worker...');

      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          setServiceWorkerStatus('registered');

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, notify user
                  console.log('🔄 New service worker available');
                  // Automatically skip waiting for development
                  if (process.env.NODE_ENV === 'development') {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  } else if (confirm('New version available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Listen for controller change (when new SW takes over)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🎛️ Service Worker controller changed');
            if (process.env.NODE_ENV === 'development') {
              window.location.reload();
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
          setServiceWorkerStatus('failed');
        });
    } else {
      console.warn('⚠️ Service Workers not supported');
      // Don't call setState here - it's already initialized
    }

    // Setup online/offline detection
    const handleOnline = () => {
      console.log('🌐 Back online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📱 Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Development helper: Show status in console
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 Network Status: ${isOnline ? 'Online' : 'Offline'}`);
      console.log(`🔧 Service Worker: ${serviceWorkerStatus}`);
    }
  }, [isOnline, serviceWorkerStatus]);

  return null; // This component doesn't render anything
}
