import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import AdminNav from '../../components/AdminNav';
import { CheckCircle, XCircle, Eye, Search, Filter, Download, ChevronDown, ChevronUp, User, MapPin, Calendar, FileText } from 'lucide-react';

export default function Applications() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded] = useState({});

  const [note, setNote] = useState('');
  const [active, setActive] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (status !== 'all') params.append('status', status);
    if (query.trim()) params.append('q', query.trim());
    if (sort) params.append('sort', sort);
    params.append('page', String(page));
    params.append('limit', '20');
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api(`/api/admin/applications${buildQuery()}`, { token });
      if (Array.isArray(res)) {
        setItems(res);
        setTotalPages(1);
      } else {
        setItems(res.applications || []);
        setTotalPages(res.pagination?.total || 1);
      }
    } catch (e) { setError(e.message || 'Failed to load applications'); setItems([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [token, status, query, sort, page]);

  const moderate = async (userId, action, adminNotes = '') => {
    const endpoint = action === 'approve' ? '/api/admin/applications/approve' : '/api/admin/applications/reject';
    await api(endpoint, { method: 'PATCH', token, body: { userId, adminNotes } });
    setActive(null); setNote('');
    load();
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSelected = (id) => setSelected(prev => { const s = new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });
  const selectAll = () => setSelected(new Set(items.map(i => i.userId || i._id)));
  const clearSelection = () => setSelected(new Set());

  const bulkModerate = async (action) => {
    if (!selected.size) return;
    if (!window.confirm(`${action==='approve'?'Approve':'Reject'} ${selected.size} application(s)?`)) return;
    for (const id of selected) {
      try { await moderate(id, action, action==='reject'?note:''); } catch {}
    }
    clearSelection();
    setNote('');
  };

  const exportCSV = () => {
    const headers = ['Name','Email','Status','City','Country','Created'];
    const rows = items.map(a => [
      a.designerName || `${a.fullName || ''} ${a.lastName || ''}`.trim(),
      a.email,
      a.status,
      a.city || '',
      a.country || '',
      new Date(a.createdAt).toISOString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'applications.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const count = useMemo(() => items.length, [items]);

  return (
    <div className="admin-applications-page">
      <div className="page-hero-header">
        <div className="page-hero-content">
          <div>
            <div className="hero-badge">
              <FileText size={16} />
              <span>DESIGNER APPLICATIONS</span>
            </div>
            <h1 className="page-title">Applications</h1>
            <p className="page-subtitle">{count} application{count!==1?'s':''}</p>
          </div>
          <button className="btn-primary" onClick={exportCSV}>
            <Download size={18} />
            Export CSV
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
              placeholder="Search name, email, city..."
              value={query}
              onChange={(e)=>{ setPage(1); setQuery(e.target.value); }}
            />
          </div>
          <div className="filters-group">
            <Filter size={16} />
            <select className="filter-select" value={status} onChange={(e)=>{ setPage(1); setStatus(e.target.value); }}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
            <select className="filter-select" value={sort} onChange={(e)=>{ setPage(1); setSort(e.target.value); }}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="bulk-actions-card">
            <div className="bulk-info">{selected.size} selected</div>
            <div className="bulk-buttons">
              <button className="btn-success" onClick={()=>bulkModerate('approve')}>
                <CheckCircle size={16} />
                Approve
              </button>
              <button className="btn-danger" onClick={()=>bulkModerate('reject')}>
                <XCircle size={16} />
                Reject
              </button>
              <button className="btn-secondary" onClick={clearSelection}>Clear</button>
            </div>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading applications...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No applications found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="applications-list">
            <div className="table-header">
              <label className="checkbox-cell"><input type="checkbox" onChange={selectAll} /></label>
              <div>Applicant</div>
              <div>Status</div>
              <div>Location</div>
              <div>Submitted</div>
              <div>Actions</div>
            </div>
            {items.map(app => {
              const id = app.userId || app._id;
              const isSel = selected.has(id);
              const isOpen = expanded[id];
              const name = app.designerName || `${app.fullName || ''} ${app.lastName || ''}`.trim();
              return (
                <div key={id} className={`application-card ${isSel?'selected':''}`}>
                  <label className="checkbox-cell"><input type="checkbox" checked={isSel} onChange={()=>toggleSelected(id)} /></label>
                  <div className="applicant-info" onClick={()=>toggleExpand(id)}>
                    <div className="applicant-avatar">{name?.[0] || 'A'}</div>
                    <div>
                      <div className="applicant-name">{name}</div>
                      <div className="applicant-meta">
                        <User size={12} />
                        {app.email}
                      </div>
                    </div>
                  </div>
                  <div className="status-cell">
                    <span className={`status-badge ${app.status}`}>{app.status}</span>
                  </div>
                  <div className="location-cell">
                    <MapPin size={12} />
                    {app.city || '—'}, {app.country || '—'}
                  </div>
                  <div className="date-cell">
                    <Calendar size={12} />
                    {new Date(app.createdAt).toLocaleString()}
                  </div>
                  <div className="actions-cell">
                    {app.status === 'pending' ? (
                      <>
                        <button className="btn-approve" onClick={()=>moderate(id, 'approve')}>
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button className="btn-reject" onClick={()=>setActive(id)}>
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    ) : (
                      <button className="btn-icon" onClick={()=>toggleExpand(id)} title="View">
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                  {isOpen && (
                    <div className="expand-details">
                      <div className="detail-section">
                        <h4>About</h4>
                        <p>{app.bio || 'No bio provided.'}</p>
                        {app.specialties?.length ? (
                          <div className="tags">
                            {app.specialties.map(t => <span key={t} className="tag">{t}</span>)}
                          </div>
                        ) : null}
                      </div>
                      <div className="detail-section">
                        <h4>Links</h4>
                        <div className="links">
                          {app.instagram && <a href={app.instagram} target="_blank" rel="noreferrer">Instagram</a>}
                          {app.website && <a href={app.website} target="_blank" rel="noreferrer">Website</a>}
                        </div>
                      </div>
                    </div>
                  )}
                  {active === id && (
                    <div className="reject-box">
                      <textarea
                        value={note}
                        onChange={(e)=>setNote(e.target.value)}
                        placeholder="Reason for rejection"
                        rows={3}
                        className="reject-textarea"
                      />
                      <div className="reject-actions">
                        <button className="btn-secondary" onClick={()=>{setActive(null); setNote('');}}>Cancel</button>
                        <button className="btn-reject" onClick={()=>moderate(id, 'reject', note)}>Confirm Reject</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn-secondary" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button>
            <div className="page-info">Page {page} / {totalPages}</div>
            <button className="btn-secondary" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
          </div>
        )}
      </div>

      <style>{`
        .admin-applications-page {
          min-height: 100vh;
          background: var(--kc-navy-900);
          padding-top: 74px;
          font-family: var(--kc-font-sans);
          position: relative;
        }

        .admin-applications-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .admin-applications-page > * {
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
          padding: 6px 12px;
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
          display: flex;
          gap: 16px;
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

        .bulk-actions-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 247, 230, 0.15);
          border: 1px solid var(--kc-gold-200);
          padding: 16px 20px;
          border-radius: var(--kc-radius);
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
        }

        .bulk-info {
          font-weight: 600;
          color: var(--kc-cream-100);
        }

        .bulk-buttons {
          display: flex;
          gap: var(--kc-gap-xs);
          flex-wrap: wrap;
        }

        .btn-success {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: rgba(30, 126, 52, 0.2);
          border: 1px solid rgba(161, 224, 181, 0.4);
          border-radius: var(--kc-radius);
          color: #a1e0b5;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .btn-success:hover {
          background: rgba(30, 126, 52, 0.3);
          transform: translateY(-2px);
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: rgba(167, 29, 42, 0.2);
          border: 1px solid rgba(245, 181, 181, 0.4);
          border-radius: var(--kc-radius);
          color: #f5b5b5;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .btn-danger:hover {
          background: rgba(167, 29, 42, 0.3);
          transform: translateY(-2px);
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

        .applications-list {
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius-lg);
          overflow: hidden;
          box-shadow: var(--kc-shadow-sm);
          backdrop-filter: blur(10px) saturate(110%);
        }

        .table-header {
          display: grid;
          grid-template-columns: 40px 2fr 1fr 1.2fr 1.4fr 1.4fr;
          gap: var(--kc-gap-sm);
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--kc-beige-300);
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .application-card {
          display: grid;
          grid-template-columns: 40px 2fr 1fr 1.2fr 1.4fr 1.4fr;
          gap: var(--kc-gap-sm);
          padding: 16px 20px;
          border-top: 1px solid var(--kc-glass-border);
          align-items: center;
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .application-card:hover {
          background: rgba(211, 167, 95, 0.08);
        }

        .application-card.selected {
          background: rgba(255, 247, 230, 0.15);
          border-color: var(--kc-gold-200);
        }

        .checkbox-cell {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .applicant-info {
          display: flex;
          gap: var(--kc-gap-sm);
          align-items: center;
          cursor: pointer;
        }

        .applicant-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--kc-grad-gold);
          color: var(--kc-navy-700);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .applicant-name {
          font-weight: 700;
          color: var(--kc-cream-100);
        }

        .applicant-meta {
          color: var(--kc-beige-300);
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: var(--kc-radius-full);
          font-weight: 600;
          font-size: 0.75rem;
        }

        .status-badge.pending {
          background: rgba(255, 247, 230, 0.2);
          color: #f3d1a6;
          border: 1px solid rgba(243, 209, 166, 0.4);
        }

        .status-badge.approved {
          background: rgba(30, 126, 52, 0.2);
          color: #a1e0b5;
          border: 1px solid rgba(161, 224, 181, 0.4);
        }

        .status-badge.rejected {
          background: rgba(167, 29, 42, 0.2);
          color: #f5b5b5;
          border: 1px solid rgba(245, 181, 181, 0.4);
        }

        .location-cell, .date-cell {
          color: var(--kc-beige-300);
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .actions-cell {
          display: flex;
          gap: var(--kc-gap-xs);
          justify-content: flex-end;
        }

        .btn-approve {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--kc-grad-gold);
          color: var(--kc-navy-900);
          border: none;
          border-radius: var(--kc-radius);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .btn-approve:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(211, 167, 95, 0.35);
        }

        .btn-reject {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          color: #f5b5b5;
          border: 1px solid rgba(245, 181, 181, 0.5);
          border-radius: var(--kc-radius);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .btn-reject:hover {
          background: rgba(167, 29, 42, 0.2);
          border-color: rgba(245, 181, 181, 0.8);
          transform: translateY(-2px);
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

        .expand-details {
          grid-column: 2 / -1;
          display: grid;
          gap: 16px;
          padding: 20px 0;
          border-top: 1px solid var(--kc-glass-border);
        }

        .detail-section h4 {
          margin: 0 0 8px 0;
          font-weight: 600;
          color: var(--kc-cream-100);
          font-family: var(--kc-font-serif);
        }

        .detail-section p {
          color: var(--kc-beige-300);
          margin-bottom: 12px;
        }

        .tags {
          display: flex;
          gap: var(--kc-gap-xs);
          flex-wrap: wrap;
        }

        .tag {
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius-full);
          font-size: 0.75rem;
          color: var(--kc-cream-100);
          backdrop-filter: blur(10px);
        }

        .links {
          display: flex;
          gap: var(--kc-gap-sm);
        }

        .links a {
          color: var(--kc-gold-200);
          text-decoration: none;
          font-weight: 600;
          transition: color var(--kc-duration-sm) var(--kc-ease);
        }

        .links a:hover {
          color: var(--kc-gold-100);
          text-decoration: underline;
        }

        .reject-box {
          grid-column: 1 / -1;
          display: grid;
          gap: var(--kc-gap-sm);
          padding: 16px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--kc-radius);
          margin-top: 12px;
          backdrop-filter: blur(10px);
        }

        .reject-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          resize: vertical;
          color: var(--kc-cream-100);
          background: rgba(255, 255, 255, 0.08);
          font-family: inherit;
          backdrop-filter: blur(10px);
        }

        .reject-textarea::placeholder {
          color: var(--kc-beige-300);
          opacity: 0.6;
        }

        .reject-textarea:focus {
          outline: none;
          border-color: var(--kc-gold-200);
          box-shadow: 0 0 0 3px rgba(211, 167, 95, 0.1);
          background: rgba(255, 255, 255, 0.12);
        }

        .reject-actions {
          display: flex;
          gap: var(--kc-gap-xs);
          justify-content: flex-end;
        }

        .pagination {
          display: flex;
          gap: 16px;
          align-items: center;
          justify-content: center;
          margin-top: 32px;
        }

        .page-info {
          color: var(--kc-cream-100);
          font-weight: 600;
        }

        @media (max-width: 968px) {
          .table-header, .application-card {
            grid-template-columns: 32px 2fr 1fr 1fr 1fr 1fr;
            font-size: 0.875rem;
          }

          .filters-group {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
