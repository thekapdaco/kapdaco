import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import AdminNav from '../../components/AdminNav';
import { Search, UserPlus, Edit, Key, Ban, CheckCircle, Trash2, Store, Package, ArrowRight } from 'lucide-react';
import { KCInput } from '../../components/ui';

export default function Brands(){
  const { token } = useAuth();
  const nav = useNavigate();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'', company:'', phone:'', role:'brand' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      const data = await api(`/api/admin/users?role=brand${q?`&q=${encodeURIComponent(q)}`:''}`, { token });
      const list = data.users || data;
      const withCounts = await Promise.all(list.map(async s => {
        const approved = await api(`/api/admin/products?approved=true&brandId=${s._id}`, { token });
        const pending = await api(`/api/admin/products?approved=false&brandId=${s._id}`, { token });
        const approvedList = approved.products || approved;
        const pendingList = pending.products || pending;
        return { ...s, approvedCount: approvedList.length, pendingCount: pendingList.length };
      }));
      setBrands(withCounts);
    } catch (e) { setErr(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [token, q]);

  const suspend = async (userId, suspended) => {
    await api('/api/admin/users/suspend', { method:'PATCH', token, body:{ userId, suspended } });
    await load();
  };

  const resetPassword = async (userId) => {
    const pw = window.prompt('Enter a temporary password:');
    if (!pw) return;
    await api(`/api/admin/users/${userId}/password`, { method:'PATCH', token, body:{ password: pw } });
    alert('Password updated');
  };

  const remove = async (userId) => {
    if (!window.confirm('Delete this brand?')) return;
    await api(`/api/admin/users/${userId}`, { method:'DELETE', token });
    load();
  };

  const openCreate = () => { setEditing(null); setForm({ name:'', email:'', password:'', company:'', phone:'', role:'brand' }); setFormOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name:s.name||'', email:s.email||'', password:'', company:s.company||'', phone:s.phone||'', role:'brand' }); setFormOpen(true); };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || (!editing && !form.password.trim())) { alert('Please fill name, email and password'); return; }
    try {
      setSubmitting(true);
      if (editing) {
        await api(`/api/admin/users/${editing._id}`, { method:'PATCH', token, body:{ name:form.name, email:form.email, role:'brand', company:form.company, phone:form.phone, ...(form.password?{ password:form.password }:{}) } });
      } else {
        await api('/api/admin/users', { method:'POST', token, body:{ name:form.name, email:form.email, password:form.password, role:'brand', company:form.company, phone:form.phone } });
      }
      setFormOpen(false); load();
    } finally { setSubmitting(false); }
  };

  const approveAllPending = async (brandId) => {
    if (!window.confirm('Approve all pending products for this brand?')) return;
    const pending = await api(`/api/admin/products?approved=false&brandId=${brandId}`, { token });
    const list = pending.products || pending || [];
    for (const p of list) {
      try { await api('/api/admin/products/approve', { method:'PATCH', token, body:{ productId: p._id, isApproved: true } }); } catch {}
    }
    load();
  };

  return (
    <div className="admin-brands-page">
      <div className="page-hero-header">
        <div className="page-hero-content">
          <div>
            <div className="hero-badge">
              <Store size={16} />
              <span>BRAND MANAGEMENT</span>
            </div>
            <h1 className="page-title">Brands</h1>
            <p className="page-subtitle">{brands.length} brand{brands.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <UserPlus size={18} />
            Add Brand
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
              placeholder="Search brands"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
            />
          </div>
        </div>

        {err && <div className="error-banner">{err}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading brands...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="empty-state">
            <Store size={48} />
            <h3>No brands found</h3>
            <p>Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="brands-list">
            {brands.map(s => (
              <div key={s._id} className="brand-card">
                <div className="brand-info">
                  <div className="brand-avatar">{(s.name||'B').charAt(0)}</div>
                  <div className="brand-details">
                    <div className="brand-name">
                      {s.name}
                      {s.suspended && <span className="badge-danger">Suspended</span>}
                    </div>
                    <div className="brand-meta">
                      {s.email} {s.company?`• ${s.company}`:''} {s.phone?`• ${s.phone}`:''}
                    </div>
                  </div>
                </div>
                <div className="brand-stats">
                  <div className="stat-item">
                    <Package size={16} />
                    <div>
                      <div className="stat-number">{s.approvedCount || 0}</div>
                      <div className="stat-label">Approved</div>
                    </div>
                  </div>
                  <div className="stat-item pending">
                    <div>
                      <div className="stat-number">{s.pendingCount || 0}</div>
                      <div className="stat-label">Pending</div>
                    </div>
                  </div>
                </div>
                <div className="brand-actions">
                  <button className="btn-secondary" onClick={()=>nav('/admin/products')}>
                    View Products
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={()=>approveAllPending(s._id)}
                    disabled={!s.pendingCount}
                  >
                    Approve All Pending
                  </button>
                  <button className="btn-icon" onClick={()=>openEdit(s)} title="Edit">
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon" onClick={()=>resetPassword(s._id)} title="Reset Password">
                    <Key size={16} />
                  </button>
                  <button
                    className={`btn-icon ${s.suspended?'success':'warning'}`}
                    onClick={()=>suspend(s._id, !s.suspended)}
                    title={s.suspended?'Unsuspend':'Suspend'}
                  >
                    {s.suspended ? <CheckCircle size={16} /> : <Ban size={16} />}
                  </button>
                  <button className="btn-icon danger" onClick={()=>remove(s._id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {formOpen && (
          <div 
            className="modal-overlay" 
            onClick={()=>setFormOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setFormOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          >
            <div className="modal-card" onClick={(e)=>e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <h3 className="modal-title">{editing?'Edit Brand':'Add Brand'}</h3>
              <form onSubmit={submitForm} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <KCInput value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} variant="ghost" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <KCInput type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} variant="ghost" required />
                </div>
                {!editing && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <KCInput type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} variant="ghost" required />
                  </div>
                )}
                {editing && (
                  <div className="form-group">
                    <label className="form-label">New Password (optional)</label>
                    <KCInput type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} variant="ghost" />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-input" value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={()=>setFormOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting?'Saving...':'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-brands-page {
          min-height: 100vh;
          background: var(--kc-navy-900);
          padding-top: 74px;
          font-family: var(--kc-font-sans);
          position: relative;
        }

        .admin-brands-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .admin-brands-page > * {
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
          margin-bottom: 12px;
          backdrop-filter: blur(10px);
        }

        .page-title {
          font-family: var(--kc-font-serif);
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--kc-cream-100);
          margin: 0 0 8px 0;
          letter-spacing: var(--kc-letterspacing-heading);
        }

        .page-subtitle {
          color: var(--kc-beige-300);
          font-size: 0.9375rem;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px 48px;
        }

        .toolbar-card {
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius-lg);
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: var(--kc-shadow-sm);
          backdrop-filter: blur(10px) saturate(110%);
        }

        .search-group {
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

        .error-banner {
          padding: 12px 16px;
          background: rgba(167, 29, 42, 0.2);
          border: 1px solid rgba(167, 29, 42, 0.4);
          border-radius: var(--kc-radius);
          color: #ffb3bf;
          margin-bottom: 20px;
          font-weight: 600;
          backdrop-filter: blur(10px);
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

        .brands-list {
          display: flex;
          flex-direction: column;
          gap: var(--kc-gap-sm);
        }

        .brand-card {
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius-lg);
          padding: 20px;
          display: grid;
          grid-template-columns: 1.4fr 260px auto;
          gap: 20px;
          align-items: center;
          box-shadow: var(--kc-shadow-sm);
          transition: all var(--kc-duration-sm) var(--kc-ease);
          backdrop-filter: blur(10px) saturate(110%);
        }

        .brand-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--kc-shadow-md);
          border-color: var(--kc-gold-200);
          background: rgba(255, 255, 255, 0.1);
        }

        .brand-info {
          display: flex;
          align-items: center;
          gap: var(--kc-gap-sm);
        }

        .brand-avatar {
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

        .brand-details {
          flex: 1;
        }

        .brand-name {
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
          color: #ffb3bf;
          border: 1px solid rgba(167, 29, 42, 0.4);
          border-radius: var(--kc-radius-full);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .brand-meta {
          color: var(--kc-beige-300);
          font-size: 0.875rem;
        }

        .brand-stats {
          display: flex;
          gap: var(--kc-gap-sm);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--kc-gap-sm);
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          flex: 1;
          backdrop-filter: blur(10px);
        }

        .stat-item.pending {
          background: rgba(255, 247, 230, 0.15);
          border-color: rgba(243, 209, 166, 0.4);
        }

        .stat-number {
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--kc-cream-100);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--kc-beige-300);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .brand-actions {
          display: flex;
          gap: var(--kc-gap-xs);
          flex-wrap: wrap;
          justify-content: flex-end;
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
          display: inline-flex;
          align-items: center;
          gap: var(--kc-gap-xs);
          padding: 10px 16px;
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          color: var(--kc-cream-100);
          font-weight: 600;
          font-size: 0.875rem;
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
          border-color: rgba(243, 209, 166, 0.5);
          color: #f3d1a6;
        }

        .btn-icon.warning:hover {
          background: rgba(243, 209, 166, 0.15);
        }

        .btn-icon.success {
          border-color: rgba(161, 224, 181, 0.5);
          color: #a1e0b5;
        }

        .btn-icon.success:hover {
          background: rgba(161, 224, 181, 0.15);
        }

        .btn-icon.danger {
          border-color: rgba(245, 181, 181, 0.5);
          color: #f5b5b5;
        }

        .btn-icon.danger:hover {
          background: rgba(245, 181, 181, 0.15);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(4px);
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
          padding: var(--kc-gap-lg);
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
          gap: 20px;
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
          .brand-card {
            grid-template-columns: 1fr;
            gap: var(--kc-gap-sm);
          }

          .brand-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
