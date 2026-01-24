'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker').then(mod => mod.MapPicker), { ssr: false });
import { notificationManager } from '@/components/NotificationManager';

interface EmergencyContact {
  id: string;
  name: string;
  type: 'fire' | 'police' | 'medical' | 'other';
  phone: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function EmergencyContactsAdmin() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    type: 'fire' as EmergencyContact['type'],
    phone: '',
    address: '',
    location: { lat: 0, lng: 0 }
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchContacts();
    }
  }, [user?.role]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emergency-contacts');
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
      } else {
        notificationManager.error('Failed to fetch emergency contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      notificationManager.error('Error fetching emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.type || !newContact.phone) {
      notificationManager.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/emergency-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContact),
      });

      const data = await response.json();

      if (data.success) {
        notificationManager.success('Emergency contact added successfully');
        setNewContact({ name: '', type: 'fire', phone: '', address: '', location: { lat: 0, lng: 0 } });
        setShowAddForm(false);
        fetchContacts();
      } else {
        notificationManager.error(data.error || 'Failed to add emergency contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      notificationManager.error('Error adding emergency contact');
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) {
      return;
    }

    try {
      const response = await fetch(`/api/emergency-contacts?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        notificationManager.success('Emergency contact deleted successfully');
        fetchContacts();
      } else {
        notificationManager.error(data.error || 'Failed to delete emergency contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      notificationManager.error('Error deleting emergency contact');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Emergency Contacts</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
        >
          + Add Contact
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addContact} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Name</label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={newContact.type}
                onChange={(e) => setNewContact({ ...newContact, type: e.target.value as EmergencyContact['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="fire">Fire Department</option>
                <option value="police">Police</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                value={newContact.address}
                onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newContact.address || ''}
                  readOnly
                  placeholder="Click 'Select Location' to set coordinates"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  📍 Select Location
                </button>
              </div>
              {newContact.location.lat !== 0 && newContact.location.lng !== 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Coordinates: {newContact.location.lat.toFixed(6)}, {newContact.location.lng.toFixed(6)}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
            >
              Add Contact
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showMapPicker && (
        <MapPicker
          onSelect={(address) => {
            setNewContact(prev => ({ ...prev, address }));
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {loading ? (
        <div className="text-center py-4">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No emergency contacts found</div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-gray-600 capitalize">{contact.type}</div>
                <div className="text-sm text-gray-600">{contact.phone}</div>
                {contact.address && <div className="text-sm text-gray-500">{contact.address}</div>}
              </div>
              <button
                onClick={() => deleteContact(contact.id)}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}