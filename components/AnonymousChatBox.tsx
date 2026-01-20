'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { storeOfflineReport, storeOfflineMessage, getOfflineMessagesForReport } from '@/lib/offline-manager';
import { notificationManager } from '@/components/NotificationManager';
import { getCurrentLocation } from '@/lib/utils';
import type { Category } from '@/types';
import { categories } from '@/lib/categories';

interface AnonymousChatBoxProps {
  onClose: () => void;
}

export function AnonymousChatBox({ onClose }: AnonymousChatBoxProps) {
  const [message, setMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Array<{ text: string; sender: string; time: string; type: 'sent' | 'received'; imageData?: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [showCategorySelection, setShowCategorySelection] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessage = useMemo(() => ({
    text: 'Hello! I\'m here to help you report an emergency anonymously. What type of emergency are you experiencing?',
    sender: 'B-READY Support',
    time: 'Just now',
    type: 'received' as const,
    imageData: undefined,
  }), []);

  const messages = useMemo(() => {
    const allMessages = [initialMessage, ...localMessages];

    if (selectedCategory && !allMessages.some(msg => msg.text.includes(`Reporting: ${selectedCategory.name}`))) {
      const categoryMessage = {
        text: `I understand you're reporting a ${selectedCategory.name} emergency. Can you please describe what happened? Include any important details like location if possible.`,
        sender: 'B-READY Support',
        time: 'Just now',
        type: 'received' as const,
        imageData: undefined,
      };
      allMessages.splice(1, 0, categoryMessage);
    }

    return allMessages;
  }, [initialMessage, localMessages, selectedCategory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setShowCategorySelection(false);

    // Create anonymous report
    const newReportId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setReportId(newReportId);

    const reportData = {
      id: newReportId,
      type: category.name,
      description: `${category.name} emergency reported anonymously`,
      location: null,
      address: 'Anonymous location',
      timestamp: new Date().toISOString(),
      userId: 'anonymous',
      userName: 'Anonymous User',
      severity: 'high' as const,
      status: 'pending' as const,
      category: category.name,
      subcategory: category.subcategories[0] || 'General',
      icon: category.icon,
    };

    storeOfflineReport(reportData);
  };

  const startCamera = async () => {
    try {
      console.log('🎥 Requesting camera access...');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ Camera API not available, trying file upload fallback');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.capture = 'environment';
        fileInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        };
        fileInput.click();
        return;
      }

      const isSecureContext = location.protocol === 'https:' ||
                             location.hostname === 'localhost' ||
                             location.hostname === '127.0.0.1' ||
                             location.hostname.startsWith('192.168.');

      if (!isSecureContext) {
        console.warn('⚠️ Not in secure context, trying file upload fallback');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.capture = 'environment';
        fileInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        };
        fileInput.click();
        return;
      }

      let stream;
      const constraints = [
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: true }
      ];

      for (const constraint of constraints) {
        try {
          console.log('🎥 Trying camera constraints:', constraint);
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('✅ Camera access granted with constraints:', constraint);
          break;
        } catch (error) {
          console.warn('⚠️ Camera constraint failed:', constraint, error);
        }
      }

      if (!stream) {
        throw new Error('Unable to access any camera on this device.');
      }

      streamRef.current = stream;
      setCameraReady(true);
      if (videoRef.current) {
        console.log('📺 Setting video srcObject');
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('▶️ Video playing');
      }
      setCameraActive(true);
    } catch (err) {
      console.error('❌ Error accessing camera:', err);

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.capture = 'environment';
      fileInput.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleFileUpload(file);
        }
      };
      fileInput.click();
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      console.log('📁 Processing uploaded file:', file.name);

      const compressedDataUrl = await compressImage(file);

      const uploadedImageMessage = {
        text: '[Photo]',
        sender: 'You (Anonymous)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'sent' as const,
        imageData: compressedDataUrl,
      };
      setLocalMessages(prev => [...prev, uploadedImageMessage]);

      if (reportId) {
        storeOfflineMessage({
          reportId,
          text: '[Photo uploaded]',
          userName: 'Anonymous User',
          userRole: 'user',
          timestamp: new Date().toISOString(),
          imageData: compressedDataUrl,
        });
      }

      console.log('✅ Image uploaded and compressed successfully');
    } catch (error) {
      console.error('❌ Error processing uploaded file:', error);
      alert('Error processing the selected image. Please try again.');
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size < 500 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        const maxSize = 800;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    let { videoWidth: width, videoHeight: height } = video;

    const maxDimension = 800;
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

      const sentImageMessage = {
        text: '[Photo]',
        sender: 'You (Anonymous)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'sent' as const,
        imageData: dataUrl,
      };
      setLocalMessages(prev => [...prev, sentImageMessage]);

      if (reportId) {
        storeOfflineMessage({
          reportId,
          text: '[Photo captured]',
          userName: 'Anonymous User',
          userRole: 'user',
          timestamp: new Date().toISOString(),
          imageData: dataUrl,
        });
      }

      stopCamera();
    }
  };

  const shareLocation = async () => {
    try {
      console.log('📍 Getting current location...');
      const location = await getCurrentLocation();

      const locationMessage = {
        text: `📍 My location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        sender: 'You (Anonymous)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'sent' as const,
      };
      setLocalMessages(prev => [...prev, locationMessage]);

      if (reportId) {
        storeOfflineMessage({
          reportId,
          text: `Location shared: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
          userName: 'Anonymous User',
          userRole: 'user',
          timestamp: new Date().toISOString(),
        });
      }

      console.log('✅ Location shared successfully');
    } catch (error) {
      console.error('❌ Error getting location:', error);
      alert('Unable to get your location. Please check your location permissions and try again.');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        text: message,
        sender: 'You (Anonymous)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'sent' as const,
      };
      setLocalMessages(prev => [...prev, newMessage]);

      if (reportId) {
        storeOfflineMessage({
          reportId,
          text: message,
          userName: 'Anonymous User',
          userRole: 'user',
          timestamp: new Date().toISOString(),
        });
      }

      setMessage('');
    }
  };

  // Category Selection Screen
  if (showCategorySelection) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md h-[85vh] max-h-[700px] flex flex-col shadow-2xl">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-semibold">🚨 Anonymous Emergency Chat</h3>
              <p className="text-sm opacity-90">Select emergency type to start chatting</p>
            </div>
            <button onClick={onClose} className="text-white hover:opacity-80 text-2xl">
              ×
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-gray-600 mb-4 text-center text-sm">
              Choose the type of emergency. Your chat will be completely anonymous.
            </p>

            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="w-full p-3 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-lg transition-all duration-200 text-left flex items-center gap-3 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                    {category.icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 group-hover:text-red-700 text-sm">
                      {category.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-500 text-center">
              🔒 Your identity is completely protected
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Chat Interface
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[85vh] max-h-[700px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <div>
            <h3 className="font-semibold">
              🚨 Anonymous Emergency Chat
            </h3>
            <p className="text-sm opacity-90">
              {selectedCategory ? selectedCategory.name : 'Emergency Support'}
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:opacity-80 text-2xl">
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex gap-3 max-w-[85%]">
                {msg.type === 'received' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-bold text-sm">
                      🚨
                    </div>
                  </div>
                )}

                <div
                  className={`p-3 rounded-lg ${
                    msg.type === 'sent'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 opacity-90">{msg.sender}</div>
                  {msg.imageData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.imageData} alt="Captured" className="rounded-lg max-w-full" />
                  ) : (
                    msg.text && <p>{msg.text}</p>
                  )}
                  <div className="text-xs mt-2 opacity-70">{msg.time}</div>
                </div>

                {msg.type === 'sent' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-white flex items-center justify-center font-bold text-sm">
                      A
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Camera Preview */}
        {cameraActive && (
          <div className="p-4 bg-gray-900">
            <div className="relative w-full rounded-lg mb-4 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
                style={{ minHeight: '200px', objectFit: 'cover' }}
                onLoadedData={() => console.log('🎥 Video loaded successfully')}
                onError={(e) => console.error('🎥 Video error:', e)}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                  <div>
                    <div className="text-4xl mb-2">📷</div>
                    <p>Camera initializing...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                disabled={!cameraReady}
              >
                📸 Capture
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl overflow-hidden">
          <div className="flex flex-wrap gap-2 items-end">
            <input
              type="text"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const syntheticEvent = {
                    preventDefault: () => {},
                  } as React.FormEvent;
                  handleSend(syntheticEvent);
                }
              }}
              placeholder="Describe the emergency situation..."
              className="flex-1 min-w-0 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              autoComplete="off"
            />
            <div className="flex gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={shareLocation}
                className="w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center text-lg"
                title="Share your location"
              >
                📍
              </button>
              <button
                type="button"
                onClick={() => (cameraActive ? stopCamera() : startCamera())}
                className="w-10 h-10 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center text-lg"
                title="Take photo"
              >
                📷
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:opacity-90 text-sm font-medium whitespace-nowrap"
              >
                Send
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
