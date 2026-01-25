'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSocketContext } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineStatus, storeOfflineMessage, getOfflineMessagesForReport, storeOfflineReport } from '@/lib/offline-manager';
import { notificationManager } from '@/components/NotificationManager';
import { getCurrentLocation } from '@/lib/utils';
import { useModalManager } from '@/contexts/ModalManager';
import type { Category, Report } from '@/types';
import { categories } from '@/lib/categories';

interface ChatBoxProps {
  reportId?: string | null;
  category?: Category | null;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onSendImage?: (imageData: string) => void;
  isAnonymous?: boolean;
}

const getInitialMessage = (category: Category | null | undefined, isAnonymous: boolean): { text: string; sender: string; time: string; type: 'sent' | 'received'; imageData?: string } => ({
  text: isAnonymous
    ? category
      ? `Hello! I understand you're reporting a ${category.name} emergency anonymously. Can you please describe what happened?`
      : 'Hello! I\'m here to help you report an emergency anonymously. What type of emergency are you experiencing?'
    : category
    ? `Hello! How can we help you today? You're reporting a ${category.name.toLowerCase()} incident.`
    : 'Hello! How can we help you today?',
  sender: 'B-READY Support',
  time: 'Just now',
  type: 'received',
});

export function ChatBox({ reportId, category, onClose, onSendMessage, onSendImage, isAnonymous = false }: ChatBoxProps) {
  const { chatMessages, reports } = useSocketContext();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Array<{ text: string; sender: string; time: string; type: 'sent' | 'received'; imageData?: string }>>([]);
  const [showReportInfo, setShowReportInfo] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(isAnonymous && !category && !reportId);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(category || null);
  const [anonymousReportId, setAnonymousReportId] = useState<string | null>(null);
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
          type: (isCurrentUser ? 'sent' : 'received') as const,
          imageData: msg.imageData,
          userName: msg.userName, // Keep original username for profile lookup
          userRole: msg.userRole,
        };
      });
    }

              {/* Incident Type */}
              {currentReport && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Incident</div>
                  {user?.role === 'admin' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        defaultValue={currentReport.category}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter incident type..."
                        onBlur={(e) => {
                          const newCategory = e.target.value;
                          // Here you would typically call an API to update the report
                          console.log('Admin updated incident category:', newCategory);
                          // For now, just log the change - you would implement the actual update logic here
                        }}
                      />
                      <input
                        type="text"
                        defaultValue={currentReport.subcategory || ''}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter subcategory..."
                        onBlur={(e) => {
                          const newSubcategory = e.target.value;
                          // Here you would typically call an API to update the report
                          console.log('Admin updated subcategory:', newSubcategory);
                          // For now, just log the change - you would implement the actual update logic here
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="text-sm">{currentReport.category}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {currentReport.subcategory || 'None'}
                      </div>
                    </>
                  )}
                  {user?.role === 'admin' && (
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Admin Notes</div>
                      <textarea
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Add admin notes about this incident..."
                        rows={3}
                        defaultValue={currentReport.notes || ''}
                        onBlur={(e) => {
                          const newNotes = e.target.value;
                          // Here you would typically call an API to update the report
                          console.log('Admin updated notes:', newNotes);
                          // For now, just log the change - you would implement the actual update logic here
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

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
      return [getInitialMessage(selectedCategory || category, isAnonymous)];
    }

    // Check if initial message is already in the messages
    const hasInitialMessage = allMessages.some(msg =>
      msg.sender === 'B-READY Support' &&
      msg.type === 'received' &&
      msg.text.includes('Hello! How can we help you')
    );

    // If no initial message and we have a category, add it at the beginning
    if (!hasInitialMessage && (selectedCategory || category)) {
      return [getInitialMessage(selectedCategory || category, isAnonymous), ...allMessages];
    }

    return allMessages;
  }, [reportId, chatMessages, category, selectedCategory, isAnonymous, localMessages]);

  // Get the actual report data for the modal
  const currentReport = useMemo(() => {
    if (!reportId) return null;
    // For temporary reports, we need to get the data from local state or props
    if (reportId.startsWith('temp_')) {
      // Try to find in reports array first (in case it was synced)
      const syncedReport = reports.find(r => r.id === reportId);
      if (syncedReport) return syncedReport;
      // If not found, we'll use the category prop or other available data
      return null;
    }
    return reports.find(r => r.id === reportId);
  }, [reportId, reports]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInstantCamera = () => {
    console.log('📸 Instant camera mode - opening file picker');

    // Detect if we're on a mobile device
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth < 768 ||
                     'ontouchstart' in window;

    console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');

    // For desktop computers, skip camera and go straight to file picker
    // Computer cameras don't work the same way as mobile cameras
    if (!isMobile) {
      console.log('💻 Desktop detected - using file picker only');
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.multiple = false;
      fileInput.style.display = 'none';

      fileInput.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          console.log('📸 File selected on desktop:', file.name, `(${file.size} bytes)`);
          await handleFileUpload(file);
        }
      };

      document.body.appendChild(fileInput);
      fileInput.click();
      setTimeout(() => document.body.removeChild(fileInput), 100);
      return;
    }

    // For mobile devices, use camera capture
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment'; // Use rear camera on mobile
    fileInput.style.display = 'none';

    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('📸 File selected instantly on mobile:', file.name, `(${file.size} bytes)`);
        await handleFileUpload(file);
      }
    };

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  };

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
            if (videoRef.current) {
              console.log('📹 Video check - Width:', videoRef.current.videoWidth, 'Height:', videoRef.current.videoHeight, 'ReadyState:', videoRef.current.readyState);

              // Force the video to be visible regardless
              videoRef.current.style.display = 'block';
              videoRef.current.style.visibility = 'visible';
              videoRef.current.style.opacity = '1';

              if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                console.log('✅ Video has dimensions - setting ready');
                setCameraReady(true);
              } else {
                console.warn('⚠️ Video has no dimensions, but forcing ready anyway');
                // Force ready state even without dimensions
                setCameraReady(true);
              }
            } else {
              console.error('❌ Video ref is null during check');
              setCameraReady(false);
            }
          }, 300);

          // Additional fallback - force ready after 2 seconds
          setTimeout(() => {
            console.log('⏰ Fallback: Forcing camera ready after 2 seconds');
            setCameraReady(true);
          }, 2000);

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
        sender: isAnonymous ? 'You (Anonymous)' : 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'sent' as const,
        imageData: compressedDataUrl,
      };
      setLocalMessages(prev => [...prev, uploadedImageMessage]);

      // Handle anonymous image storage
      if (isAnonymous && selectedCategory) {
        const reportIdToUse = anonymousReportId || `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        storeOfflineMessage({
          reportId: reportIdToUse,
          text: '[Photo uploaded]',
          userName: 'Anonymous User',
          userRole: 'user',
          timestamp: new Date().toISOString(),
          imageData: compressedDataUrl,
        });
      } else if (onSendImage) {
        // Send the image if callback exists for authenticated users
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
      // Handle anonymous messages
      if (isAnonymous && selectedCategory) {
        const newMessage = {
          text: message,
          sender: 'You (Anonymous)',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'sent' as const,
        };
        setLocalMessages(prev => [...prev, newMessage]);

        // Store offline message for anonymous report
        const reportIdToUse = anonymousReportId || `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        storeOfflineMessage({
          reportId: reportIdToUse,
          text: message,
          userName: 'Anonymous User',
          userRole: 'user',
          timestamp: new Date().toISOString(),
        });
      } else {
        // Handle authenticated user messages
        onSendMessage(message);
      }
      setMessage('');
    }
  };

  // Get proper z-index values from ModalManager
  const { getModalZIndex } = useModalManager();
  const chatBoxZIndex = getModalZIndex('chatbox');
  const reportInfoZIndex = getModalZIndex('reportInfo');

  // Category Selection Screen for Anonymous Users
  if (showCategorySelection) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex: chatBoxZIndex }}>
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
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowCategorySelection(false);
                    // Create anonymous report
                    const newReportId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    setAnonymousReportId(newReportId);

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
                  }}
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

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        {/* Hidden video element for camera access - outside modal */}
        {cameraActive && (
          <div style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '1px',
                height: '1px',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              onLoadedData={() => {
                try {
                  console.log('🎥 Hidden video loaded successfully');
                  setCameraReady(true);
                } catch (error) {
                  console.error('🎥 Error in hidden video onLoadedData:', error);
                }
              }}
              onError={(e) => {
                try {
                  console.error('🎥 Hidden video error:', e);
                  setCameraReady(false);
                } catch (error) {
                  console.error('🎥 Error in hidden video onError:', error);
                }
              }}
            />
          </div>
        )}

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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-sm">
                      {msg.sender === 'B-READY Support' ? '🚨' : msg.sender.charAt(0).toUpperCase()}
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
                        alt="Your Profile"
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.sent-avatar-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-sm sent-avatar-fallback"
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
                  zIndex: 1,
                  backgroundColor: 'black',
                  display: 'block',
                  visibility: 'visible',
                  opacity: 1
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
                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4 bg-black/75 rounded-lg" style={{ zIndex: 10001, backdropFilter: 'blur(2px)' }}>
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={!cameraReady}
              >
                + Capture Photo
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
            <div className="relative flex-1">
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
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                autoComplete="off"
              />
              {reportId && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Report Information"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReportInfo(true);
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {isAnonymous && (
                <button
                  type="button"
                  onClick={async () => {
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

                      // Store offline location message for anonymous report
                      const reportIdToUse = anonymousReportId || `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                      storeOfflineMessage({
                        reportId: reportIdToUse,
                        text: `Location shared: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
                        userName: 'Anonymous User',
                        userRole: 'user',
                        timestamp: new Date().toISOString(),
                      });

                      console.log('✅ Location shared successfully');
                    } catch (error) {
                      console.error('❌ Error getting location:', error);
                      alert('Unable to get your location. Please check your location permissions and try again.');
                    }
                  }}
                  className="w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center text-lg"
                  title="Share location"
                >
                  📍
                </button>
              )}
              <button
                type="button"
                onClick={startInstantCamera}
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

      {/* Report Information Modal */}
      {showReportInfo && reportId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: reportInfoZIndex }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-3 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-sm">Report Information</h3>
                </div>
                <button
                  onClick={() => setShowReportInfo(false)}
                  className="text-white hover:opacity-80 text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {/* Report Type */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs font-semibold text-gray-600">Type</div>
                <div className="text-sm">
                  {currentReport ? (
                    currentReport.type || currentReport.category || 'Unknown'
                  ) : category ? (
                    category.name || 'Unknown'
                  ) : reportId ? (
                    reportId.startsWith('anonymous_') ? 'Anonymous Report' : 'Temporary Report'
                  ) : 'Unknown'}
                </div>
              </div>

              {/* Username */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs font-semibold text-gray-600">Reported By</div>
                <div className="text-sm">
                  {currentReport ? (
                    currentReport.userName || 'Anonymous User'
                  ) : reportId ? (
                    reportId.startsWith('anonymous_') ? 'Anonymous User' :
                    reportId.startsWith('temp_') ? (user ? `${user.firstName} ${user.lastName}` : 'Temporary User') :
                    'Unknown User'
                  ) : user ? (
                    `${user.firstName} ${user.lastName}`
                  ) : 'Anonymous'}
                </div>
              </div>

              {/* Location */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs font-semibold text-gray-600">Location</div>
                <div className="text-sm">📍 {currentReport?.address || (reportId?.startsWith('temp_') ? 'Location not specified' : 'Location not specified')}</div>
                {currentReport?.location && (
                  <div className="text-xs text-gray-600 mt-1">
                    {currentReport.location.lat.toFixed(6)}, {currentReport.location.lng.toFixed(6)}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs font-semibold text-gray-600">Contact</div>
                <div className="text-sm">📞 {currentReport?.userPhone || (reportId?.startsWith('temp_') ? (user?.phone || 'Not provided') : 'Not provided')}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentReport?.userName ? `${currentReport.userName}@example.com` : (reportId?.startsWith('temp_') ? (user ? `${user.firstName} ${user.lastName}@example.com` : 'Not provided') : 'Not provided')}
                </div>
              </div>

              {/* Incident Type */}
              {currentReport && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Incident</div>
                  <div className="text-sm">{currentReport.category}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {currentReport.subcategory || 'None'}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Admin Notes</div>
                      <textarea
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Add admin notes about this incident..."
                        rows={3}
                        defaultValue={currentReport.notes || ''}
                        onBlur={(e) => {
                          const newNotes = e.target.value;
                          // Here you would typically call an API to update the report
                          console.log('Admin updated notes:', newNotes);
                          // For now, just log the change - you would implement the actual update logic here
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs font-semibold text-gray-600">Status</div>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    currentReport?.status === 'approved' ? 'bg-green-100 text-green-800' :
                    currentReport?.status === 'current' ? 'bg-blue-100 text-blue-800' :
                    currentReport?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    currentReport?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    reportId ? (
                      reportId.startsWith('temp_') ? 'bg-blue-100 text-blue-800' :
                      reportId.startsWith('anonymous_') ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    ) : 'bg-green-100 text-green-800'
                  }`}>
                    {currentReport?.status === 'approved' ? 'Approved' :
                     currentReport?.status === 'current' ? 'Active' :
                     currentReport?.status === 'pending' ? 'Pending' :
                     currentReport?.status === 'rejected' ? 'Rejected' :
                     reportId ? (
                       reportId.startsWith('temp_') ? 'Temporary' :
                       reportId.startsWith('anonymous_') ? 'Anonymous' :
                       'Active'
                     ) : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => setShowReportInfo(false)}
                className="w-full px-3 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:opacity-90 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
