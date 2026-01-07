import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell.jsx';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';

export default function AdminLogin() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@kapdaco.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.user?.role !== 'admin') throw new Error('Super admin credentials required');
      nav('/admin/dashboard');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      role="admin"
      icon={<ShieldCheck size={22} />}
      eyebrow="Administration"
      title="Super Admin Login"
      subtitle="Securely access the Kapda Co. control centre with elevated permissions."
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
              Secure administrative access to platform operations
            </motion.p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="auth-left-decoration"
            style={{ background: 'linear-gradient(135deg, rgba(211, 167, 95, 0.12) 0%, rgba(159, 120, 96, 0.08) 100%)' }}
          />
        </>
      }
    >
      <form onSubmit={onSubmit}>
        {err ? (
          <div className="form-field">
            <span className="form-error">{err}</span>
          </div>
        ) : null}

        <div className="form-field">
          <label htmlFor="admin-email" className="form-label">
            Email
          </label>
          <div className="relative">
            <span className="form-icon-prefix">
              <Mail size={18} />
            </span>
            <input
              id="admin-email"
              type="email"
              placeholder="Enter email"
              className="form-input form-input-with-icon"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="admin-password" className="form-label">
            Password
          </label>
          <div className="relative">
            <span className="form-icon-prefix">
              <Lock size={18} />
            </span>
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              className="form-input form-input-with-icon"
              style={{ paddingRight: '48px' }}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#8C8C8C] disabled:opacity-50"
              disabled={loading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="form-button" disabled={loading}>
          {loading ? (
            <>
              <Loader size={16} style={{ animation: `spin var(--kc-duration-lg) linear infinite` }} />
              Signing In…
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </AuthShell>
  );
}