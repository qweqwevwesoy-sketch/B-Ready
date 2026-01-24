'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface EmergencyContact {
  id: string;
  name: string;
  phone_number: string;
  type: string;
  location: string | null;
  description: string | null;
  created_at: string;
}

export default function EmergencyContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    type: '',
    location: '',
    description: ''
  });

  const contactTypes = [
    'Police Station',
    'Fire Station', 
    'Hospital',
    'Ambulance Service',
    'Disaster Response',
    'Community Center',
    'Other'
  ];

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
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/emergency-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phoneNumber: formData.phoneNumber
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchContacts();
        setShowAddForm(false);
        setEditingContact(null);
        setFormData({ name: '', phoneNumber: '', type: '', location: '', description: '' });
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Error saving contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const response = await fetch(`/api/emergency-contacts?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchContacts();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Error deleting contact');
    }
  };

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phone_number,
      type: contact.type,
      location: contact.location || '',
      description: contact.description || ''
    });
    setShowAddForm(true);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
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
              <h1 className="text-3xl font-bold text-gray-900">Emergency Contacts</h1>
              <p className="text-gray-600 mt-1">Manage emergency contact information for your community</p>
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium"
            >
              + Add Contact
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </div>
              <div className="text-blue-500 text-2xl">👥</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Police/Fire</p>
                <p className="text-2xl font-bold">
                  {contacts.filter(c => c.type.includes('Police') || c.type.includes('Fire')).length}
                </p>
              </div>
              <div className="text-red-500 text-2xl">📞</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medical</p>
                <p className="text-2xl font-bold">
                  {contacts.filter(c => c.type.includes('Hospital') || c.type.includes('Ambulance')).length}
                </p>
              </div>
              <div className="text-green-500 text-2xl">📍</div>
            </div>
          </div>
        </div>

        {/* Contact List */}
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="bg-white p-12 rounded-lg text-center shadow">
              <div className="text-gray-400 text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">No Emergency Contacts</h3>
              <p className="text-gray-600 mb-6">Add emergency contacts to help your community stay safe</p>
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium"
              >
                + Add First Contact
              </button>
            </div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{contact.name}</h3>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">{contact.type}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📞</span>
                        <span>{contact.phone_number}</span>
                      </div>
                      {contact.location && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📍</span>
                          <span>{contact.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {contact.description && (
                      <p className="mt-2 text-gray-700">{contact.description}</p>
                    )}
                    
                    <p className="mt-2 text-xs text-gray-500">
                      Added: {new Date(contact.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
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

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editingContact ? 'Edit Contact' : 'Add Emergency Contact'}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Contact Name</label>
                  <input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Manila Fire Station"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: formatPhoneNumber(e.target.value) })}
                    placeholder="(555) 123-4567"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">Contact Type</label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a type...</option>
                    {contactTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location (Optional)</label>
                  <input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., 123 Main St, Manila"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                  <input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional information about this contact"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium">
                    {editingContact ? 'Update Contact' : 'Add Contact'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingContact(null);
                      setFormData({ name: '', phoneNumber: '', type: '', location: '', description: '' });
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