import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav';
import { Search, Filter, UserPlus, Edit, Key, Ban, CheckCircle, Trash2, Shield } from 'lucide-react';
import { KCInput } from '../../components/ui';

export default function Users() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [submitting, setSubmitting] = useState(false);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query.trim());
    if (role !== 'all') params.append('role', role);
    if (status !== 'all') params.append('status', status);
    params.append('page', String(page));
    params.append('limit', '20');
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api(`/api/admin/users${buildQuery()}`, { token });
      if (Array.isArray(res)) {
        setUsers(res);
        setTotalPages(1);
      } else {
        setUsers(res.users || []);
        setTotalPages(res.pagination?.total || 1);
      }
    } catch (e) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token, query, role, status, page]);

  const changeRole = async (userId, nextRole) => {
    await api('/api/admin/users/role', { method: 'PATCH', token, body: { userId, role: nextRole } });
    load();
  };

  const suspend = async (userId, suspended) => {
    await api('/api/admin/users/suspend', { method: 'PATCH', token, body: { userId, suspended } });
    load();
  };

  const remove = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    await api(`/api/admin/users/${userId}`, { method: 'DELETE', token });
    load();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'customer' });
    setFormOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'customer' });
    setFormOpen(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || (!editing && !form.password.trim())) {
      alert('Please fill name, email and password for new users.');
      return;
    }
    try {
      setSubmitting(true);
      if (editing) {
        await api(`/api/admin/users/${editing._id}`, { method: 'PATCH', token, body: { name: form.name, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) } });
      } else {
        await api('/api/admin/users', { method: 'POST', token, body: { name: form.name, email: form.email, password: form.password, role: form.role } });
      }
      setFormOpen(false);
      load();
    } finally { setSubmitting(false); }
  };

  const resetPassword = async (userId) => {
    const pw = window.prompt('Enter a new temporary password (will force reset on next login):');
    if (!pw) return;
    await api(`/api/admin/users/${userId}/password`, { method: 'PATCH', token, body: { password: pw } });
    alert('Password updated');
  };

  const filteredCount = useMemo(() => users.length, [users]);

  return (
    <div className="admin-users-page">
      <div className="page-hero-header">
        <div className="page-hero-content">
          <div>
            <div className="hero-badge">
              <Shield size={16} />
              <span>USER MANAGEMENT</span>
            </div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">{filteredCount} user{filteredCount !== 1 ? 's' : ''} found</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </div>

      <AdminNav />

      <div className="content-wrapper">
        <div className="toolbar-card">
          <div className="search-group">
            <Search size={18} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search name or email"
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
            />
          </div>
          <div className="filters-group">
            <Filter size={16} />
            <select className="filter-select" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}>
              <option value="all">All roles</option>
              <option value="customer">Customer</option>
              <option value="designer">Designer</option>
              <option value="brand">Brand</option>
              <option value="admin">Admin</option>
            </select>
            <select className="filter-select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <UserPlus size={48} />
            <h3>No users found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="users-list">
            {users.map(u => (
              <div key={u._id} className="user-card">
                <div className="user-info">
                  <div className="user-avatar">{u.name?.charAt(0) || 'U'}</div>
                  <div className="user-details">
                    <div className="user-name">
                      {u.name}
                      {u.suspended && <span className="badge-danger">Suspended</span>}
                    </div>
                    <div className="user-email">{u.email}</div>
                  </div>
                </div>
                <div className="user-role">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="role-select"
                  >
                    <option value="customer">Customer</option>
                    <option value="designer">Designer</option>
                    <option value="brand">Brand</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="user-actions">
                  <button className="btn-icon" onClick={() => openEdit(u)} title="Edit">
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => resetPassword(u._id)} title="Reset Password">
                    <Key size={16} />
                  </button>
                  <button
                    className={`btn-icon ${u.suspended ? 'success' : 'warning'}`}
                    onClick={() => suspend(u._id, !u.suspended)}
                    title={u.suspended ? 'Unsuspend' : 'Suspend'}
                  >
                    {u.suspended ? <CheckCircle size={16} /> : <Ban size={16} />}
                  </button>
                  <button className="btn-icon danger" onClick={() => remove(u._id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Previous
            </button>
            <div className="page-info">Page {page} / {totalPages}</div>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </div>
        )}

        {formOpen && (
          <div 
            className="modal-overlay" 
            onClick={() => setFormOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setFormOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <h3 className="modal-title">{editing ? 'Edit User' : 'Add User'}</h3>
              <form onSubmit={submitForm} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <KCInput
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    variant="ghost"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <KCInput
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    variant="ghost"
                    required
                  />
                </div>
                {!editing && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <KCInput
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      variant="ghost"
                      required
                    />
                  </div>
                )}
                {editing && (
                  <div className="form-group">
                    <label className="form-label">New Password (optional)</label>
                    <KCInput
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      variant="ghost"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="customer">Customer</option>
                    <option value="designer">Designer</option>
                    <option value="brand">Brand</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-users-page {
          min-height: 100vh;
          background: var(--kc-navy-900);
          padding-top: 74px;
          font-family: var(--kc-font-sans);
          position: relative;
        }

        .admin-users-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .admin-users-page > * {
          position: relative;
          z-index: 1;
        }

        .page-hero-header {
          background: var(--kc-navy-900);
          border-bottom: 1px solid var(--kc-glass-border);
          padding: var(--kc-gap-lg) var(--kc-spacing-xl);
          margin-bottom: 0;
          backdrop-filter: blur(10px);
        }

        .page-hero-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--kc-gap-xs);
          padding: var(--kc-spacing-xs) var(--kc-gap-sm);
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--kc-cream-100);
          margin-bottom: var(--kc-gap-sm);
          backdrop-filter: blur(10px);
        }

        .page-title {
          font-family: var(--kc-font-serif);
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--kc-cream-100);
          margin: 0 0 var(--kc-gap-xs) 0;
          letter-spacing: var(--kc-letterspacing-heading);
        }

        .page-subtitle {
          color: var(--kc-beige-300);
          font-size: 0.9375rem;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 var(--kc-spacing-xl) var(--kc-gap-xl);
        }

        .toolbar-card {
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius-lg);
          padding: var(--kc-spacing-lg);
          margin-bottom: var(--kc-gap-md);
          display: flex;
          gap: var(--kc-gap-sm);
          flex-wrap: wrap;
          align-items: center;
          box-shadow: var(--kc-shadow-sm);
          backdrop-filter: blur(10px) saturate(110%);
        }

        .search-group {
          flex: 1;
          min-width: 280px;
          display: flex;
          align-items: center;
          gap: var(--kc-gap-sm);
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          backdrop-filter: blur(10px);
        }

        .search-icon {
          color: var(--kc-beige-300);
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: var(--kc-cream-100);
          font-size: 0.9375rem;
          font-family: var(--kc-font-sans);
        }

        .search-input::placeholder {
          color: var(--kc-beige-300);
          opacity: 0.6;
        }

        .filters-group {
          display: flex;
          gap: var(--kc-gap-sm);
          align-items: center;
        }

        .filter-select {
          padding: 12px 16px;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          background: rgba(255, 255, 255, 0.08);
          color: var(--kc-cream-100);
          font-size: 0.9375rem;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .filter-select:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--kc-gold-200);
          box-shadow: 0 0 0 3px rgba(211, 167, 95, 0.1);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: var(--kc-gap-xs);
          padding: 12px 24px;
          background: var(--kc-grad-gold);
          color: var(--kc-navy-900);
          border: none;
          border-radius: var(--kc-radius);
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(211, 167, 95, 0.35);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-secondary {
          padding: 10px 20px;
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          color: var(--kc-cream-100);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          backdrop-filter: blur(10px);
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
          transform: translateY(-2px);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--kc-glass-01);
          border-radius: var(--kc-radius-lg);
          border: 1px solid var(--kc-glass-border);
          box-shadow: var(--kc-shadow-sm);
          backdrop-filter: blur(10px) saturate(110%);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--kc-glass-border);
          border-top: 4px solid var(--kc-gold-200);
          border-radius: 50%;
          animation: spin var(--kc-duration-lg) linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state h3 {
          color: var(--kc-cream-100);
          margin: 16px 0 8px;
          font-family: var(--kc-font-serif);
        }

        .empty-state p {
          color: var(--kc-beige-300);
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: var(--kc-gap-sm);
        }

        .user-card {
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius-lg);
          padding: 20px;
          display: grid;
          grid-template-columns: 1.4fr 200px auto;
          gap: var(--kc-spacing-lg);
          align-items: center;
          box-shadow: var(--kc-shadow-sm);
          transition: all var(--kc-duration-sm) var(--kc-ease);
          backdrop-filter: blur(10px) saturate(110%);
        }

        .user-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--kc-shadow-md);
          border-color: var(--kc-gold-200);
          background: rgba(255, 255, 255, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--kc-gap-sm);
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--kc-grad-gold);
          color: var(--kc-navy-700);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.125rem;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          font-weight: 700;
          color: var(--kc-cream-100);
          display: flex;
          align-items: center;
          gap: var(--kc-gap-xs);
          margin-bottom: 4px;
        }

        .badge-danger {
          padding: 2px 8px;
          background: rgba(167, 29, 42, 0.2);
          color: rgba(255, 179, 191, 1);
          border: 1px solid rgba(167, 29, 42, 0.4);
          border-radius: var(--kc-radius-full);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .user-email {
          color: var(--kc-beige-300);
          font-size: 0.875rem;
        }

        .role-select {
          padding: 10px 14px;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          background: rgba(255, 255, 255, 0.08);
          color: var(--kc-cream-100);
          font-size: 0.875rem;
          cursor: pointer;
          width: 100%;
          backdrop-filter: blur(10px);
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .role-select:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
        }

        .role-select:focus {
          outline: none;
          border-color: var(--kc-gold-200);
          box-shadow: 0 0 0 3px rgba(211, 167, 95, 0.1);
        }

        .user-actions {
          display: flex;
          gap: var(--kc-gap-xs);
          justify-content: flex-end;
        }

        .btn-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--kc-glass-border);
          background: var(--kc-glass-01);
          border-radius: var(--kc-radius);
          color: var(--kc-cream-100);
          cursor: pointer;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          backdrop-filter: blur(10px);
        }

        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
          transform: translateY(-2px);
        }

        .btn-icon.warning {
          border-color: rgba(255, 183, 77, 0.5);
          color: rgba(255, 183, 77, 0.9);
        }

        .btn-icon.warning:hover {
          background: rgba(243, 209, 166, 0.15);
        }

        .btn-icon.success {
          border-color: rgba(46, 125, 50, 0.5);
          color: rgba(129, 199, 132, 1);
        }

        .btn-icon.success:hover {
          background: rgba(161, 224, 181, 0.15);
        }

        .btn-icon.danger {
          border-color: rgba(183, 28, 28, 0.5);
          color: rgba(239, 154, 154, 1);
        }

        .btn-icon.danger:hover {
          background: rgba(245, 181, 181, 0.15);
        }

        .pagination {
          display: flex;
          gap: var(--kc-gap-sm);
          align-items: center;
          justify-content: center;
          margin-top: var(--kc-gap-lg);
        }

        .page-info {
          color: var(--kc-cream-100);
          font-weight: 600;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(8px);
        }

        .modal-card {
          background: var(--kc-glass-01);
          border-radius: var(--kc-radius-lg);
          border: 1px solid var(--kc-glass-border);
          width: 100%;
          max-width: 520px;
          padding: 32px;
          box-shadow: var(--kc-shadow-lg);
          backdrop-filter: blur(20px) saturate(110%);
        }

        .modal-title {
          font-family: var(--kc-font-serif);
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--kc-cream-100);
          margin: 0 0 24px 0;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: var(--kc-spacing-lg);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--kc-gap-xs);
        }

        .form-label {
          font-weight: 600;
          color: var(--kc-cream-100);
          font-size: 0.875rem;
        }

        .form-input {
          padding: 12px 16px;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          background: rgba(255, 255, 255, 0.08);
          color: var(--kc-cream-100);
          font-size: 0.9375rem;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          backdrop-filter: blur(10px);
        }

        .form-input::placeholder {
          color: var(--kc-beige-300);
          opacity: 0.6;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--kc-gold-200);
          box-shadow: 0 0 0 3px rgba(211, 167, 95, 0.1);
          background: rgba(255, 255, 255, 0.12);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--kc-gap-sm);
          margin-top: 8px;
        }

        @media (max-width: 968px) {
          .user-card {
            grid-template-columns: 1fr;
            gap: var(--kc-gap-sm);
          }

          .user-actions {
            justify-content: flex-start;
          }

          .toolbar-card {
            flex-direction: column;
            align-items: stretch;
          }

          .search-group {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
