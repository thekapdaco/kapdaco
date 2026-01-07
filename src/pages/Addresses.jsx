import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { KCButton, KCCard } from '../components/ui';
import { Plus, Edit, Trash2, MapPin, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const Addresses = () => {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    label: 'Home',
    fullName: '',
    street: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    addressType: 'home',
    isDefault: false
  });

  useEffect(() => {
    if (token) {
      fetchAddresses();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api('/api/addresses', { token });
      setAddresses(response.addresses || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
      setError(err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      if (editingId) {
        await api(`/api/addresses/${editingId}`, {
          method: 'PATCH',
          token,
          body: formData
        });
      } else {
        await api('/api/addresses', {
          method: 'POST',
          token,
          body: formData
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        label: 'Home',
        fullName: '',
        street: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: '',
        addressType: 'home',
        isDefault: false
      });
      fetchAddresses();
    } catch (err) {
      setError(err.message || 'Failed to save address');
    }
  };

  const handleEdit = (address) => {
    setFormData({
      label: address.label,
      fullName: address.fullName || '',
      street: address.street,
      addressLine2: address.addressLine2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      addressType: address.addressType || 'home',
      isDefault: address.isDefault
    });
    setEditingId(address._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api(`/api/addresses/${id}`, { method: 'DELETE', token });
      fetchAddresses();
    } catch (err) {
      setError(err.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api(`/api/addresses/${id}/default`, { method: 'PATCH', token });
      fetchAddresses();
    } catch (err) {
      setError(err.message || 'Failed to set default address');
    }
  };

  if (!token) {
    return (
      <main className="kc-container py-20">
        <div className="text-center">
          <p className="mb-4">Please log in to manage your addresses.</p>
          <KCButton as={Link} to="/login">Log In</KCButton>
        </div>
      </main>
    );
  }

  return (
    <main className="kc-container py-16">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif mb-2">My Addresses</h1>
        <p className="text-[var(--kc-ink-2)]">Manage your shipping addresses</p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {!showForm && (
        <div className="mb-6">
          <KCButton onClick={() => setShowForm(true)}>
            <Plus size={20} className="mr-2" />
            Add New Address
          </KCButton>
        </div>
      )}

      {showForm && (
        <KCCard className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name (Receiver)</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="form-input"
                  placeholder="Receiver's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address Type</label>
                <select
                  value={formData.addressType}
                  onChange={(e) => setFormData({ ...formData, addressType: e.target.value })}
                  className="form-input"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Home, Office"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Street Address *</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="form-input"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="form-input"
                  placeholder="Nearby landmark for easy delivery"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="md:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isDefault" className="text-sm">Set as default address</label>
              </div>
            </div>
            <div className="flex gap-3">
              <KCButton type="submit">Save Address</KCButton>
              <KCButton variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Cancel
              </KCButton>
            </div>
          </form>
        </KCCard>
      )}

      {loading ? (
        <p>Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <KCCard>
          <p className="text-center text-[var(--kc-ink-2)] py-8">
            No addresses saved yet. Add your first address above.
          </p>
        </KCCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <KCCard key={address._id}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-[var(--kc-gold-200)]" />
                  <h3 className="font-semibold">{address.label}</h3>
                  {address.isDefault && (
                    <span className="text-xs bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm text-[var(--kc-ink-2)] mb-4">
                <p>{address.street}</p>
                <p>
                  {address.city}{address.state ? `, ${address.state}` : ''} {address.postalCode}
                </p>
                <p>{address.country}</p>
                <p className="mt-2">Phone: {address.phone}</p>
              </div>
              <div className="flex gap-2">
                {!address.isDefault && (
                  <KCButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(address._id)}
                  >
                    Set Default
                  </KCButton>
                )}
                <KCButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(address)}
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </KCButton>
                <KCButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(address._id)}
                >
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </KCButton>
              </div>
            </KCCard>
          ))}
        </div>
      )}
    </main>
  );
};

export default Addresses;

