import { Suspense } from 'react';
import { Header } from '@/components/Header';
import BlurredBackground from '@/components/BlurredBackground';
import SafetyTipsContent from './SafetyTipsContent';

export const dynamic = 'force-dynamic';

export default function SafetyTipsPage() {
  return (
    <BlurredBackground>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-lg">Loading safety tips...</div>
          </div>
        }>
          <SafetyTipsContent />
        </Suspense>
      </main>
    </BlurredBackground>
  );
}
