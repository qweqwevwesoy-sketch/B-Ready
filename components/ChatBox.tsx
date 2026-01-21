'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSocketContext } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineStatus, storeOfflineMessage, getOfflineMessagesForReport } from '@/lib/offline-manager';
import type { Category } from '@/types';

interface ChatBoxProps {
  reportId?: string | null;
  category?: Category | null;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onSendImage?: (imageData: string) => void;
}

const getInitialMessage = (category: Category | null | undefined): { text: string; sender: string; time: string; type: 'sent' | 'received'; imageData?: string } => ({
  text: category
    ? `Hello! How can we help you today? You're reporting a ${category.name.toLowerCase()} incident.`
    : 'Hello! How can we help you today?',
  sender: 'B-READY Support',
  time: 'Just now',
  type: 'received' as const,
});

export function ChatBox({ reportId, category, onClose, onSendMessage, onSendImage }: ChatBoxProps) {
  const { chatMessages } = useSocketContext();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Array<{ text: string; sender: string; time: string; type: 'sent' | 'received'; imageData?: string }>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOffline = useOfflineStatus();

  const messages = useMemo(() => {
    let onlineMessages: Array<{ text: string; sender: string; time: string; type: 'sent' | 'received'; imageData?: string }> = [];

    if (reportId && chatMessages[reportId]) {
      // Convert stored messages to display format
      onlineMessages = chatMessages[reportId].map(msg => {
        const isCurrentUser = user && msg.userName === `${user.firstName} ${user.lastName}`;
        return {
          text: msg.text,
          sender: isCurrentUser ? 'You' : msg.userName,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: msg.userRole === 'admin' ? 'received' : 'sent' as const,
          imageData: msg.imageData,
        };
      });
    }

    // Add offline messages if available
    let offlineMessages: Array<{ text: string; sender: string; time: string; type: 'sent' | 'received'; imageData?: string }> = [];
    if (reportId) {
      const offlineMsgs = getOfflineMessagesForReport(reportId);
      offlineMessages = offlineMsgs.map(msg => ({
        text: msg.text,
        sender: msg.userName,
        time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: msg.userRole === 'admin' ? 'received' : 'sent' as const,
        imageData: msg.imageData,
      }));
    }

    const allMessages = [...onlineMessages, ...offlineMessages, ...localMessages];

    // Always include initial message if no other messages exist, otherwise just show all messages
    if (allMessages.length === 0) {
      return [getInitialMessage(category)];
    }

    // Check if initial message is already in the messages
    const hasInitialMessage = allMessages.some(msg =>
      msg.sender === 'B-READY Support' &&
      msg.type === 'received' &&
      msg.text.includes('Hello! How can we help you')
    );

    // If no initial message and we have a category, add it at the beginning
    if (!hasInitialMessage && category) {
      return [getInitialMessage(category), ...allMessages];
    }

    return allMessages;
  }, [reportId, chatMessages, category, localMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startCamera = async () => {
    try {
      console.log('🎥 Requesting camera access...');

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ Camera API not available, trying file upload fallback');
        // Fall back to file input
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

      // Check if we're on HTTPS (required for camera access in most browsers)
      // Allow HTTP for localhost development
      const isSecureContext = location.protocol === 'https:' ||
                             location.hostname === 'localhost' ||
                             location.hostname === '127.0.0.1' ||
                             location.hostname.startsWith('192.168.');

      if (!isSecureContext) {
        console.warn('⚠️ Not in secure context, trying file upload fallback');
        // Fall back to file input
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

      // Try different camera configurations
      let stream;
      const constraints = [
        // Try rear camera first
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
        // Try front camera
        { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } },
        // Try any camera
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
        // Basic video
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

      if (videoRef.current) {
        console.log('📺 Setting video srcObject');
        videoRef.current.srcObject = stream;

        try {
          // Force the video to be visible and play
          videoRef.current.style.display = 'block';
          videoRef.current.style.visibility = 'visible';
          videoRef.current.style.opacity = '1';

          await videoRef.current.play();
          console.log('▶️ Video playing');

          // Add a small delay to ensure video loads
          setTimeout(() => {
            if (videoRef.current && videoRef.current.videoWidth > 0) {
              console.log('📹 Video fully loaded with dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
              setCameraReady(true);
            } else {
              console.warn('⚠️ Video loaded but no dimensions yet, waiting...');
              // Force ready state after a longer delay
              setTimeout(() => {
                console.log('⏰ Forcing camera ready state');
                setCameraReady(true);
              }, 1000);
            }
          }, 500);

        } catch (playError) {
          console.error('❌ Video play failed:', playError);
          // Still set as active but not ready
          setCameraActive(true);
          setCameraReady(false);
        }
      }

      setCameraActive(true);
    } catch (err) {
      console.error('❌ Error accessing camera:', err);

      // Final fallback: file upload
      console.log('📁 Falling back to file upload');
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

      // Compress the image
      const compressedDataUrl = await compressImage(file);

      // Add the image to local messages
      const uploadedImageMessage = {
        text: '[Photo]', // Placeholder text for image
        sender: 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'sent' as const,
        imageData: compressedDataUrl,
      };
      setLocalMessages(prev => [...prev, uploadedImageMessage]);

      // Send the image if callback exists
      if (onSendImage) {
        onSendImage(compressedDataUrl);
      }

      console.log('✅ Image uploaded and compressed successfully');
    } catch (error) {
      console.error('❌ Error processing uploaded file:', error);
      alert('Error processing the selected image. Please try again.');
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check file size first - if under 500KB, don't compress
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
        // Calculate new dimensions (max 800px width/height for faster processing)
        let { width, height } = img;

        const maxSize = 800; // Reduced from 1200 for faster processing
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

        // Draw and compress with lower quality for faster processing
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with quality 0.7 (reduced from 0.8)
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
    if (!streamRef.current) {
      console.error('❌ No camera stream available for capture');
      alert('No camera stream available. Please restart the camera.');
      return;
    }

    const video = videoRef.current;
    console.log('📸 Attempting to capture photo...');

    if (video) {
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('Video ready state:', video.readyState);
      console.log('Video visibility:', video.style.visibility);
      console.log('Video display:', video.style.display);
    }

    // Try multiple capture methods
    let capturedDataUrl = null;

    try {
      // Method 1: Use video element if it has dimensions
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        console.log('📸 Using video element capture method');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          console.log('✅ Video capture successful');
        }
      }

      // Method 2: Fallback - capture from stream directly (if video fails)
      if (!capturedDataUrl) {
        console.log('📸 Using stream capture fallback method');
        const canvas = document.createElement('canvas');
        const videoTrack = streamRef.current.getVideoTracks()[0];

        if (videoTrack) {
          const settings = videoTrack.getSettings();
          canvas.width = settings.width || 640;
          canvas.height = settings.height || 480;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Create a temporary video element for capture
            const tempVideo = document.createElement('video');
            tempVideo.srcObject = streamRef.current;
            tempVideo.muted = true;
            tempVideo.playsInline = true;

            // Wait for the temporary video to load
            tempVideo.onloadeddata = () => {
              try {
                ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                console.log('✅ Stream capture successful');
                processCapturedImage(capturedDataUrl);
              } catch (fallbackError) {
                console.error('❌ Stream capture failed:', fallbackError);
                fallbackToFileUpload();
              }
            };

            tempVideo.onerror = () => {
              console.error('❌ Temporary video load failed');
              fallbackToFileUpload();
            };

            // Trigger play on temp video
            tempVideo.play().catch(() => {
              console.error('❌ Could not play temporary video');
              fallbackToFileUpload();
            });

            return; // Exit here, let the async handler call processCapturedImage
          }
        }
      }

      // If we have a captured image, process it
      if (capturedDataUrl) {
        processCapturedImage(capturedDataUrl);
      } else {
        console.error('❌ All capture methods failed');
        fallbackToFileUpload();
      }

    } catch (error) {
      console.error('❌ Error during photo capture:', error);
      fallbackToFileUpload();
    }
  };

  const processCapturedImage = (dataUrl: string) => {
    console.log('✅ Photo captured successfully, size:', Math.round((dataUrl.length - 'data:image/jpeg;base64,'.length) * 3 / 4), 'bytes');

    // Add the image to local messages immediately for UI feedback
    const sentImageMessage = {
      text: '[Photo]',
      sender: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'sent' as const,
      imageData: dataUrl,
    };
    setLocalMessages(prev => [...prev, sentImageMessage]);

    // Send the image if callback exists
    if (onSendImage) {
      onSendImage(dataUrl);
    }

    stopCamera();
  };

  const fallbackToFileUpload = () => {
    console.log('📁 Falling back to file upload');
    alert('Camera capture failed. Please select an image file instead.');

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
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[85vh] max-h-[700px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-4 rounded-t-2xl flex justify-between items-center">
          <div>
            <h3 className="font-semibold">
              {reportId ? 'Report Chat' : (category ? category.name : 'B-READY Support')}
            </h3>
            <p className="text-sm opacity-90">
              {reportId ? 'Continuing conversation' : (category ? `Reporting: ${category.name}` : 'Emergency Reporting')}
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
              <div className="flex gap-3">
                {/* Profile Picture for received messages */}
                {msg.type === 'received' && (
                  <div className="flex-shrink-0">
                    {user && msg.sender !== 'B-READY Support' ? (
                      user.profilePictureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.profilePictureUrl}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLElement).parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.chat-avatar-fallback') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null
                    ) : null}
                    <div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-sm chat-avatar-fallback"
                      style={{ display: (!user?.profilePictureUrl || msg.sender === 'B-READY Support') ? 'flex' : 'none' }}
                    >
                      {msg.sender === 'B-READY Support' ? '🚨' : msg.sender.charAt(0)}
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    msg.type === 'sent'
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 opacity-90">{msg.sender}</div>
                  {msg.imageData ? (
                    // If there's image data, show the image instead of the "[Photo]" placeholder text
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.imageData} alt="Captured" className="rounded-lg max-w-full" />
                  ) : (
                    // Only show text if there's no image data or if the text is meaningful (not just "[Photo]")
                    msg.text && msg.text !== '[Photo]' && <p>{msg.text}</p>
                  )}
                  <div className="text-xs mt-2 opacity-70">{msg.time}</div>
                </div>

                {/* Profile Picture for sent messages */}
                {msg.type === 'sent' && (
                  <div className="flex-shrink-0">
                    {user?.profilePictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profilePictureUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.chat-sent-avatar-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-sm chat-sent-avatar-fallback"
                      style={{ display: user?.profilePictureUrl ? 'none' : 'flex' }}
                    >
                      {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
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
          <div className="p-4 bg-gray-900 relative z-10" style={{ position: 'relative', zIndex: 9999 }}>
            <div className="relative w-full rounded-lg mb-4 bg-black overflow-hidden" style={{ minHeight: '250px', position: 'relative' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
                style={{
                  minHeight: '250px',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 10000,
                  backgroundColor: 'black'
                }}
                onLoadedData={() => {
                  console.log('🎥 Video loaded successfully');
                  setCameraReady(true);
                }}
                onError={(e) => {
                  console.error('🎥 Video error:', e);
                  setCameraReady(false);
                }}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4 bg-black rounded-lg" style={{ zIndex: 10001 }}>
                  <div>
                    <div className="text-4xl mb-2">📷</div>
                    <p>Camera initializing...</p>
                    <p className="text-sm mt-2">Please wait...</p>
                  </div>
                </div>
              )}
              {cameraReady && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded" style={{ zIndex: 10002 }}>
                  📹 Live Camera
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                disabled={!cameraReady}
              >
                📸 Capture Photo
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                ❌ Cancel
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
              placeholder={category ? `Describe the ${category.name.toLowerCase()} incident...` : 'Type your message...'}
              className="flex-1 min-w-0 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              autoComplete="off"
            />
            <div className="flex gap-1 flex-shrink-0">
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
                className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:opacity-90 text-sm font-medium whitespace-nowrap"
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
