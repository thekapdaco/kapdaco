// pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import AuthShell from '../components/auth/AuthShell';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { KCButton, LoadingSpinner } from '../components/ui';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../lib/animationConstants';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await api('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() }
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      role="customer"
      icon={<Mail size={24} />}
      eyebrow="Account Recovery"
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you a link to reset your password."
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
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[16px] border border-green-500/30 bg-green-500/10 p-6 text-center"
          >
            <CheckCircle2 size={48} className="mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-semibold text-white mb-2">Check Your Email</h3>
            <p className="text-white/80 mb-4">
              If an account exists with <strong>{email}</strong>, we've sent a password reset link.
            </p>
            <p className="text-sm text-white/60 mb-6">
              Please check your inbox (and spam folder) for the reset link. The link will expire in 1 hour.
            </p>
            <div className="flex flex-col gap-3">
              <KCButton
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                variant="secondary"
                className="border-2 border-white/30 text-white hover:bg-white/10"
              >
                Send Another Email
              </KCButton>
              <Link
                to="/login"
                className="text-sm text-[var(--kc-gold-200)] hover:text-[var(--kc-gold-300)] transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
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
                  placeholder="Enter your email"
                  className="form-input form-input-with-icon"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
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
              disabled={loading || !email}
              className="w-full bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold"
              icon={loading ? <LoadingSpinner size={16} color="var(--kc-navy-900)" /> : <Mail size={18} />}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </KCButton>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mt-4"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </>
        )}
      </motion.form>
    </AuthShell>
  );
};

export default ForgotPassword;

