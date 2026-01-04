'use client';

import { useEffect, useState } from 'react';
import type { NotificationData } from '@/types';

interface NotificationProps {
  notification: NotificationData;
  onClose: () => void;
}

export function Notification({ notification, onClose }: NotificationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState
    requestAnimationFrame(() => {
      setShow(true);
    });
    const timer = setTimeout(() => { 
      setShow(false);
      setTimeout(onClose, 300);
    }, notification.duration || 2000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'warning': return 'border-l-yellow-500';
      case 'info': return 'border-l-blue-500';
      default: return 'border-l-primary';
    }
  };

  return (
    <div
      className={`fixed top-6 right-6 bg-white text-gray-800 p-4 rounded-lg shadow-xl z-50 flex items-center gap-3 max-w-sm border-l-4 ${getBorderColor()} transform transition-transform duration-300 ${
        show ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="text-xl">{getIcon()}</div>
      <div className="flex-1">{notification.message}</div>
      <button
        onClick={() => {
          setShow(false);
          setTimeout(onClose, 300);
        }}
        className="text-gray-500 hover:text-gray-700 text-xl leading-none"
      >
        ×
      </button>
    </div>
  );
}

