'use client';

import { useConnectionStatus } from '@/lib/connection-status';

export function OfflineBanner() {
  // This component now only manages connection status through notifications
  // No UI is rendered here - all notifications are handled by the useConnectionStatus hook
  useConnectionStatus();
  
  return null;
}
