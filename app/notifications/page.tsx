'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  target_users: string;
  created_at: string;
  read_at: string | null;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    targetUsers: 'all'
  });

  const notificationTypes = [
    { value: 'info', label: 'Information' },
    { value: 'warning', label: 'Warning' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'success', label: 'Success' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const targetUsers = [
    { value: 'all', label: 'All Users' },
    { value: 'residents', label: 'Residents Only' },
    { value: 'admins', label: 'Admins Only' }
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        fetchNotifications();
        setShowAddForm(false);
        setFormData({
          title: '',
          message: '',
          type: 'info',
          priority: 'medium',
          targetUsers: 'all'
        });
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      alert('Error saving notification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchNotifications();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error deleting notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'emergency': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'success': return 'border-green-200 bg-green-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p>This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">Send alerts and updates to your community</p>
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium"
            >
              + Send Alert
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <div className="text-blue-500 text-2xl">📢</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emergency</p>
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.type === 'emergency').length}
                </p>
              </div>
              <div className="text-red-500 text-2xl">🚨</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.priority === 'high' || n.priority === 'critical').length}
                </p>
              </div>
              <div className="text-orange-500 text-2xl">⚠️</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => new Date(n.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <div className="text-green-500 text-2xl">📅</div>
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white p-12 rounded-lg text-center shadow">
              <div className="text-gray-400 text-4xl mb-4">📢</div>
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-gray-600 mb-6">Send alerts to keep your community informed</p>
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium"
              >
                + Send First Alert
              </button>
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className={`border-l-4 ${getTypeColor(notification.type)} p-6 rounded-lg shadow`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <h3 className="text-lg font-semibold">{notification.title}</h3>
                      <span className={`w-3 h-3 rounded-full ${getPriorityColor(notification.priority)}`}></span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">{notification.type}</span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">{notification.priority}</span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{notification.message}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{notification.target_users}</span>
                      <span>📅 {new Date(notification.created_at).toLocaleDateString()}</span>
                      <span>⏰ {new Date(notification.created_at).toLocaleTimeString()}</span>
                      {notification.read_at && (
                        <span className="text-green-600">✅ Read</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Notification Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Send New Alert</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Alert Title</label>
                  <input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Important Community Update"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Enter your alert message here..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {notificationTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="targetUsers" className="block text-sm font-medium text-gray-700">Target Users</label>
                  <select
                    id="targetUsers"
                    value={formData.targetUsers}
                    onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {targetUsers.map((target) => (
                      <option key={target.value} value={target.value}>{target.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium">
                    Send Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({
                        title: '',
                        message: '',
                        type: 'info',
                        priority: 'medium',
                        targetUsers: 'all'
                      });
                    }}
                    className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}