'use client';

import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { notificationManager } from '@/components/NotificationManager';
import { 
  fetchEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact
} from '@/lib/firebase-service';
import type { EmergencyContact } from '@/types';

const MapPicker = dynamic(() => import('./MapPicker').then(mod => mod.MapPicker), { ssr: false });

interface EmergencyContactsProps {
  userLocation?: { lat: number; lng: number } | null;
  variant?: 'admin' | 'display' | 'safety-tips';
}

export function EmergencyContacts({ userLocation, variant = 'display' }: EmergencyContactsProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    type: 'fire' as EmergencyContact['type'],
    phone: '',
    address: '',
    location: { lat: 0, lng: 0 }
  });
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [user?.role]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const contactsData = await fetchEmergencyContacts();
      setContacts(contactsData);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      if (variant === 'admin') {
        notificationManager.error('Error fetching emergency contacts');
      }
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.type || !newContact.phone) {
      if (variant === 'admin') {
        notificationManager.error('Please fill in all required fields');
      } else {
        alert('Please fill in all required fields');
      }
      return;
    }

    try {
      await createEmergencyContact({
        name: newContact.name,
        type: newContact.type,
        phone: newContact.phone,
        address: newContact.address || '',
        location: newContact.location
      });
      if (variant === 'admin') {
        notificationManager.success('Emergency contact added successfully');
      } else {
        alert('Emergency contact added successfully');
      }
      setNewContact({ name: '', type: 'fire', phone: '', address: '', location: { lat: 0, lng: 0 } });
      setShowAddForm(false);
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      const errorMsg = 'Error adding emergency contact';
      if (variant === 'admin') {
        notificationManager.error(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
  };

  const deleteContact = async (id: string) => {
    const confirmDelete = variant === 'admin' 
      ? confirm('Are you sure you want to delete this emergency contact?')
      : window.confirm('Are you sure you want to delete this emergency contact?');

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteEmergencyContact(id);
      if (variant === 'admin') {
        notificationManager.success('Emergency contact deleted successfully');
      } else {
        alert('Emergency contact deleted successfully');
      }
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      const errorMsg = 'Error deleting emergency contact';
      if (variant === 'admin') {
        notificationManager.error(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
  };

  const editContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    if (!editingContact.name || !editingContact.type || !editingContact.phone) {
      if (variant === 'admin') {
        notificationManager.error('Please fill in all required fields');
      } else {
        alert('Please fill in all required fields');
      }
      return;
    }

    try {
      await updateEmergencyContact(editingContact.id, editingContact);
      if (variant === 'admin') {
        notificationManager.success('Emergency contact updated successfully');
      } else {
        alert('Emergency contact updated successfully');
      }
      setEditingContact(null);
      setShowEditForm(null);
      fetchContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      const errorMsg = 'Error updating emergency contact';
      if (variant === 'admin') {
        notificationManager.error(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
  };

  const startEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setShowEditForm(contact.id);
    // Reset the newContact form to avoid confusion
    setNewContact({
      name: '',
      type: 'fire',
      phone: '',
      address: '',
      location: { lat: 0, lng: 0 }
    });
  };

  const cancelEdit = () => {
    setEditingContact(null);
    setShowEditForm(null);
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'police': return '🚓';
      case 'medical': return '🏥';
      case 'barangay': return '🏘️';
      case 'other': return '📞';
      default: return '📞';
    }
  };

  const getContactColor = (type: string) => {
    switch (type) {
      case 'fire': return 'bg-red-500';
      case 'police': return 'bg-blue-500';
      case 'medical': return 'bg-green-500';
      case 'barangay': return 'bg-yellow-500';
      case 'other': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'fire': return 'Fire Station';
      case 'police': return 'Police Station';
      case 'medical': return 'Medical Center';
      case 'barangay': return 'Barangay Hall';
      case 'other': return 'Other Service';
      default: return 'Service';
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getDistanceText = (contact: EmergencyContact) => {
    if (!userLocation || !contact.location) {
      return 'Distance unknown';
    }
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      contact.location.lat, contact.location.lng
    );
    return `${distance.toFixed(1)} km away`;
  };

  const handleCallContact = (phone: string) => {
    if (typeof window !== 'undefined') {
      window.open(`tel:${phone}`);
    }
  };

  const handleCopyPhone = (phone: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phone).then(() => {
        notificationManager.success('Phone number copied to clipboard');
      }).catch(() => {
        notificationManager.error('Failed to copy phone number');
      });
    }
  };

  // Admin variant - full management interface
  if (variant === 'admin' && (!user || user.role !== 'admin')) {
    return null;
  }

  // Admin view
  if (variant === 'admin') {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Emergency Contacts Management</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            ➕ Add Contact
          </button>
        </div>

        {showAddForm && (
          <div className="border-2 border-green-300 rounded-lg p-6 mb-6 bg-green-50">
            <h4 className="text-lg font-semibold mb-4">Add New Emergency Contact</h4>

            <form onSubmit={addContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Manila Fire Station"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., +63 2 123 4567"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Type</label>
                  <select
                    value={newContact.type}
                    onChange={(e) => setNewContact({ ...newContact, type: e.target.value as EmergencyContact['type'] })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="fire">Fire Station</option>
                    <option value="police">Police Station</option>
                    <option value="medical">Medical Center</option>
                    <option value="barangay">Barangay Hall</option>
                    <option value="other">Other Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newContact.address || ''}
                      readOnly
                      placeholder="e.g., Manila, Metro Manila"
                      className="flex-1 p-2 border rounded bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Additional information about this contact..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                >
                  Add Contact
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded font-semibold hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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

        {showEditForm && editingContact && (
          <div className="border-2 border-blue-300 rounded-lg p-6 mb-6 bg-blue-50">
            <h4 className="text-lg font-semibold mb-4">Edit Emergency Contact</h4>

            <form onSubmit={editContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={editingContact.name}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Manila Fire Station"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., +63 2 123 4567"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Type</label>
                  <select
                    value={editingContact.type}
                    onChange={(e) => setEditingContact({ ...editingContact, type: e.target.value as EmergencyContact['type'] })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="fire">Fire Station</option>
                    <option value="police">Police Station</option>
                    <option value="medical">Medical Center</option>
                    <option value="barangay">Barangay Hall</option>
                    <option value="other">Other Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingContact.address || ''}
                      readOnly
                      placeholder="e.g., Manila, Metro Manila"
                      className="flex-1 p-2 border rounded bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      📍 Select Location
                    </button>
                  </div>
                  {editingContact.location && editingContact.location.lat !== 0 && editingContact.location.lng !== 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Coordinates: {editingContact.location.lat.toFixed(6)}, {editingContact.location.lng.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={editingContact.address || ''}
                  onChange={(e) => setEditingContact({ 
                    ...editingContact, 
                    address: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                  placeholder="Additional information about this contact..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
                >
                  Update Contact
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-2 bg-gray-500 text-white rounded font-semibold hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No emergency contacts found</div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">{contact.name}</h4>
                      <span className="text-sm text-gray-500 capitalize">{getContactTypeLabel(contact.type)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{contact.phone}</div>
                    {contact.address && <div className="text-sm text-gray-500 mb-2">{contact.address}</div>}
                    {contact.location && (
                      <div className="text-xs text-gray-400">
                        Coordinates: {contact.location.lat.toFixed(6)}, {contact.location.lng.toFixed(6)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditContact(contact)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteContact(contact.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))} 
          </div>
        )}
      </div>
    );
  }

  // Display variant - user-facing with distance calculation
  if (variant === 'display') {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Emergency Contacts</h3>
          <div className="text-sm text-gray-600">
            {userLocation ? 'Near your location' : 'Available services'}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No emergency contacts available
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${getContactColor(contact.type)} rounded-full flex items-center justify-center text-white font-bold`}>
                      {getContactIcon(contact.type)}
                    </div>
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{getContactTypeLabel(contact.type)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{contact.phone}</div>
                    {userLocation && contact.location && (
                      <div className="text-xs text-gray-500">{getDistanceText(contact)}</div>
                    )}
                  </div>
                </div>
                
                {contact.address && (
                  <div className="text-sm text-gray-600 mb-3">{contact.address}</div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCallContact(contact.phone)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                  >
                    📞 Call
                  </button>
                  <button
                    onClick={() => handleCopyPhone(contact.phone)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => setShowDetails(showDetails === contact.id ? null : contact.id)}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
                  >
                    {showDetails === contact.id ? 'Hide' : 'More'}
                  </button>
                </div>

                {showDetails === contact.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Contact Details:</div>
                      <div><strong>Type:</strong> {getContactTypeLabel(contact.type)}</div>
                      <div><strong>Phone:</strong> {contact.phone}</div>
                      {contact.address && <div><strong>Address:</strong> {contact.address}</div>}
                      {contact.location && (
                        <div>
                          <strong>Location:</strong> {contact.location.lat.toFixed(6)}, {contact.location.lng.toFixed(6)}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-2">
                        Last updated: {new Date(contact.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Emergency Hotline:</strong> In case of immediate danger, dial 911 (or your local emergency number)
          </div>
        </div>
      </div>
    );
  }

  // Safety Tips variant - simplified display for safety tips page
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Emergency Contacts</h3>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-4">
          Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>No emergency contacts available yet.</p>
          {user?.role === 'admin' && (
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
                    <div className="text-sm text-gray-600 mt-1">📍 {contact.address || 'Location not specified'}</div>
                    {contact.address && (
                      <div className="text-sm text-gray-700 mt-2">{contact.address}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-lg font-bold text-primary">📞 {contact.phone}</div>
                  {user?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => startEditContact(contact)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                    </>
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