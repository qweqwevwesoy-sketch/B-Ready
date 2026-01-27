'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useOptimizedSocketContext } from '@/contexts/OptimizedSocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface OptimizedChatBoxProps {
  reportId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  userName: string;
  userRole: string;
  timestamp: string;
  imageData?: string;
}

export function OptimizedChatBox({ reportId, isOpen, onClose }: OptimizedChatBoxProps) {
  const { user } = useAuth();
  const {
    chatMessages,
    chatLoading,
    sendMessage,
    connectionState,
    queueLength,
    hasPendingMessages,
    performanceMetrics,
  } = useOptimizedSocketContext();
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !imageFile) return;

    const text = message.trim();
    setMessage('');
    
    // Handle image upload
    let imageData: string | undefined;
    if (imageFile) {
      try {
        const base64 = await fileToBase64(imageFile);
        imageData = base64;
        setImageFile(null);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    await sendMessage(text, imageData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image file too large. Please select a file under 5MB');
        return;
      }
      setImageFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleTyping = () => {
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConnectionStatus = () => {
    switch (connectionState) {
      case 'connected':
        return { color: 'text-green-500', icon: '🟢', label: 'Connected' };
      case 'connecting':
      case 'reconnecting':
        return { color: 'text-yellow-500', icon: '🟡', label: 'Connecting...' };
      case 'disconnected':
        return { color: 'text-red-500', icon: '🔴', label: 'Disconnected' };
      case 'error':
        return { color: 'text-red-500', icon: '🔴', label: 'Connection Error' };
      default:
        return { color: 'text-gray-500', icon: '⚪', label: 'Unknown' };
    }
  };

  const status = getConnectionStatus();

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 text-lg">💬</span>
          <span className="font-semibold">Chat</span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className={status.color}>{status.icon}</span>
            <span className={status.color}>{status.label}</span>
            {hasPendingMessages && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                {queueLength} pending
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {performanceMetrics.messageRate > 0 && (
            <span className="text-xs text-gray-500">
              {performanceMetrics.messageRate}/s
            </span>
          )}
          <button
            onClick={onClose}
            className="h-8 w-8 p-0 bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 border-b border-gray-200 overflow-y-auto p-4">
        {chatLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              chatMessages.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.userRole === 'admin' ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      msg.userRole === 'admin'
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {msg.userName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    {msg.text && (
                      <p className="text-sm">{msg.text}</p>
                    )}
                    {msg.imageData && (
                      <img
                        src={msg.imageData}
                        alt="Shared image"
                        className="mt-2 max-w-full h-auto rounded"
                      />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
              disabled={connectionState !== 'connected'}
            />
            {isTyping && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                Typing...
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <label className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-gray-600">📷</span>
            </label>
            
            <button
              type="submit"
              disabled={!message.trim() && !imageFile || connectionState !== 'connected'}
              className={`w-10 h-10 p-0 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              📤
            </button>
          </div>
        </form>
        
        {imageFile && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span>📎 {imageFile.name}</span>
            <button
              onClick={() => setImageFile(null)}
              className="h-6 text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}
        
        {connectionState !== 'connected' && (
          <div className="mt-2 text-xs text-red-500">
            {connectionState === 'disconnected' 
              ? "Waiting to reconnect..." 
              : "Please wait while we establish connection..."}
          </div>
        )}
      </div>
    </div>
  );
}