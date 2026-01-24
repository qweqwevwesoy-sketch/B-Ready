'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationManager } from '@/components/NotificationManager';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'emergency';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function NotificationSystem() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'warning' | 'emergency'>('info');

  useEffect(() => {
    if (user?.role === 'admin') {
      // Load recent notifications from localStorage or API
      const savedNotifications = localStorage.getItem('bready_notifications');
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
        } catch (error) {
          console.error('Error parsing notifications:', error);
        }
      } else {
        // Create some sample notifications
        const sampleNotifications: Notification[] = [
          {
            id: '1',
            type: 'info',
            title: 'System Update',
            message: 'Emergency stations database has been updated with new locations.',
            timestamp: new Date().toISOString(),
            read: false
          },
          {
            id: '2',
            type: 'warning',
            title: 'High Alert',
            message: 'Multiple flood reports received in Metro Manila area.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: false
          }
        ];
        setNotifications(sampleNotifications);
        localStorage.setItem('bready_notifications', JSON.stringify(sampleNotifications));
      }
    }
  }, [user?.role]);

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('bready_notifications', JSON.stringify(updated));
  };

  const sendAlert = async () => {
    if (!alertMessage.trim()) {
      notificationManager.error('Please enter an alert message');
      return;
    }

    const newAlert: Notification = {
      id: Date.now().toString(),
      type: alertType,
      title: alertType === 'emergency' ? 'EMERGENCY ALERT' : alertType === 'warning' ? 'WARNING' : 'Information',
      message: alertMessage,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updated = [newAlert, ...notifications];
    setNotifications(updated);
    localStorage.setItem('bready_notifications', JSON.stringify(updated));
    
    notificationManager.success('Alert sent successfully');
    setAlertMessage('');
    setShowAlertForm(false);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('bready_notifications', JSON.stringify(updated));
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Admin Notifications</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAlertForm(!showAlertForm)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:opacity-90"
          >
            🚨 Send Alert
          </button>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-sm rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {showAlertForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Send Emergency Alert</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Alert Type</label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your alert message..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={sendAlert}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
              >
                Send Alert
              </button>
              <button
                onClick={() => setShowAlertForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border border-gray-200 rounded-lg p-4 ${
                !notification.read ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      notification.type === 'emergency' 
                        ? 'bg-red-100 text-red-800' 
                        : notification.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-sm text-yellow-800">
          <strong>Note:</strong> This is a basic notification system. In a production environment, 
          you would integrate with Firebase Cloud Messaging or similar services for real-time push notifications.
        </div>
      </div>
    </div>
  );
}