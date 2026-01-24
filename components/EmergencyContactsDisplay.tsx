'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

interface EmergencyContactsDisplayProps {
  userLocation?: { lat: number; lng: number } | null;
}

export function EmergencyContactsDisplay({ userLocation }: EmergencyContactsDisplayProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emergency-contacts');
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
      } else {
        console.error('Failed to fetch emergency contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'police': return '🚓';
      case 'medical': return '🏥';
      case 'other': return '📞';
      default: return '📞';
    }
  };

  const getContactColor = (type: string) => {
    switch (type) {
      case 'fire': return 'bg-red-500';
      case 'police': return 'bg-blue-500';
      case 'medical': return 'bg-green-500';
      case 'other': return 'bg-gray-500';
      default: return 'bg-gray-500';
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

  if (!user || user.role !== 'resident') {
    return null;
  }

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
                    <div className="text-sm text-gray-600 capitalize">{contact.type}</div>
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
                    <div><strong>Type:</strong> {contact.type}</div>
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