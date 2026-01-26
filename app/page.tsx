'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { FAB } from '@/components/FAB';
import { ChatBox } from '@/components/ChatBox';
import { categories } from '@/lib/categories';
import type { Category } from '@/types';

export default function LandingPage() {
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [showChatbox, setShowChatbox] = useState(false);
  const [currentReportChat, setCurrentReportChat] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="text-center text-white z-10 max-w-4xl px-4">
          <img
            src="/BLogo.png"
            alt="B-READY Logo"
            className="w-24 h-24 mx-auto mb-6 animate-pulse"
          />
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            B-READY
          </h1>
          <p className="text-2xl md:text-3xl mb-6 opacity-90">
            Barangay Disaster Reporting & Response System
          </p>
          <p className="text-lg md:text-xl mb-8 opacity-80">
            Real-time emergency reporting, community coordination, and rapid response for a safer barangay.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-white text-primary rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              🚀 Get Started
            </button>
            <button
              onClick={() => router.push('/safety-tips')}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              🛡️ View Safety Tips
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              📋 Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {
            [
              { icon: '⚡', title: 'Instant Reporting', desc: 'Report emergencies in seconds with location sharing and photo uploads.' },
              { icon: '👥', title: 'Community-Driven', desc: 'Built for residents by residents. Collaborate with neighbors and officials.' },
              { icon: '🌐', title: 'Multi-Language', desc: 'Available in English, Filipino, and Cebuano for effective communication.' },
              { icon: '📊', title: 'Real-Time Updates', desc: 'Track report status, receive updates, and stay informed about emergencies.' },
              { icon: '🛡️', title: 'Safety First', desc: 'Access safety tips, emergency contacts, and preparedness guides.' },
              { icon: '📱', title: 'Mobile-Friendly', desc: 'Works perfectly on any device. No app download required.' },
            ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-primary-dark text-white text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("/background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px) brightness(0.6)',
          opacity: 0.3,
          zIndex: 0
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          zIndex: 1
        }} />
        <div className="relative z-20 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to Make Your Barangay Safer?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of residents using B-READY for emergency reporting and response.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-10 py-4 bg-white text-primary rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            🚨 Start Protecting Your Community
          </button>
        </div>
      </section>

      {/* Floating Action Button for Anonymous Emergency Reporting */}
      <FAB onCategorySelect={(category) => {
        setSelectedCategory(category);
        setShowChatbox(true);
        setCurrentReportChat(`anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      }} />

      {/* ChatBox for Anonymous Users */}
      {showChatbox && (
        <ChatBox
          reportId={currentReportChat}
          category={selectedCategory}
          onClose={() => {
            setShowChatbox(false);
            setCurrentReportChat(null);
            setSelectedCategory(null);
          }}
          onSendMessage={(text) => {
            // Handle anonymous message sending
            console.log('Anonymous message:', text);
          }}
          onSendImage={(imageData) => {
            // Handle anonymous image sending
            console.log('Anonymous image sent');
          }}
          isAnonymous={true}
        />
      )}

      {/* Offline Message Overlay */}
      {isOffline && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Can't open page
            </h2>
              <p className="text-gray-600 mb-6">
              Your phone is not connected to the internet. You can still access Safety Tips and emergency reporting features.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/safety-tips')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                🛡️ View Safety Tips
              </button>
              <button
                onClick={() => setIsOffline(false)}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}