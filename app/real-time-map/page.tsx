'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

// Dynamically import the map component to avoid SSR issues
const RealTimeMapPage = dynamic(() => import('./RealTimeMapContent'), {
  ssr: false,
  loading: () => <LoadingScreen />
});

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RealTimeMapPage />
    </Suspense>
  );
}