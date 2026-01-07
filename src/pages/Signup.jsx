import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell.jsx';
import { Mail, Lock, User } from 'lucide-react';
import { KCInput, LoadingSpinner } from '../components/ui';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../lib/animationConstants';

const roleOptions = [
  { value: 'customer', label: 'Customer · Shop curated collections' },
  { value: 'brand', label: 'Brand · Launch your store' },
  { value: 'designer', label: 'Designer · Collaborate with ateliers' },
];

const Signup = () => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminSignup = location.pathname.includes('/admin');
  const signInPath = isAdminSignup ? '/admin/login' : '/login';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const forcedRole = isAdminSignup ? 'admin' : role;
      const signupData = {
        name,
        email,
        password,
        role: forcedRole,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        country: country || undefined,
        city: city || undefined
      };
      const res = await signup(signupData);
      if (forcedRole === 'admin' && res.user?.role !== 'admin') {
        throw new Error('Admin signup failed');
      }
      navigate(forcedRole === 'admin' ? '/admin/dashboard' : '/login');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const getRole = () => {
    if (isAdminSignup) return 'admin';
    if (role === 'designer') return 'designer';
    return 'customer';
  };

  return (
    <AuthShell
      role={getRole()}
      icon={isAdminSignup ? null : <User size={22} />}
      eyebrow={isAdminSignup ? 'Administration' : 'Join Kapda Co.'}
      title={isAdminSignup ? 'Create Admin Account' : 'Create Your Account'}
      subtitle={
        isAdminSignup
          ? 'Provision a secure administrator profile to manage The Kapda Co. platform.'
          : 'Craft a profile to discover bespoke capsules, collaborate with designers, or manage your own atelier.'
      }
      leftPanelContent={
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="auth-left-brand"
          >
            <div className="auth-brand-logo">
              <span className="kc-text-brand text-xs uppercase tracking-[0.45em]">The</span>
              <span className="text-4xl md:text-5xl font-serif font-semibold tracking-[0.4px] text-[var(--kc-cream-100)]">
                Kapda Co.
              </span>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="auth-brand-tagline"
            >
              {isAdminSignup
                ? 'Secure administrative access to platform operations'
                : role === 'designer'
                ? 'Join our community of talented designers and artisans'
                : 'Begin your journey with curated fashion and timeless style'}
            </motion.p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="auth-left-decoration"
            style={{
              background: isAdminSignup
                ? 'linear-gradient(135deg, rgba(211, 167, 95, 0.12) 0%, rgba(159, 120, 96, 0.08) 100%)'
                : role === 'designer'
                ? 'linear-gradient(135deg, rgba(211, 167, 95, 0.2) 0%, rgba(159, 120, 96, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(211, 167, 95, 0.15) 0%, rgba(159, 120, 96, 0.1) 100%)',
            }}
          />
        </>
      }
      footer={
        <span>
          Already have an account?{' '}
          <Link to={signInPath} className="form-link">
            Sign in
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
          <label htmlFor="name" className="form-label">
            Full Name
          </label>
          <KCInput
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            disabled={loading}
            autoComplete="name"
            icon={<User size={18} />}
            variant="ghost"
          />
        </div>

        <div className="form-field">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <KCInput
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
            autoComplete="email"
            icon={<Mail size={18} />}
            variant="ghost"
          />
        </div>

        <div className="form-field">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <KCInput
            id="password"
            type="password"
            placeholder="Create a secure password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
            autoComplete={isAdminSignup ? 'new-password' : 'current-password'}
            icon={<Lock size={18} />}
            variant="ghost"
          />
          <p style={{ fontSize: '13px', color: 'var(--kc-gray-500)', marginTop: '6px' }}>
            Use at least 8 characters, including a capital letter and symbol.
          </p>
        </div>

        {!isAdminSignup && role === 'customer' ? (
          <>
            <div className="form-field">
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <KCInput
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={loading}
                autoComplete="tel"
                variant="ghost"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-field">
                <label htmlFor="city" className="form-label">
                  City
                </label>
                <KCInput
                  id="city"
                  type="text"
                  placeholder="Mumbai"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  disabled={loading}
                  autoComplete="address-level2"
                  variant="ghost"
                />
              </div>

              <div className="form-field">
                <label htmlFor="country" className="form-label">
                  Country
                </label>
                <KCInput
                  id="country"
                  type="text"
                  placeholder="India"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  disabled={loading}
                  autoComplete="country"
                  variant="ghost"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="dateOfBirth" className="form-label">
                Date of Birth
              </label>
              <KCInput
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                disabled={loading}
                variant="ghost"
              />
            </div>
          </>
        ) : null}

        {!isAdminSignup ? (
          <div className="form-field">
            <label className="form-label">
              Account Type
            </label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              disabled={loading}
              className="form-input"
              style={{ appearance: 'auto', paddingRight: '16px' }}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button 
          type="submit" 
          className="form-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner size={16} color="var(--kc-navy-900)" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>
    </AuthShell>
  );
};

export default Signup;