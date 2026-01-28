import { useEffect, useState } from 'react';
import { notificationManager } from '@/components/NotificationManager';
import { isOnline } from './client-utils';
import { useSocketContext } from '@/contexts/SocketContext';

/**
 * Hook to manage connection status and display appropriate notifications
 */
export function useConnectionStatus() {
  const [isOffline, setIsOffline] = useState(() => !isOnline());
  const { socket } = useSocketContext();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Show success notification when connection is restored
      notificationManager.success('Connection restored! All features are now available.', 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      // Show warning notification when connection is lost
      notificationManager.warning('You are currently offline. Some features may be limited, but you can still access Safety Tips and emergency reporting.', 5000);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Check WebSocket availability for Render deployments
  useEffect(() => {
    const checkWebSocketAvailability = () => {
      const isRenderDeployment = typeof window !== 'undefined' && 
                                window.location.hostname.includes('onrender.com');
      
      if (isRenderDeployment && socket === null) {
        // Show warning notification for WebSocket unavailability
        notificationManager.warning(
          'Real-time features are disabled on this deployment. The app will work in offline mode. For full functionality, use the local development server or a deployment with WebSocket support.',
          5000
        );
      }
    };

    // Check immediately and set up interval to recheck
    checkWebSocketAvailability();
    const interval = setInterval(checkWebSocketAvailability, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [socket]);

  return {
    isOffline,
    isWebSocketAvailable: socket !== null
  };
}