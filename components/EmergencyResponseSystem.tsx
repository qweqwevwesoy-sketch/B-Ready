'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { notificationManager } from '@/components/NotificationManager';

const MapPicker = dynamic(() => import('./MapPicker').then(mod => mod.MapPicker), { ssr: false });

interface EmergencyContact {
  id: string;
  name: string;
  type: 'fire' | 'police' | 'medical' | 'barangay' | 'other';
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

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface EmergencyResponseSystemProps {
  userLocation?: { lat: number; lng: number } | null;
  variant?: 'admin' | 'display' | 'safety-tips';
}

export function EmergencyResponseSystem({ userLocation, variant = 'display' }: EmergencyResponseSystemProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    type: 'fire' as EmergencyContact['type'],
    phone: '',
    address: '',
    location: { lat: 0, lng: 0 }
  });

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch emergency contacts
      const contactsResponse = await fetch('/api/emergency-contacts');
      const contactsData = await contactsResponse.json();

      // Fetch stations
      const stationsResponse = await fetch('/api/stations');
      const stationsData = await stationsResponse.json();

      if (contactsData.success && stationsData.success) {
        setContacts(contactsData.contacts);
        setStations(stationsData.stations);
      } else {
        console.error('Failed to fetch data');
        if (variant === 'admin') {
          notificationManager.error('Failed to fetch emergency response data');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (variant === 'admin') {
        notificationManager.error('Error fetching emergency response data');
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
      const endpoint = newContact.type === 'fire' ? '/api/stations' : '/api/emergency-contacts';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newContact.name,
          type: newContact.type,
          phone: newContact.phone,
          address: newContact.address,
          lat: newContact.location.lat,
          lng: newContact.location.lng,
          created_by: user?.uid || 'admin'
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (variant === 'admin') {
          notificationManager.success(newContact.type === 'fire' ? 'Station added successfully' : 'Emergency contact added successfully');
        } else {
          alert(newContact.type === 'fire' ? 'Station added successfully' : 'Emergency contact added successfully');
        }
        setNewContact({ name: '', type: 'fire', phone: '', address: '', location: { lat: 0, lng: 0 } });
        setShowAddForm(false);
        fetchData();
      } else {
        const errorMsg = data.error || (newContact.type === 'fire' ? 'Failed to add station' : 'Failed to add emergency contact');
        if (variant === 'admin') {
          notificationManager.error(errorMsg);
        } else {
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      const errorMsg = newContact.type === 'fire' ? 'Error adding station' : 'Error adding emergency contact';
      if (variant === 'admin') {
        notificationManager.error(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
  };

  const deleteItem = async (id: string, isStation: boolean) => {
    const confirmDelete = variant === 'admin'
      ? confirm(`Are you sure you want to delete this ${isStation ? 'station' : 'emergency contact'}?`)
      : window.confirm(`Are you sure you want to delete this ${isStation ? 'station' : 'emergency contact'}?`);

    if (!confirmDelete) {
      return;
    }

    try {
      const endpoint = isStation ? `/api/stations?id=${id}` : `/api/emergency-contacts?id=${id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        if (variant === 'admin') {
          notificationManager.success(isStation ? 'Station deleted successfully' : 'Emergency contact deleted successfully');
        } else {
          alert(isStation ? 'Station deleted successfully' : 'Emergency contact deleted successfully');
        }
        fetchData();
      } else {
        const errorMsg = data.error || (isStation ? 'Failed to delete station' : 'Failed to delete emergency contact');
        if (variant === 'admin') {
          notificationManager.error(errorMsg);
        } else {
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      const errorMsg = isStation ? 'Error deleting station' : 'Error deleting emergency contact';
      if (variant === 'admin') {
        notificationManager.error(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
  };

  const startEditing = (item: EmergencyContact | Station, isStation: boolean) => {
    setEditingId(item.id);
    if (isStation) {
      const station = item as Station;
      setNewContact({
        name: station.name,
        type: 'fire',
        phone: station.phone || '',
        address: station.address,
        location: { lat: station.lat, lng: station.lng }
      });
    } else {
      const contact = item as EmergencyContact;
      setNewContact({
        name: contact.name,
        type: contact.type,
        phone: contact.phone,
        address: contact.address || '',
        location: contact.location || { lat: 0, lng: 0 }
      });
    }
    setShowAddForm(true);
  };

  const updateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const isStation = newContact.type === 'fire';
      const endpoint = isStation ? '/api/stations' : '/api/emergency-contacts';

      const updateData = {
        id: editingId,
        name: newContact.name,
        phone: newContact.phone,
        address: newContact.address,
        ...(isStation && {
          lat: newContact.location.lat,
          lng: newContact.location.lng
        })
      };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        if (variant === 'admin') {
          notificationManager.success(isStation ? 'Station updated successfully' : 'Emergency contact updated successfully');
        } else {
          alert(isStation ? 'Station updated successfully' : 'Emergency contact updated successfully');
        }
        setNewContact({ name: '', type: 'fire', phone: '', address: '', location: { lat: 0, lng: 0 } });
        setShowAddForm(false);
        setEditingId(null);
        fetchData();
      } else {
        const errorMsg = data.error || (isStation ? 'Failed to update station' : 'Failed to update emergency contact');
        if (variant === 'admin') {
          notificationManager.error(errorMsg);
        } else {
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
      const errorMsg = newContact.type === 'fire' ? 'Error updating station' : 'Error updating emergency contact';
      if (variant === 'admin') {
        notificationManager.error(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
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

  const getDistanceText = (lat: number, lng: number) => {
    if (!userLocation) {
      return 'Distance unknown';
    }
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      lat, lng
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
          <h3 className="text-lg font-semibold">Emergency Response System Management</h3>
          <button
            onClick={() => {
              setEditingId(null);
              setNewContact({ name: '', type: 'fire', phone: '', address: '', location: { lat: 0, lng: 0 } });
              setShowAddForm(!showAddForm);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            ➕ Add {newContact.type === 'fire' ? 'Station' : 'Contact'}
          </button>
        </div>

        {showAddForm && (
          <div className="border-2 border-green-300 rounded-lg p-6 mb-6 bg-green-50">
            <h4 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit' : 'Add New'} {newContact.type === 'fire' ? 'Emergency Station' : 'Emergency Contact'}
            </h4>

            <form onSubmit={editingId ? updateItem : addContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder={newContact.type === 'fire' ? "e.g., Manila Fire Station" : "e.g., Manila Police Station"}
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
                  {editingId ? 'Update' : 'Add'} {newContact.type === 'fire' ? 'Station' : 'Contact'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded font-semibold hover:bg-gray-600"
                >
                  Cancel
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setNewContact({ name: '', type: 'fire', phone: '', address: '', location: { lat: 0, lng: 0 } });
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                  >
                    Add New Instead
                  </button>
                )}
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

        {loading ? (
          <div className="text-center py-4">Loading emergency response data...</div>
        ) : (
          <div className="space-y-6">
            {/* Fire Stations Section */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-red-600">🔥 Fire Stations</h4>
              {stations.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No fire stations found</div>
              ) : (
                <div className="space-y-4">
                  {stations.map((station) => (
                    <div key={station.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold">{station.name}</h4>
                            <span className="text-sm text-gray-500">Fire Station</span>
                          </div>
                          {station.phone && <div className="text-sm text-gray-600 mb-1">📞 {station.phone}</div>}
                          {station.email && <div className="text-sm text-gray-600 mb-1">📧 {station.email}</div>}
                          {station.website && <div className="text-sm text-gray-600 mb-1">🌐 {station.website}</div>}
                          <div className="text-sm text-gray-600 mb-1">{station.address}</div>
                          <div className="text-xs text-gray-400">
                            Coordinates: {station.lat.toFixed(6)}, {station.lng.toFixed(6)}
                          </div>
                          {station.description && (
                            <div className="text-sm text-gray-600 mt-2">{station.description}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(station, true)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem(station.id, true)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
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

            {/* Other Emergency Contacts Section */}
            <div>
              <h4 className="text-lg font-semibold mb-3">🚨 Other Emergency Contacts</h4>
              {contacts.length === 0 ? (
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
                          <div className="text-sm text-gray-600 mb-1">📞 {contact.phone}</div>
                          {contact.address && <div className="text-sm text-gray-600 mb-2">{contact.address}</div>}
                          {contact.location && (
                            <div className="text-xs text-gray-400">
                              Coordinates: {contact.location.lat.toFixed(6)}, {contact.location.lng.toFixed(6)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(contact, false)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem(contact.id, false)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
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
          </div>
        )}
      </div>
    );
  }

  // Display variant - user-facing with distance calculation
  if (variant === 'display') {
    // Combine stations and contacts, with stations as fire type
    interface CombinedItem extends EmergencyContact {
      isStation?: boolean;
      email?: string;
      website?: string;
      description?: string;
    }

    const allItems: CombinedItem[] = [
      ...stations.map(station => ({
        id: station.id,
        name: station.name,
        type: 'fire' as const,
        phone: station.phone || 'No phone available',
        address: station.address,
        location: { lat: station.lat, lng: station.lng },
        isStation: true,
        email: station.email,
        website: station.website,
        description: station.description,
        created_by: station.created_by || '',
        created_at: station.created_at || '',
        updated_at: station.updated_at || ''
      })),
      ...contacts
    ];

    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Emergency Response System</h3>
          <div className="text-sm text-gray-600">
            {userLocation ? 'Near your location' : 'Available services'}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading emergency response data...</div>
        ) : allItems.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No emergency response services available
          </div>
        ) : (
          <div className="space-y-3">
            {allItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${getContactColor(item.type)} rounded-full flex items-center justify-center text-white font-bold`}>
                      {getContactIcon(item.type)}
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{getContactTypeLabel(item.type)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{item.phone}</div>
                    {userLocation && item.location && (
                      <div className="text-xs text-gray-500">{getDistanceText(item.location.lat, item.location.lng)}</div>
                    )}
                  </div>
                </div>

                {item.address && (
                  <div className="text-sm text-gray-600 mb-3">{item.address}</div>
                )}

                {item.isStation && item.description && (
                  <div className="text-sm text-gray-600 mb-3 italic">{item.description}</div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCallContact(item.phone)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                  >
                    📞 Call
                  </button>
                  <button
                    onClick={() => handleCopyPhone(item.phone)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => setShowDetails(showDetails === item.id ? null : item.id)}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
                  >
                    {showDetails === item.id ? 'Hide' : 'More'}
                  </button>
                </div>

                {showDetails === item.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Contact Details:</div>
                      <div><strong>Type:</strong> {getContactTypeLabel(item.type)}</div>
                      <div><strong>Phone:</strong> {item.phone}</div>
                      {item.address && <div><strong>Address:</strong> {item.address}</div>}
                      {item.location && (
                        <div>
                          <strong>Location:</strong> {item.location.lat.toFixed(6)}, {item.location.lng.toFixed(6)}
                        </div>
                      )}
                      {item.isStation && item.email && <div><strong>Email:</strong> {item.email}</div>}
                      {item.isStation && item.website && <div><strong>Website:</strong> {item.website}</div>}
                      {item.isStation && item.description && <div><strong>Description:</strong> {item.description}</div>}
                      <div className="text-xs text-gray-600 mt-2">
                        Last updated: {new Date(item.updated_at || item.created_at).toLocaleDateString()}
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
        <h3 className="text-lg font-semibold">Emergency Response System</h3>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-4">
          Loading emergency response data...
        </div>
      ) : (
        <div>
          {/* Fire Stations Section */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-red-600">🔥 Fire Stations</h4>
            {stations.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p>No fire stations available yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stations.map((station) => (
                  <div
                    key={station.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                          🔥
                        </div>
                        <div>
                          <div className="font-bold text-lg">{station.name}</div>
                          <div className="text-sm text-gray-600">Fire Station</div>
                          <div className="text-sm text-gray-600 mt-1">📍 {station.address}</div>
                          {station.phone && (
                            <div className="text-sm text-gray-700 mt-2">📞 {station.phone}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {station.phone && (
                          <div className="text-lg font-bold text-primary">📞 {station.phone}</div>
                        )}
                        {user?.role === 'admin' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(station, true)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteItem(station.id, true)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Other Emergency Contacts Section */}
          <div>
            <h4 className="text-md font-semibold mb-3">🚨 Other Emergency Contacts</h4>
            {contacts.length === 0 ? (
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(contact, false)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteItem(contact.id, false)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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