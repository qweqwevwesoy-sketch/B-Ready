'use client';

import { useState, useEffect } from 'react';
import { Notification } from './Notification';
import type { NotificationData } from '@/types';

let notificationIdCounter = 0;
const notificationQueue: NotificationData[] = [];
let notificationListeners: Array<(notifications: NotificationData[]) => void> = [];

function addNotification(notification: Omit<NotificationData, 'id'>) {
  const id = `notification-${notificationIdCounter++}`;
  const newNotification: NotificationData = { ...notification, id };
  notificationQueue.push(newNotification);
  notificationListeners.forEach((listener) => listener([...notificationQueue]));
}
 
function removeNotification(id: string) {
  const index = notificationQueue.findIndex((n) => n.id === id);
  if (index !== -1) {
    notificationQueue.splice(index, 1);
    notificationListeners.forEach((listener) => listener([...notificationQueue]));
  }
}

export const notificationManager = {
  show: (message: string, type: NotificationData['type'] = 'info', duration = 2000) => {
    addNotification({ message, type, duration });
  },
  success: (message: string, duration?: number) => {
    addNotification({ message, type: 'success', duration: duration || 2000 });
  },
  error: (message: string, duration?: number) => {
    addNotification({ message, type: 'error', duration: duration || 5000 });
  },
  warning: (message: string, duration?: number) => {
    addNotification({ message, type: 'warning', duration: duration || 3000 });
  },
  info: (message: string, duration?: number) => {
    addNotification({ message, type: 'info', duration: duration || 2000 });
  },
};

export function NotificationContainer() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const listener = (newNotifications: NotificationData[]) => {
      setNotifications(newNotifications);
    };
    notificationListeners.push(listener);
    // Initialize with requestAnimationFrame to avoid synchronous setState
    requestAnimationFrame(() => {
      setNotifications([...notificationQueue]);
    });

    return () => {
      notificationListeners = notificationListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-6 right-6 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

