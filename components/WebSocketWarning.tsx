'use client';

import { useEffect } from 'react';
import { notificationManager } from '@/components/NotificationManager';
import { useSocketContext } from '@/contexts/SocketContext';

export function WebSocketWarning() {
  const { socket } = useSocketContext();

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

  // This component no longer renders any UI - it only manages WebSocket availability notifications
  return null;
}
