'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedSocketContext } from '@/contexts/OptimizedSocketContext';
import { Header } from '@/components/Header';
import { FAB } from '@/components/FAB';
import { ChatBox } from '@/components/ChatBox';
import { categories } from '@/lib/categories';
import type { Category, Report } from '@/types';
import { getCurrentLocation, reverseGeocode } from '@/lib/utils';
import {
  useOfflineStatus,
  isOnline,
  storeOfflineReport,
  storeOfflineMessage,
  syncOfflineReports
} from '@/lib/offline-manager';
import { notificationManager } from '@/components/NotificationManager';
import { createReport } from '@/lib/firebase-service';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { submitReport, joinReportChat, sendMessage } = useOptimizedSocketContext();
  const isOffline = useOfflineStatus();
  const [showChatbox, setShowChatbox] = useState(false);
  const [currentReportChat, setCurrentReportChat] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [tempReportId, setTempReportId] = useState<string | null>(null);

  // Sync offline reports when coming back online
  useEffect(() => {
    if (!isOffline) {
      const syncReports = async () => {
        const syncedCount = await syncOfflineReports();
        if (syncedCount > 0) {
          notificationManager.success(`Synced ${syncedCount} offline report(s)`);
        }
      };
      
      // Debounce to prevent multiple syncs when online status fluctuates
      const timer = setTimeout(syncReports, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("/background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px) brightness(0.7)',
          opacity: 0.3,
          zIndex: 0
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, transparent 60%, rgba(59, 130, 246, 0.8))',
          zIndex: 0
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          zIndex: 1
        }} />

        <div className="text-center text-white z-10 max-w-4xl px-4">
<img
  src="/Logo.svg"
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

      {/* THE PROBLEM Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">THE PROBLEM</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Graphics */}
          <div className="relative">
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-4 left-4 w-24 h-24 bg-yellow-500 rounded-full opacity-20"></div>
              <div className="absolute bottom-4 right-4 w-20 h-20 bg-yellow-600 rounded-full opacity-20"></div>
              <div className="relative z-10">
                <div className="text-8xl mb-4 text-yellow-600">⚠️</div>
                <div className="w-full h-48 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg opacity-50"></div>
                <div className="mt-4 text-center text-yellow-600 font-semibold">
                  Emergency Response Delays
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Problem Description */}
          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
              <p className="text-lg text-gray-700 leading-relaxed">
                Traditional disaster reporting in barangays relies on slow, manual communication methods that create dangerous delays during emergencies. Residents struggle to quickly report incidents, while responders face challenges in coordinating effective responses due to fragmented information.
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
              <p className="text-lg text-gray-700 leading-relaxed">
                The lack of real-time communication and centralized reporting systems leaves communities vulnerable when every second counts. This gap in emergency response infrastructure can mean the difference between life and death during critical situations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* THE MEANING OF B-READY Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">THE MEANING OF B-READY</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Meaning Description */}
          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
              <p className="text-lg text-gray-700 leading-relaxed">
                B-READY stands for Barangay Disaster Reporting & Response System, representing our commitment to empowering communities with immediate emergency response capabilities. The "B" symbolizes both Barangay and the collective strength of community members working together.
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
              <p className="text-lg text-gray-700 leading-relaxed">
                "READY" reflects our mission to ensure every barangay is prepared, informed, and equipped to handle disasters efficiently. Together, B-READY embodies the spirit of community resilience and technological empowerment.
              </p>
            </div>
          </div>
          
          {/* Right Column - Graphics */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-4 left-4 w-20 h-20 bg-blue-500 rounded-full opacity-20"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-blue-600 rounded-full opacity-20"></div>
              <div className="relative z-10 text-center">
                <div className="text-8xl mb-4 text-blue-600">🛡️</div>
                <div className="text-4xl font-bold text-blue-600 mb-2">B-READY</div>
                <div className="text-sm text-gray-600 uppercase tracking-wider">
                  Community Protection
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PURPOSE & DESCRIPTION Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">PURPOSE & DESCRIPTION</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Purpose & Description */}
          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-primary mb-4">Our Purpose</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                To revolutionize disaster response at the barangay level by providing real-time reporting tools that connect residents directly with emergency responders, ensuring faster, more coordinated responses during critical situations.
              </p>
            </div>

              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-4 left-4 w-20 h-20 bg-blue-500 rounded-full opacity-20"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-blue-600 rounded-full opacity-20"></div>
              <div className="relative z-10">
                <div className="text-8xl mb-4 text-blue-600">📱</div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-400 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-500 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-400 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-500 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-400 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-500 rounded opacity-60"></div>
                </div>
                <div className="text-center text-blue-600 font-semibold">
                  Technology for Safety
                </div>
              </div>
            </div>

            {/* <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-primary mb-4">System Description</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                B-READY is a comprehensive web-based platform featuring instant incident reporting, real-time location tracking, community coordination tools, and emergency resource management. Our system bridges the communication gap between residents and responders for more effective disaster management.
              </p>
            </div> */}
          </div>
          
          {/* Right Column - Graphics */}
          <div className="relative">

              <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-primary mb-4">System Description</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                B-READY is a comprehensive web-based platform featuring instant incident reporting, real-time location tracking, community coordination tools, and emergency resource management. Our system bridges the communication gap between residents and responders for more effective disaster management.
              </p>
            </div>

            {/* <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-4 left-4 w-20 h-20 bg-blue-500 rounded-full opacity-20"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-blue-600 rounded-full opacity-20"></div>
              <div className="relative z-10">
                <div className="text-8xl mb-4 text-blue-600">📱</div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-400 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-500 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-400 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-500 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-400 rounded opacity-60"></div>
                  <div className="w-8 h-8 bg-blue-500 rounded opacity-60"></div>
                </div>
                <div className="text-center text-blue-600 font-semibold">
                  Technology for Safety
                </div>
              </div>
            </div> */}
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
        
        {/* View Safety Tips Buttons - Moved from Hero and CTA */}
        <div className="flex gap-4 justify-center flex-wrap mt-12 relative z-20">
          <button
            onClick={() => {
              console.log('Safety tips button clicked');
              router.push('/safety-tips');
            }}
            className="px-8 py-4 bg-transparent border-2 border-primary text-primary rounded-xl font-semibold text-lg hover:bg-primary/10 transition-colors cursor-pointer relative z-20"
          >
            🛡️ View Safety Tips
          </button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-primary-dark text-white text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("/background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px) brightness(0.7)',
          opacity: 0.3,
          zIndex: 0
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, transparent 60%, rgba(59, 130, 246, 0.8))',
          zIndex: 0
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          zIndex: 1
        }} />
        <div className="relative z-20 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">READY TO MAKE YOUR BARANGAY SAFER?</h2>
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

      {/* Floating Action Button for Emergency Reporting */}
      <FAB onCategorySelect={async (category) => {
        setSelectedCategory(category);
        setShowChatbox(true);

        if (user) {
          // User is logged in - create normal report
          try {
            const position = await getCurrentLocation();
            const address = await reverseGeocode(position.lat, position.lng);
            const timestamp = new Date().toISOString();
            const tempId = `temp_${Date.now()}_${user.uid}`;
            setTempReportId(tempId);
            setCurrentReportChat(tempId); // Enable chat immediately
            joinReportChat(tempId); // Join the chat room for the temp report

            const reportData: Partial<Report> = {
              id: tempId,
              type: category.name,
              description: `Emergency: ${category.name}`,
              location: position,
              address: address,
              timestamp: timestamp,
              userId: user.uid,
              userName: `${user.firstName} ${user.lastName}`,
              userPhone: user.phone,
              severity: 'medium',
              status: 'pending',
              category: category.name,
              subcategory: category.subcategories[0],
              icon: category.icon,
            };

      if (isOffline) {
              // Store offline
              const offlineReport = storeOfflineReport(reportData);
              notificationManager.info('Report saved offline. Will sync when online.');
              console.log('📱 Report stored offline:', offlineReport.offlineId);
            } else {
              // Use socket to submit report (same as dashboard)
              submitReport(reportData);
            }
          } catch (error) {
            console.error('Error creating report:', error);
            notificationManager.error('Failed to get location. Report will be submitted without location.');

            const timestamp = new Date().toISOString();
            const tempId = `temp_${Date.now()}_${user.uid}`;
            setTempReportId(tempId);
            setCurrentReportChat(tempId); // Enable chat immediately
            joinReportChat(tempId); // Join the chat room for the temp report

            const reportData: Partial<Report> = {
              id: tempId,
              type: category.name,
              description: `Emergency: ${category.name}`,
              location: null,
              address: 'Location not available',
              timestamp: timestamp,
              userId: user.uid,
              userName: `${user.firstName} ${user.lastName}`,
              severity: 'medium',
              status: 'pending',
              category: category.name,
              icon: category.icon,
            };

            if (isOffline) {
                const offlineReport = storeOfflineReport(reportData);
                notificationManager.info('Report saved offline. Will sync when online.');
                console.log('📱 Report stored offline:', offlineReport.offlineId);
              } else {
                // Use socket to submit report (same as dashboard)
                submitReport(reportData);
              }
          }
        } else {
          // User is not logged in - create anonymous report
          const reportId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setCurrentReportChat(reportId);

          try {
            // Get user's location automatically for anonymous reports
            const position = await getCurrentLocation();
            const address = await reverseGeocode(position.lat, position.lng);
            
            // Store the location with the report
            const reportData = {
              id: reportId,
              type: category.name,
              description: `${category.name} emergency reported anonymously`,
              location: position,
              address: address,
              timestamp: new Date().toISOString(),
              userId: 'anonymous',
              userName: 'Anonymous User',
              severity: 'medium' as const,
              status: 'pending' as const,
              category: category.name,
              subcategory: category.subcategories[0],
              icon: category.icon,
            };

            // Use socket to submit report (same as dashboard)
            submitReport(reportData);
          } catch (error) {
            console.error('Error getting location for anonymous report:', error);
            // Create report without location if we can't get it
            const reportData = {
              id: reportId,
              type: category.name,
              description: `${category.name} emergency reported anonymously`,
              location: null,
              address: 'Location not available',
              timestamp: new Date().toISOString(),
              userId: 'anonymous',
              userName: 'Anonymous User',
              severity: 'medium' as const,
              status: 'pending' as const,
              category: category.name,
              subcategory: category.subcategories[0],
              icon: category.icon,
            };
            
            // Use socket to submit report (same as dashboard)
            submitReport(reportData);
          }
        }
      }} />

      {/* ChatBox for Reports */}
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
            // Handle message sending
            if (currentReportChat) {
              if (user) {
                // Logged in user - send via socket or store offline
                if (isOffline) {
                  storeOfflineMessage({
                    reportId: currentReportChat,
                    text,
                    userName: `${user.firstName} ${user.lastName}`,
                    userRole: user.role,
                    timestamp: new Date().toISOString(),
                  });
                  console.log('💬 Message stored offline for report:', currentReportChat);
                } else {
                  sendMessage(text);
                }
              } else {
                // Anonymous user - store offline
                storeOfflineMessage({
                  reportId: currentReportChat,
                  text: text,
                  userName: 'Anonymous User',
                  userRole: 'user',
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }}
          onSendImage={(imageData) => {
            // Handle image sending
            if (currentReportChat) {
              if (user) {
                // Logged in user - send via socket or store offline
                if (isOffline) {
                  storeOfflineMessage({
                    reportId: currentReportChat,
                    text: '[Photo]',
                    userName: `${user.firstName} ${user.lastName}`,
                    userRole: user.role,
                    timestamp: new Date().toISOString(),
                    imageData,
                  });
                  console.log('📸 Image stored offline for report:', currentReportChat);
                } else {
                  sendMessage('[Photo]', imageData);
                }
              } else {
                // Anonymous user - store offline
                storeOfflineMessage({
                  reportId: currentReportChat,
                  text: '[Photo]',
                  userName: 'Anonymous User',
                  userRole: 'user',
                  timestamp: new Date().toISOString(),
                  imageData: imageData,
                });
              }
            }
          }}
        />
      )}

    </div>
  );
}
