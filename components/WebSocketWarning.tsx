'use client';

import { useSocketContext } from '@/contexts/SocketContext';

export function WebSocketWarning() {
  const { socket, connected } = useSocketContext();

  // Check if we're on Render deployment and WebSocket is not available
  const showWarning = typeof window !== 'undefined' &&
                      window.location.hostname.includes('onrender.com') &&
                      socket === null;

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg z-50 max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <div className="text-yellow-600 text-xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1">WebSocket Not Available</h3>
          <p className="text-xs text-gray-600 mb-2">
            Real-time features are disabled on this deployment. The app will work in offline mode.
          </p>
          <p className="text-xs text-gray-500">
            For full functionality, use the local development server or a deployment with WebSocket support.
          </p>
        </div>
      </div>
    </div>
  );
}
