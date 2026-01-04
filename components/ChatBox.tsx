'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSocketContext } from '@/contexts/SocketContext';
import { useOfflineStatus, storeOfflineMessage, getOfflineMessagesForReport } from '@/lib/offline-manager';
import type { Category } from '@/types';

interface ChatBoxProps {
  reportId?: string | null;
  category?: Category | null;
  onClose: () => void;
  onSendMessage: (text: string) => void;
}

const getInitialMessage = (category: Category | null | undefined) => ({
  text: category
    ? `Hello! How can we help you today? You're reporting a ${category.name.toLowerCase()} incident.`
    : 'Hello! How can we help you today?',
  sender: 'B-READY Support',
  time: 'Just now',
  type: 'received' as const,
});

export function ChatBox({ reportId, category, onClose, onSendMessage }: ChatBoxProps) {
  const { chatMessages } = useSocketContext();
  const [message, setMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOffline = useOfflineStatus();

  const messages = useMemo(() => {
    let onlineMessages: Array<{ text: string; sender: string; time: string; type: 'sent' | 'received' }> = [];

    if (reportId && chatMessages[reportId]) {
      // Convert stored messages to display format
      onlineMessages = chatMessages[reportId].map(msg => ({
        text: msg.text,
        sender: msg.userName,
        time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: msg.userRole === 'admin' ? 'received' : 'sent' as const,
      }));
    }

    // Add offline messages if available
    let offlineMessages: Array<{ text: string; sender: string; time: string; type: 'sent' | 'received' }> = [];
    if (reportId) {
      const offlineMsgs = getOfflineMessagesForReport(reportId);
      offlineMessages = offlineMsgs.map(msg => ({
        text: msg.text,
        sender: msg.userName,
        time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: msg.userRole === 'admin' ? 'received' : 'sent' as const,
      }));
    }

    const allMessages = [...onlineMessages, ...offlineMessages];

    // Return messages or initial message for new chats
    return allMessages.length > 0 ? allMessages : [getInitialMessage(category)];
  }, [reportId, chatMessages, category]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      // For now, just show the image without adding to chat messages
      stopCamera();
    }
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
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  msg.type === 'sent'
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <div className="text-xs font-semibold mb-1 opacity-90">{msg.sender}</div>
                {msg.text && <p>{msg.text}</p>}
                {capturedImage && idx === messages.length - 1 && msg.type === 'sent' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={capturedImage} alt="Captured" className="mt-2 rounded-lg max-w-full" />
                )}
                <div className="text-xs mt-2 opacity-70">{msg.time}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Camera Preview */}
        {cameraActive && (
          <div className="p-4 bg-gray-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg mb-4"
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
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
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
          <div className="flex gap-2">
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
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => (cameraActive ? stopCamera() : startCamera())}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              📷
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:opacity-90"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
