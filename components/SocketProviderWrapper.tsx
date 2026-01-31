'use client';

import { OptimizedSocketProvider } from '@/contexts/OptimizedSocketContext';

export default function SocketProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <OptimizedSocketProvider>
      {children}
    </OptimizedSocketProvider>
  );
}