'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationManager } from '@/components/NotificationManager';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'fire' | 'police' | 'medical' | 'barangay' | 'other';
  location: string;
  description?: string;
}

export function EmergencyContactsInSafetyTips() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    type: 'fire' as EmergencyContact['type'],
    location: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/emergency-contacts');
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
      } else {
        console.error('Failed to load contacts:', data.error);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      notificationManager.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/emergency-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newContact,
          createdBy: user?.uid || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts(prev => [...prev, data.contact]);
        setNewContact({
          name: '',
          phone: '',
          type: 'fire',
          location: '',
          description: ''
        });
        setShowAddForm(false);
        notificationManager.success('Emergency contact added successfully');
      } else {
        console.error('Failed to add contact:', data.error);
        notificationManager.error('Failed to add contact: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      notificationManager.error('Error adding contact');
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/emergency-contacts?id=${contactId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setContacts(prev => prev.filter(c => c.id !== contactId));
        notificationManager.success('Emergency contact deleted successfully');
      } else {
        console.error('Failed to delete contact:', data.error);
        notificationManager.error('Failed to delete contact: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      notificationManager.error('Error deleting contact');
    }
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'police': return '🚓';
      case 'medical': return '🏥';
      case 'barangay': return '🏘️';
      default: return '📞';
    }
  };

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'fire': return 'Fire Station';
      case 'police': return 'Police Station';
      case 'medical': return 'Medical Center';
      case 'barangay': return 'Barangay Hall';
      default: return 'Other Service';
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Emergency Contacts</h3>
        {user.role === 'admin' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:opacity-90"
          >
            ➕ Add Contact
          </button>
        )}
      </div>

      {showAddForm && user.role === 'admin' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Add New Emergency Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Name</label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Manila Fire Station"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., +63 2 123 4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Type</label>
              <select
                value={newContact.type}
                onChange={(e) => setNewContact({...newContact, type: e.target.value as EmergencyContact['type']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="fire">Fire Station</option>
                <option value="police">Police Station</option>
                <option value="medical">Medical Center</option>
                <option value="barangay">Barangay Hall</option>
                <option value="other">Other Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={newContact.location}
                onChange={(e) => setNewContact({...newContact, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Manila, Metro Manila"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={newContact.description}
                onChange={(e) => setNewContact({...newContact, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Additional information about this contact..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addContact}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
            >
              Add Contact
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-4">
          Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>No emergency contacts available yet.</p>
          {user.role === 'admin' && (
            <p className="text-sm mt-2">Admins can add emergency contacts using the button above.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {getContactIcon(contact.type)}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{contact.name}</div>
                    <div className="text-sm text-gray-600">{getContactTypeLabel(contact.type)}</div>
                    <div className="text-sm text-gray-600 mt-1">📍 {contact.location}</div>
                    {contact.description && (
                      <div className="text-sm text-gray-700 mt-2">{contact.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-lg font-bold text-primary">📞 {contact.phone}</div>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Note:</strong> Emergency contacts are displayed based on your location and the type of emergency.
          Admins can add, edit, and manage emergency contacts for their area.
        </div>
      </div>
    </div>
  );
}