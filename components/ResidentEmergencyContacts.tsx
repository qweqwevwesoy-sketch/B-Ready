'use client';

import { useState, useEffect } from 'react';
import type { EmergencyContact } from '@/types';

// Default offline emergency contacts data
const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'default_fire',
    name: 'Manila Fire Station',
    type: 'fire',
    phone: '+63 2 8527 7000',
    address: '1015 Padre Burgos Ave, Ermita, Manila',
    location: { lat: 14.5820, lng: 120.9730 },
    description: 'Main fire station for Manila City',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default_police',
    name: 'Manila Police Station',
    type: 'police',
    phone: '+63 2 8527 0000',
    address: '275 Padre Burgos Ave, Ermita, Manila',
    location: { lat: 14.5800, lng: 120.9750 },
    description: 'Central police station for Manila',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default_medical',
    name: 'Philippine General Hospital',
    type: 'medical',
    phone: '+63 2 8554 8400',
    address: 'Taft Avenue, Ermita, Manila',
    location: { lat: 14.5600, lng: 120.9890 },
    description: 'National university hospital',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default_barangay',
    name: 'Barangay San Antonio',
    type: 'barangay',
    phone: '+63 2 8527 1234',
    address: 'San Antonio St, Ermita, Manila',
    location: { lat: 14.5800, lng: 120.9700 },
    description: 'Local barangay hall for community assistance',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

interface ResidentEmergencyContactsProps {
  onRefresh?: () => void;
}

export function ResidentEmergencyContacts({ onRefresh }: ResidentEmergencyContactsProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emergency-contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        
        // Cache data locally for offline access
        try {
          localStorage.setItem('bready_emergency_contacts', JSON.stringify(data.contacts || []));
        } catch (storageError) {
          console.warn('Failed to cache emergency contacts locally:', storageError);
        }
      } else {
        throw new Error('Failed to load contacts');
      }
    } catch (error) {
      console.error('Error loading contacts from API:', error);

      // Try to load from local cache first
      try {
        const cachedContacts = localStorage.getItem('bready_emergency_contacts');

        if (cachedContacts) {
          setContacts(JSON.parse(cachedContacts));
          console.log('✅ Loaded emergency contacts from local cache');
        } else {
          // No cached data, use defaults
          setContacts(DEFAULT_EMERGENCY_CONTACTS);
          console.log('ℹ️ Using default emergency contacts (no cache available)');
        }
      } catch (cacheError) {
        console.error('Error loading from cache:', cacheError);
        // Use default data
        setContacts(DEFAULT_EMERGENCY_CONTACTS);
      }
    } finally {
      setLoading(false);
    }
  };

  const getContactTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      fire: 'Fire Station',
      police: 'Police Station',
      medical: 'Medical Center',
      barangay: 'Barangay Hall',
      other: 'Other Service'
    };
    return typeLabels[type] || type;
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <div className="mt-8 bg-white rounded-xl p-6 shadow-lg border">
      <h2 className="text-2xl font-bold mb-6">Emergency Contacts</h2>
      
      {loading ? (
        <div className="text-center py-4">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No emergency contacts available</div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold">{contact.name}</h4>
                    <span className="text-sm text-blue-600 capitalize bg-blue-100 px-2 py-1 rounded">
                      {getContactTypeLabel(contact.type)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Phone:</span> {contact.phone}
                  </div>
                  {contact.address && (
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Address:</span> {contact.address}
                    </div>
                  )}
                  {contact.location && (
                    <div className="text-xs text-gray-400 mb-2">
                      <span className="font-medium">Location:</span> {contact.location.lat.toFixed(6)}, {contact.location.lng.toFixed(6)}
                    </div>
                  )}
                  {contact.description && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Details:</span> {contact.description}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedContact(contact)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    View Details
                  </button>
                  <a
                    href={`tel:${contact.phone}`}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    Call
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedContact.name}</h3>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-600">Type:</span>
                <span className="ml-2 text-blue-600 capitalize bg-blue-100 px-2 py-1 rounded text-sm">
                  {getContactTypeLabel(selectedContact.type)}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Phone:</span>
                <a href={`tel:${selectedContact.phone}`} className="ml-2 text-blue-600 hover:underline">
                  {selectedContact.phone}
                </a>
              </div>
              {selectedContact.address && (
                <div>
                  <span className="font-medium text-gray-600">Address:</span>
                  <p className="ml-2 text-gray-700">{selectedContact.address}</p>
                </div>
              )}
              {selectedContact.location && (
                <div>
                  <span className="font-medium text-gray-600">Coordinates:</span>
                  <p className="ml-2 text-gray-700">
                    {selectedContact.location.lat.toFixed(6)}, {selectedContact.location.lng.toFixed(6)}
                  </p>
                </div>
              )}
              {selectedContact.description && (
                <div>
                  <span className="font-medium text-gray-600">Description:</span>
                  <p className="ml-2 text-gray-700">{selectedContact.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <a
                href={`tel:${selectedContact.phone}`}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-center hover:bg-green-700 font-semibold"
              >
                Call Now
              </a>
              <button
                onClick={() => setSelectedContact(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}