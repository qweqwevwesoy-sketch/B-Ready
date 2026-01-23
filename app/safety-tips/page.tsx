'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import type { SafetyTip, EmergencyKitItem } from '@/types';
import { SafetyTipsAdmin } from '@/components/SafetyTipsAdmin';

// Default offline safety tips data
const DEFAULT_SAFETY_TIPS: SafetyTip[] = [
  {
    id: 'tip_1',
    icon: '🌊',
    title: 'Flood Safety',
    items: [
      'Move to higher ground immediately when flooding occurs',
      'Keep emergency supplies ready',
      'Avoid walking or driving through floodwaters',
      'Disconnect electrical appliances',
    ],
    category: 'disaster',
    order: 1,
    updated_at: new Date().toISOString()
  },
  {
    id: 'tip_2',
    icon: '🔥',
    title: 'Fire Safety',
    items: [
      'Install smoke alarms and check regularly',
      'Keep fire extinguishers accessible',
      'Never leave cooking unattended',
      'Know your escape routes',
    ],
    category: 'disaster',
    order: 2,
    updated_at: new Date().toISOString()
  },
  {
    id: 'tip_3',
    icon: '🌋',
    title: 'Earthquake Safety',
    items: [
      'Drop, cover, and hold on during shaking',
      'Stay away from windows and heavy objects',
      'Prepare a family emergency plan',
      'Evacuate if building is unsafe',
    ],
    category: 'disaster',
    order: 3,
    updated_at: new Date().toISOString()
  },
  {
    id: 'tip_4',
    icon: '🌀',
    title: 'Typhoon Safety',
    items: [
      'Secure your home and outdoor items',
      'Monitor weather updates',
      'Evacuate early if advised',
      'Keep emergency contacts handy',
    ],
    category: 'disaster',
    order: 4,
    updated_at: new Date().toISOString()
  },
  {
    id: 'tip_5',
    icon: '🚨',
    title: 'General Preparedness',
    items: [
      'Know evacuation routes and centers',
      'Keep important documents waterproof',
      'Help neighbors, especially elderly',
      'Report hazards immediately',
    ],
    category: 'disaster',
    order: 5,
    updated_at: new Date().toISOString()
  },
  {
    id: 'tip_6',
    icon: '📱',
    title: 'Digital Safety',
    items: [
      'Keep phone charged during emergencies',
      'Save emergency numbers',
      'Use B-READY for quick reporting',
      'Share location with trusted contacts',
    ],
    category: 'disaster',
    order: 6,
    updated_at: new Date().toISOString()
  },
];

const DEFAULT_EMERGENCY_KIT: EmergencyKitItem[] = [
  {
    id: 'kit_1',
    title: 'Essential Items',
    items: [
      'Water (1 gallon per person per day)',
      'Non-perishable food',
      'First aid kit',
      'Flashlight with batteries',
    ],
    order: 1,
    updated_at: new Date().toISOString()
  },
  {
    id: 'kit_2',
    title: 'Important Documents',
    items: [
      'Identification cards',
      'Medical records',
      'Emergency contacts',
      'Insurance policies',
    ],
    order: 2,
    updated_at: new Date().toISOString()
  },
  {
    id: 'kit_3',
    title: 'Additional Supplies',
    items: [
      'Prescription medications',
      'Personal hygiene items',
      'Multi-tool or knife',
      'Portable phone charger',
    ],
    order: 3,
    updated_at: new Date().toISOString()
  },
];

export default function SafetyTipsPage() {
  const { user } = useAuth();
  const [tips, setTips] = useState<SafetyTip[]>(DEFAULT_SAFETY_TIPS);
  const [emergencyKit, setEmergencyKit] = useState<EmergencyKitItem[]>(DEFAULT_EMERGENCY_KIT);
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
      console.error('Error fetching safety tips from API:', error);

      // Try to load from local cache first
      try {
        const cachedTips = localStorage.getItem('bready_safety_tips');
        const cachedKit = localStorage.getItem('bready_emergency_kit');

        if (cachedTips && cachedKit) {
          setTips(JSON.parse(cachedTips));
          setEmergencyKit(JSON.parse(cachedKit));
          console.log('✅ Loaded safety tips from local cache');
        } else {
          // No cached data, use defaults (already set as initial state)
          console.log('ℹ️ Using default safety tips (no cache available)');
        }
      } catch (cacheError) {
        console.error('Error loading from cache:', cacheError);
        // Keep default data (already set as initial state)
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

          {/* Emergency Contacts */}
          <div className="bg-blue-50 rounded-xl p-8 mt-8">
            <h2 className="text-2xl font-bold mb-6">🚨 Emergency Contacts</h2>
            <p className="text-gray-600 mb-6">
              Important emergency phone numbers in the Philippines. Call these numbers immediately in case of emergency.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-3">🚒</div>
                <h3 className="text-lg font-bold mb-2">Bureau of Fire Protection</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manila:</span>
                    <a href="tel:161" className="text-blue-600 font-semibold hover:underline">161</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cebu:</span>
                    <a href="tel:117" className="text-blue-600 font-semibold hover:underline">117</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Davao:</span>
                    <a href="tel:118" className="text-blue-600 font-semibold hover:underline">118</a>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-3">👮</div>
                <h3 className="text-lg font-bold mb-2">Philippine National Police</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">National Hotline:</span>
                    <a href="tel:911" className="text-blue-600 font-semibold hover:underline">911</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manila Police:</span>
                    <a href="tel:117" className="text-blue-600 font-semibold hover:underline">117</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Text Hotline:</span>
                    <span className="text-gray-500">2920</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-3">🚑</div>
                <h3 className="text-lg font-bold mb-2">Emergency Medical Services</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Red Cross:</span>
                    <a href="tel:143" className="text-blue-600 font-semibold hover:underline">143</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DOH Emergency:</span>
                    <a href="tel:16000" className="text-blue-600 font-semibold hover:underline">16000</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">PhilHealth:</span>
                    <a href="tel:1551" className="text-blue-600 font-semibold hover:underline">1551</a>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-3">🌊</div>
                <h3 className="text-lg font-bold mb-2">Coast Guard & Maritime</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coast Guard:</span>
                    <a href="tel:722-3894" className="text-blue-600 font-semibold hover:underline">722-3894</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maritime Distress:</span>
                    <a href="tel:167" className="text-blue-600 font-semibold hover:underline">167</a>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-lg font-bold mb-2">Utility Emergencies</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Meralco:</span>
                    <a href="tel:16211" className="text-blue-600 font-semibold hover:underline">16211</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maynilad:</span>
                    <a href="tel:1627" className="text-blue-600 font-semibold hover:underline">1627</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manila Water:</span>
                    <a href="tel:1608" className="text-blue-600 font-semibold hover:underline">1608</a>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-3">📞</div>
                <h3 className="text-lg font-bold mb-2">General Emergency</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unified Hotline:</span>
                    <a href="tel:911" className="text-blue-600 font-semibold hover:underline">911</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Smart/TNT:</span>
                    <a href="tel:112" className="text-blue-600 font-semibold hover:underline">112</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Globe/TM:</span>
                    <a href="tel:117" className="text-blue-600 font-semibold hover:underline">117</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Emergency Tips</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Always dial emergency numbers from a safe location</li>
                    <li>• Provide clear details: what happened, where, and how many people are affected</li>
                    <li>• Stay on the line until help arrives or you're told to hang up</li>
                    <li>• If possible, send your location coordinates</li>
                  </ul>
                </div>
              </div>
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
