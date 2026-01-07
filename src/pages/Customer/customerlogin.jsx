// components/customer/CustomerLogin.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import AuthShell from '../../components/auth/AuthShell.jsx';
import { Eye, EyeOff, Mail, Lock, User, ShoppingBag } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../../lib/animationConstants';

const CustomerLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.user.role === 'customer') {
        navigate('/customer/dashboard');
      } else if (result.user.role === 'designer') {
        navigate('/designer/dashboard');
      } else if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (result.user.role === 'brand') {
        navigate('/brand');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      role="customer"
      icon={<ShoppingBag size={24} />}
      eyebrow="Customer Access"
      title="Welcome Back"
      subtitle="Sign in to continue curating your wardrobe with The Kapda Co."
      footer={
        <span>
          New to Kapda Co?{' '}
          <Link to="/signup" className="form-link">
            Create an account
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE }}
              className="form-field"
              role="alert"
              aria-live="assertive"
            >
              <span className="form-error">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="form-field">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <div className="relative">
            <span className="form-icon-prefix">
              <Mail size={18} />
            </span>
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              className="form-input form-input-with-icon"
              value={formData.email}
              onChange={(event) => handleInputChange('email', event.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="relative">
            <span className="form-icon-prefix">
              <Lock size={18} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="form-input form-input-with-icon"
              style={{ paddingRight: '48px' }}
              value={formData.password}
              onChange={(event) => handleInputChange('password', event.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 focus-visible:rounded"
              style={{ color: 'var(--kc-gray-500)', background: 'none', border: 'none', cursor: 'pointer' }}
              disabled={loading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-field">
          <label className="form-checkbox-wrapper">
            <input
              type="checkbox"
              className="form-checkbox"
              defaultChecked
            />
            <span style={{ fontSize: '14px', color: 'rgba(248, 244, 238, 0.8)' }}>Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          className="form-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner size={16} color="var(--kc-navy-900)" />
              Signing In…
            </>
          ) : (
            <>
              <User size={18} />
              Sign In to Shop
            </>
          )}
        </button>

        <div className="text-center" style={{ marginTop: '16px' }}>
          <Link to="/forgot-password" className="form-link">
            Forgot your password?
          </Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default CustomerLogin;