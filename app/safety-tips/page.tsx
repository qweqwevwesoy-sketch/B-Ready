'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import type { SafetyTip, EmergencyKitItem } from '@/types';
import { SafetyTipsAdmin } from '@/components/SafetyTipsAdmin';

export default function SafetyTipsPage() {
  const { user } = useAuth();
  const [tips, setTips] = useState<SafetyTip[]>([]);
  const [emergencyKit, setEmergencyKit] = useState<EmergencyKitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const fetchSafetyTips = async () => {
    try {
      const response = await fetch('/api/safety-tips');
      const data = await response.json();
      if (data.success) {
        setTips(data.tips);
        setEmergencyKit(data.emergencyKit);

        // Cache data locally for offline access
        try {
          localStorage.setItem('bready_safety_tips', JSON.stringify(data.tips));
          localStorage.setItem('bready_emergency_kit', JSON.stringify(data.emergencyKit));
        } catch (storageError) {
          console.warn('Failed to cache safety tips locally:', storageError);
        }
      }
    } catch (error) {
      console.error('Error fetching safety tips:', error);

      // Try to load from local cache
      try {
        const cachedTips = localStorage.getItem('bready_safety_tips');
        const cachedKit = localStorage.getItem('bready_emergency_kit');

        if (cachedTips && cachedKit) {
          setTips(JSON.parse(cachedTips));
          setEmergencyKit(JSON.parse(cachedKit));
          console.log('✅ Loaded safety tips from local cache');
        }
      } catch (cacheError) {
        console.error('Error loading from cache:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyTips();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-lg">Loading safety tips...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <h1 className="text-4xl font-bold mb-4">Safety Tips</h1>
          <p className="text-gray-600 text-lg mb-8">
            Essential safety information for various emergency situations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {tips.map((tip, idx) => (
              <div
                key={idx}
                className="bg-white border-l-4 border-primary rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{tip.icon}</div>
                <h3 className="text-xl font-bold mb-4">{tip.title}</h3>
                <ul className="space-y-2">
                  {tip.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2">
                      <span className="text-green-500 font-bold mt-1">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Emergency Kit Checklist</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {emergencyKit.map((kitItem) => (
                <div key={kitItem.id}>
                  <h3 className="text-xl font-semibold mb-4">{kitItem.title}</h3>
                  <ul className="space-y-2">
                    {kitItem.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Controls */}
          {user?.role === 'admin' && (
            <div className="mt-8">
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {showAdminPanel ? 'Hide' : 'Show'} Admin Panel
              </button>

              {showAdminPanel && (
                <SafetyTipsAdmin
                  tips={tips}
                  emergencyKit={emergencyKit}
                  onRefresh={fetchSafetyTips}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
