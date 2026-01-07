// pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import AuthShell from '../components/auth/AuthShell';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { KCButton, LoadingSpinner } from '../components/ui';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../lib/animationConstants';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: {
          token,
          password
        }
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired. Please request a new one.');
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid && !success) {
    return (
      <AuthShell
        role="customer"
        icon={<AlertCircle size={24} />}
        eyebrow="Invalid Link"
        title="Reset Link Invalid"
        subtitle="This password reset link is invalid or has expired. Please request a new one."
        footer={
          <span>
            Remember your password?{' '}
            <Link to="/login" className="form-link">
              Sign in
            </Link>
          </span>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-6 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
            <p className="text-white/80 mb-6">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <div className="flex flex-col gap-3">
              <KCButton
                as={Link}
                to="/forgot-password"
                className="w-full bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold"
              >
                Request New Reset Link
              </KCButton>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell
        role="customer"
        icon={<CheckCircle2 size={24} />}
        eyebrow="Password Reset"
        title="Password Reset Successful!"
        subtitle="Your password has been successfully reset. You can now log in with your new password."
        footer={
          <span>
            Remember your password?{' '}
            <Link to="/login" className="form-link">
              Sign in
            </Link>
          </span>
        }
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[16px] border border-green-500/30 bg-green-500/10 p-6 text-center"
        >
          <CheckCircle2 size={48} className="mx-auto mb-4 text-green-400" />
          <h3 className="text-xl font-semibold text-white mb-2">Password Reset Complete</h3>
          <p className="text-white/80 mb-6">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <KCButton
            as={Link}
            to="/login"
            className="w-full bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold"
          >
            Go to Login
          </KCButton>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      role="customer"
      icon={<Lock size={24} />}
      eyebrow="Reset Password"
      title="Create New Password"
      subtitle="Enter your new password below. Make sure it's strong and secure."
      footer={
        <span>
          Remember your password?{' '}
          <Link to="/login" className="form-link">
            Sign in
          </Link>
        </span>
      }
    >
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION_DURATIONS.md, ease: ANIMATION_EASE }}
        onSubmit={handleSubmit}
        className="auth-form"
      >
        <div className="form-field">
          <label htmlFor="password" className="form-label">
            New Password
          </label>
          <div className="relative">
            <span className="form-icon-prefix">
              <Lock size={18} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your new password"
              className="form-input form-input-with-icon"
              style={{ paddingRight: '48px' }}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              required
              disabled={loading}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
              disabled={loading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Must be at least 8 characters with uppercase, lowercase, and a number
          </p>
        </div>

        <div className="form-field">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <div className="relative">
            <span className="form-icon-prefix">
              <Lock size={18} />
            </span>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your new password"
              className="form-input form-input-with-icon"
              style={{ paddingRight: '48px' }}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
              disabled={loading}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[12px] border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </motion.div>
        )}

        <KCButton
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="w-full bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold"
          icon={loading ? <LoadingSpinner size={16} color="var(--kc-navy-900)" /> : <Lock size={18} />}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </KCButton>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mt-4"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </motion.form>
    </AuthShell>
  );
};

export default ResetPassword;

