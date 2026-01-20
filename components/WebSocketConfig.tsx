'use client';

import { useEffect, useState } from 'react';

export default function WebSocketConfig() {
  const [wsUrl, setWsUrl] = useState(() => {
    // Initialize with saved WebSocket URL
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bready_websocket_url') || '';
    }
    return '';
  });
  const [saved, setSaved] = useState(false);

  const saveWebSocketUrl = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bready_websocket_url', wsUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Reload page to apply new WebSocket URL
      window.location.reload();
    }
  };

  // Only show this component when running on ngrok
  if (typeof window === 'undefined' || !window.location.hostname.includes('ngrok.io')) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">🌐 WebSocket Configuration</h3>
      <p className="text-xs text-gray-600 mb-3">
        For global access, configure the WebSocket server URL from your ngrok WebSocket tunnel:
      </p>
      <input
        type="url"
        value={wsUrl}
        onChange={(e) => setWsUrl(e.target.value)}
        placeholder="https://xxxxx.ngrok.io"
        className="w-full px-2 py-1 text-sm border rounded mb-2"
      />
      <p className="text-xs text-blue-600 mb-2">
        💡 Copy the HTTPS URL from your "Ngrok WebSocket Tunnel" window
      </p>
      <button
        onClick={saveWebSocketUrl}
        className="w-full bg-blue-500 text-white text-sm py-1 px-3 rounded hover:bg-blue-600"
      >
        {saved ? '✅ Saved!' : 'Save & Reload'}
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Get this URL from your ngrok WebSocket tunnel window.
      </p>
    </div>
  );
}
