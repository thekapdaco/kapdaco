import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { KCButton, KCCard, KCInput, KCAlert } from '../../components/ui';
import { User, Mail, Phone, MapPin, Calendar, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    country: '',
    city: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        country: user.country || '',
        city: user.city || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone || undefined,
        country: formData.country || undefined,
        city: formData.city || undefined,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        bio: formData.bio || undefined
      };

      const response = await api('/api/auth/profile', {
        method: 'PATCH',
        token,
        body: updateData
      });

      if (updateUser) {
        updateUser(response.user);
      }
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="kc-container py-20">
        <div className="text-center">
          <p className="mb-4">Please log in to edit your profile.</p>
          <KCButton as="a" href="/login">Log In</KCButton>
        </div>
      </main>
    );
  }

  return (
    <main className="kc-container py-16">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif mb-2">Edit Profile</h1>
        <p className="text-[var(--kc-ink-2)]">Update your personal information</p>
      </header>

      <KCCard className="max-w-2xl">
        {error && (
          <KCAlert variant="danger" className="mb-6">
            {error}
          </KCAlert>
        )}
        {success && (
          <KCAlert variant="success" className="mb-6">
            {success}
          </KCAlert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--kc-ink)]">
                Full Name *
              </label>
              <KCInput
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                icon={<User size={18} />}
                variant="ghost"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--kc-ink)]">
                Email Address
              </label>
              <KCInput
                type="email"
                name="email"
                value={formData.email}
                disabled
                icon={<Mail size={18} />}
                variant="ghost"
              />
              <p className="text-xs text-[var(--kc-ink-2)]">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--kc-ink)]">
                Phone Number
              </label>
              <KCInput
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                icon={<Phone size={18} />}
                variant="ghost"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--kc-ink)]">
                Date of Birth
              </label>
              <KCInput
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                icon={<Calendar size={18} />}
                variant="ghost"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--kc-ink)]">
                City
              </label>
              <KCInput
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai"
                icon={<MapPin size={18} />}
                variant="ghost"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--kc-ink)]">
                Country
              </label>
              <KCInput
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="India"
                icon={<MapPin size={18} />}
                variant="ghost"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--kc-ink)]">
              Bio / About Me
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="kc-input resize-y"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-[var(--kc-ink-2)]">Max 500 characters</p>
          </div>

          <div className="flex gap-3 pt-4">
            <KCButton
              type="submit"
              disabled={loading}
              icon={<Save size={18} />}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </KCButton>
            <KCButton
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
            >
              Cancel
            </KCButton>
          </div>
        </form>
      </KCCard>
    </main>
  );
};

export default EditProfile;

