import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell.jsx';
import { Briefcase, Mail, Lock } from 'lucide-react';

export default function BrandLogin() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('brand@example.com');
  const [password, setPassword] = useState('Brand@123');
  const [err, setErr] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setErr('');

    try {
      const res = await login(email, password);
      if (res.user?.role !== 'brand') throw new Error('Brand credentials required');
      nav('/brand');
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <AuthShell
      icon={<Briefcase size={22} />}
      eyebrow="Brand Portal"
      title="Access Your Store"
      subtitle="Manage products, inventory, and performance insights from your personalised dashboard."
      footer={
        <span>
          Not a brand yet?{' '}
          <Link to="/brand/signup" className="form-link">
            Create a brand account
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit}>
        {err ? (
          <div className="form-field">
            <span className="form-error">{err}</span>
          </div>
        ) : null}

        <div className="form-field">
          <label htmlFor="brand-email" className="form-label">
            Email
          </label>
          <div className="relative">
            <span className="form-icon-prefix">
              <Mail size={18} />
            </span>
            <input
            id="brand-email"
              type="email"
            placeholder="Enter your email"
              className="form-input form-input-with-icon"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
          />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="brand-password" className="form-label">
            Password
          </label>
          <div className="relative">
            <span className="form-icon-prefix">
              <Lock size={18} />
            </span>
            <input
            id="brand-password"
            type="password"
            placeholder="Enter your password"
              className="form-input form-input-with-icon"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
          </div>
        </div>

        <button type="submit" className="form-button">
          Access Store Dashboard
        </button>

        <div style={{
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(255, 255, 255, 0.06)',
          padding: '16px',
          fontSize: '14px',
          color: 'rgba(248, 244, 238, 0.7)',
          marginTop: '24px'
        }}>
          Manage catalogue updates, fulfil orders, and track revenue in real time.
        </div>
      </form>
    </AuthShell>
  );
}