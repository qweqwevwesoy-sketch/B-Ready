'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';

export default function LandingPage() {
  const router = useRouter();

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
          <div className="text-6xl mb-6 animate-pulse">🚨</div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">B-READY</h1>
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
          {[
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
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-primary-dark text-white text-center">
        <div className="max-w-4xl mx-auto">
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
    </div>
  );
}
