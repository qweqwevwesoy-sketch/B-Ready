'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the map component to avoid SSR issues
const RealTimeMapPage = dynamic(() => import('./RealTimeMapContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <img
          src="/BLogo.png"
          alt="B-READY Logo"
          className="w-16 h-16 mx-auto mb-4 animate-pulse"
        />
        <p>Loading map...</p>
      </div>
    </div>
  )
});

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img
            src="/BLogo.png"
            alt="B-READY Logo"
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <RealTimeMapPage />
    </Suspense>
  );
}
