import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { EmergencyContacts } from '@/components/EmergencyContacts';

export const dynamic = 'force-dynamic';

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-lg">Loading emergency contacts...</div>
          </div>
        }>
          <EmergencyContacts variant="safety-tips" />
        </Suspense>
      </main>
    </div>
  );
}