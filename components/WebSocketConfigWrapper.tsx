'use client';

import dynamic from 'next/dynamic';

const WebSocketConfig = dynamic(() => import('./WebSocketConfig'), {
  ssr: false,
  loading: () => null,
});

export default function WebSocketConfigWrapper() {
  return <WebSocketConfig />;
}