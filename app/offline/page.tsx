'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { categories } from '@/lib/categories';
import { offlineService } from '@/lib/offline-service';
import { notificationManager } from '@/components/NotificationManager';
import type { Category } from '@/types';

export default function OfflinePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check if local backend is available
    const checkBackend = async () => {
      const isHealthy = await offlineService.checkLocalBackendHealth();
      setBackendStatus(isHealthy ? 'online' : 'offline');
    };

    checkBackend();
  }, []);

  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    setIsSubmitting(true);

    try {
      // Create anonymous offline report
      const reportData = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: category.name,
        description: `Emergency: ${category.name}`,
        location: null, // Location not available in offline mode
        address: 'Location not available (offline mode)',
        timestamp: new Date().toISOString(),
        userId: undefined,
        userName: 'Anonymous User',
        severity: 'high' as const,
        status: 'pending' as const,
        category: category.name,
        subcategory: category.subcategories[0] || '',
        icon: category.icon,
      };

      const result = await offlineService.createReport(reportData);

      if (result.success) {
        notificationManager.success('Emergency report submitted successfully! It will be synced when connection is restored.');
        router.push('/offline/status');
      } else {
        notificationManager.error('Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting offline report:', error);
      notificationManager.error('Failed to submit report. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusMessage = () => {
    switch (backendStatus) {
      case 'checking':
        return 'Checking local system...';
      case 'online':
        return '✅ Local emergency system ready';
      case 'offline':
        return '❌ Local system unavailable - limited functionality';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      {/* Emergency Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🚨 B-READY Offline Mode</h1>
            <p className="text-red-100 text-sm">Emergency reporting when internet is unavailable</p>
          </div>
          <div className="text-right">
            <div className={`text-sm px-3 py-1 rounded-full ${
              backendStatus === 'online' ? 'bg-green-100 text-green-800' :
              backendStatus === 'offline' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {getStatusMessage()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Alert Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Offline Mode:</strong> This system works without internet connection.
                Reports will be stored locally and synced when connection is restored.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Emergency Reporting Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="font-semibold text-gray-800">1. Select Emergency Type</h3>
                <p className="text-sm text-gray-600">Choose the type of emergency you're reporting</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💾</span>
              <div>
                <h3 className="font-semibold text-gray-800">2. Report is Saved</h3>
                <p className="text-sm text-gray-600">Your report is stored locally on this device</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔄</span>
              <div>
                <h3 className="font-semibold text-gray-800">3. Auto-Sync</h3>
                <p className="text-sm text-gray-600">When online, reports sync automatically</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-semibold text-gray-800">4. Status Updates</h3>
                <p className="text-sm text-gray-600">Check status and receive updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Categories */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Select Emergency Type</h2>

          {backendStatus === 'offline' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                ⚠️ Local system is not available. Reports will be stored in browser memory only.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                disabled={isSubmitting}
                className="w-full p-4 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl transition-all duration-200 text-left flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                  {category.icon}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 group-hover:text-red-700">
                    {category.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {category.subcategories.slice(0, 2).join(', ')}
                    {category.subcategories.length > 2 && '...'}
                  </div>
                </div>
                {isSubmitting && selectedCategory?.id === category.id && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                )}
              </button>
            ))}
          </div>

          {isSubmitting && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                Submitting emergency report...
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>🔒 Your reports are stored securely and will be synced when connection is restored.</p>
          <p className="mt-2">
            <Link href="/" className="text-blue-600 hover:underline">Return to main site</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
