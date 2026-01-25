'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { SafetyTip, EmergencyKitItem, EmergencyContact } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { EmergencyContacts } from './EmergencyContacts';
import { checkAdminPermissions } from '@/lib/client-utils';

// Dynamically import MapPicker to avoid SSR issues
const MapPicker = dynamic(() => import('./MapPicker').then(mod => ({ default: mod.MapPicker })), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading map...</p>
        </div>
      </div>
    </div>
  )
});

interface SafetyTipsAdminProps {
  tips: SafetyTip[];
  emergencyKit: EmergencyKitItem[];
  onRefresh: () => void;
}

export function SafetyTipsAdmin({ tips, emergencyKit, onRefresh }: SafetyTipsAdminProps) {
  const [activeTab, setActiveTab] = useState<'tips' | 'kit' | 'contacts'>('tips');
  const [editingTip, setEditingTip] = useState<SafetyTip | null>(null);
  const [editingKit, setEditingKit] = useState<EmergencyKitItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Emergency Contacts state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: '',
    phone: '',
    type: 'fire',
    address: '',
    location: { lat: 0, lng: 0 },
    description: ''
  });

  const handleSaveTip = async (tipData: Partial<SafetyTip>) => {
    try {
      // Check admin permissions first
      const hasAdminPermissions = await checkAdminPermissions();
      if (!hasAdminPermissions) {
        alert('You do not have permission to edit safety tips. Please contact an administrator.');
        return;
      }

      // Validate required fields
      if (!tipData.title || !tipData.items || tipData.items.length === 0) {
        alert('Please provide a title and at least one item for the safety tip.');
        return;
      }

      if (editingTip) {
        // Update existing tip
        const response = await fetch('/api/safety-tips', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTip.id,
            ...tipData
          }),
        });

        if (response.ok) {
          alert('Safety tip updated successfully');
        } else {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          alert(`Failed to update safety tip: ${errorData.error || 'Unknown error'}`);
        }
      } else {
        // Create new tip
        const response = await fetch('/api/safety-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tipData),
        });

        if (response.ok) {
          alert('Safety tip created successfully');
        } else {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          alert(`Failed to create safety tip: ${errorData.error || 'Unknown error'}`);
        }
      }
      onRefresh();
      setEditingTip(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving tip:', error);
      alert('Error saving safety tip. Please check your internet connection and try again.');
    }
  };

  const handleDeleteTip = async (tipId: string) => {
    if (!confirm('Are you sure you want to delete this safety tip?')) return;

    try {
      // Check admin permissions first
      const hasAdminPermissions = await checkAdminPermissions();
      if (!hasAdminPermissions) {
        alert('You do not have permission to delete safety tips. Please contact an administrator.');
        return;
      }

      const response = await fetch(`/api/safety-tips?id=${tipId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Safety tip deleted successfully');
        onRefresh();
      } else {
        throw new Error('Failed to delete safety tip');
      }
    } catch (error) {
      console.error('Error deleting tip:', error);
      alert('Error deleting safety tip');
    }
  };

  const handleSaveKit = async (kitData: Partial<EmergencyKitItem>) => {
    try {
      // Check admin permissions first
      const hasAdminPermissions = await checkAdminPermissions();
      if (!hasAdminPermissions) {
        alert('You do not have permission to edit emergency kit items. Please contact an administrator.');
        return;
      }

      if (editingKit) {
        // Update existing kit item
        const response = await fetch('/api/safety-tips', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingKit.id,
            ...kitData
          }),
        });

        if (response.ok) {
          alert('Emergency kit item updated successfully');
        } else {
          throw new Error('Failed to update emergency kit item');
        }
      } else {
        // Create new kit item
        const response = await fetch('/api/safety-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kitData),
        });

        if (response.ok) {
          alert('Emergency kit item created successfully');
        } else {
          throw new Error('Failed to create emergency kit item');
        }
      }
      onRefresh();
      setEditingKit(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving emergency kit item:', error);
      alert('Error saving emergency kit item');
    }
  };

  const handleDeleteKit = async (kitId: string) => {
    if (!confirm('Are you sure you want to delete this emergency kit item?')) return;

    try {
      // Check admin permissions first
      const hasAdminPermissions = await checkAdminPermissions();
      if (!hasAdminPermissions) {
        alert('You do not have permission to delete emergency kit items. Please contact an administrator.');
        return;
      }

      const response = await fetch(`/api/safety-tips?id=${kitId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Emergency kit item deleted successfully');
        onRefresh();
      } else {
        throw new Error('Failed to delete emergency kit item');
      }
    } catch (error) {
      console.error('Error deleting emergency kit item:', error);
      alert('Error deleting emergency kit item');
    }
  };

  // Emergency Contacts functions
  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/emergency-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newContact,
          location: newContact.location || { lat: 0, lng: 0 }
        }),
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewContact({
          name: '',
          phone: '',
          type: 'fire',
          address: '',
          location: { lat: 0, lng: 0 },
          description: ''
        });
        // Refresh contacts list
        await loadContacts();
      } else {
        alert('Failed to add emergency contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Error adding emergency contact');
    } finally {
      setLoading(false);
    }
  };

  const startEditContact = (contact: EmergencyContact) => {
    setNewContact(contact);
    setShowEditForm(contact.id);
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/emergency-contacts?id=${contactId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh contacts list
        await loadContacts();
      } else {
        alert('Failed to delete emergency contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Error deleting emergency contact');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emergency-contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      } else {
        console.error('Failed to load contacts');
        setContacts([]);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
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

  // Load contacts on component mount
  useEffect(() => {
    if (activeTab === 'contacts') {
      loadContacts();
    }
  }, [activeTab]);

  return (
    <div className="mt-8 bg-white rounded-xl p-6 shadow-lg border">
      <h2 className="text-2xl font-bold mb-6">Admin Panel - Manage Safety Content</h2>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('tips')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'tips'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Safety Tips ({tips.length})
        </button>
        <button
          onClick={() => setActiveTab('kit')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'kit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Emergency Kit ({emergencyKit.length})
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'contacts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Emergency Contacts
        </button>
      </div>

      {activeTab === 'tips' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Safety Tips Management</h3>
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingTip({
                  id: '',
                  icon: '📋',
                  title: '',
                  items: [''],
                  category: 'disaster',
                  order: tips.length + 1,
                  updated_at: new Date().toISOString()
                });
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              Add New Tip
            </button>
          </div>

          {editingTip && (
            <TipEditor
              tip={editingTip}
              isCreating={isCreating}
              onSave={handleSaveTip}
              onCancel={() => {
                setEditingTip(null);
                setIsCreating(false);
              }}
            />
          )}

          <div className="space-y-4">
            {tips.map((tip) => (
              <div key={tip.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{tip.icon}</span>
                      <h4 className="text-lg font-semibold">{tip.title}</h4>
                      <span className="text-sm text-gray-500">Order: {tip.order}</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-gray-700 ml-8">
                      {tip.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTip(tip)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTip(tip.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'kit' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Emergency Kit Management</h3>
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingKit({
                  id: '',
                  title: '',
                  items: [''],
                  order: emergencyKit.length + 1,
                  updated_at: new Date().toISOString()
                });
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              Add New Kit Section
            </button>
          </div>

          {editingKit && (
            <KitEditor
              kitItem={editingKit}
              isCreating={isCreating}
              onSave={handleSaveKit}
              onCancel={() => {
                setEditingKit(null);
                setIsCreating(false);
              }}
            />
          )}

          <div className="space-y-4">
            {emergencyKit.map((kitItem) => (
              <div key={kitItem.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">{kitItem.title}</h4>
                      <span className="text-sm text-gray-500">Order: {kitItem.order}</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-gray-700 ml-4">
                      {kitItem.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingKit(kitItem)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteKit(kitItem.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        {activeTab === 'contacts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Emergency Contacts Management</h3>
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
                      {newContact.location && newContact.location.lat !== 0 && newContact.location.lng !== 0 && (
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditContact(contact)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteContact(contact.id)}
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
        )}
    </div>
  );
}

interface TipEditorProps {
  tip: SafetyTip;
  isCreating: boolean;
  onSave: (tip: Partial<SafetyTip>) => void;
  onCancel: () => void;
}

function TipEditor({ tip, isCreating, onSave, onCancel }: TipEditorProps) {
  const [formData, setFormData] = useState({
    icon: tip.icon,
    title: tip.title,
    items: [...tip.items],
    category: tip.category,
    order: tip.order
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      items: formData.items.filter(item => item.trim() !== '')
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, '']
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <div className="border-2 border-blue-300 rounded-lg p-6 mb-6 bg-blue-50">
      <h4 className="text-lg font-semibold mb-4">
        {isCreating ? 'Create New Safety Tip' : 'Edit Safety Tip'}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="🌊"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Items</label>
          <div className="space-y-2">
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Enter safety tip item"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={formData.items.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Item
          </button>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
          >
            {isCreating ? 'Create' : 'Save'} Tip
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 text-white rounded font-semibold hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

interface KitEditorProps {
  kitItem: EmergencyKitItem;
  isCreating: boolean;
  onSave: (kit: Partial<EmergencyKitItem>) => void;
  onCancel: () => void;
}

function KitEditor({ kitItem, isCreating, onSave, onCancel }: KitEditorProps) {
  const [formData, setFormData] = useState({
    title: kitItem.title,
    items: [...kitItem.items],
    order: kitItem.order
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      items: formData.items.filter(item => item.trim() !== '')
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, '']
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <div className="border-2 border-green-300 rounded-lg p-6 mb-6 bg-green-50">
      <h4 className="text-lg font-semibold mb-4">
        {isCreating ? 'Create New Emergency Kit Section' : 'Edit Emergency Kit Section'}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Items</label>
          <div className="space-y-2">
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Enter emergency kit item"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={formData.items.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Item
          </button>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
          >
            {isCreating ? 'Create' : 'Save'} Section
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 text-white rounded font-semibold hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
