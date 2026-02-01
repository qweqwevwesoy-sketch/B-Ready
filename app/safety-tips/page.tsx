import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { LoadingScreen } from '@/components/LoadingScreen';
import SafetyTipsContent from './SafetyTipsContent';

export const dynamic = 'force-dynamic';

export default function SafetyTipsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<LoadingScreen />}>
          <SafetyTipsContent />
        </Suspense>
      </main>
    </div>
  );
}