import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav';
import { Search, Filter, Download, Eye, Truck, Package, User, Calendar, CreditCard, CheckCircle, XCircle } from 'lucide-react';

export default function Orders(){
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewing, setViewing] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const statuses = ['pending','processing','shipped','delivered','canceled','refunded'];

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query.trim());
    if (status !== 'all') params.append('status', status);
    if (sort) params.append('sort', sort);
    params.append('page', String(page));
    params.append('limit', '20');
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api(`/api/admin/orders${buildQuery()}`, { token });
      if (Array.isArray(res)) { setOrders(res); setTotalPages(1); }
      else { setOrders(res.orders || []); setTotalPages(res.pagination?.total || 1); }
    } catch (e) { setError(e.message || 'Failed to load orders'); setOrders([]); }
    setLoading(false);
  };

  useEffect(()=>{ load(); }, [token, query, status, sort, page]);

  const setStatusApi = async (id, next) => { await api(`/api/admin/orders/${id}/status`, { method:'PATCH', token, body:{ status: next } }); load(); };

  const toggleSelected = (id) => setSelected(prev => { const s = new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });
  const selectAll = () => setSelected(new Set(orders.map(o => o._id)));
  const clearSel = () => setSelected(new Set());

  const bulkStatus = async (next) => {
    if (!selected.size) return;
    if (!window.confirm(`Mark ${selected.size} orders as ${next}?`)) return;
    for (const id of selected) { try { await setStatusApi(id, next); } catch {} }
    clearSel();
    load();
  };

  const exportCSV = () => {
    const headers = ['OrderId','Buyer','Email','Status','Total','Items','Created'];
    const rows = orders.map(o => [
      o._id,
      o.userId?.name || '—',
      o.userId?.email || '—',
      o.status,
      o.totals?.total || o.total || 0,
      (o.items || []).map(i=>`${i.title || i.name}×${i.quantity}`).join(' | '),
      new Date(o.createdAt).toISOString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const count = useMemo(()=>orders.length, [orders]);

  return (
    <div className="admin-orders-page">
      <div className="page-hero-header">
        <div className="page-hero-content">
          <div>
            <div className="hero-badge">
              <Package size={16} />
              <span>ORDER MANAGEMENT</span>
            </div>
            <h1 className="page-title">Orders</h1>
            <p className="page-subtitle">{count} order{count!==1?'s':''}</p>
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
              placeholder="Search order id, buyer, email..."
              value={query}
              onChange={(e)=>{ setPage(1); setQuery(e.target.value); }}
            />
          </div>
          <div className="filters-group">
            <Filter size={16} />
            <select className="filter-select" value={status} onChange={(e)=>{ setPage(1); setStatus(e.target.value); }}>
              <option value="all">All Status</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={sort} onChange={(e)=>{ setPage(1); setSort(e.target.value); }}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="bulk-actions-card">
            <div className="bulk-info">{selected.size} selected</div>
            <div className="bulk-buttons">
              <button className="btn-secondary" onClick={()=>bulkStatus('processing')}>Mark Processing</button>
              <button className="btn-secondary" onClick={()=>bulkStatus('shipped')}>Mark Shipped</button>
              <button className="btn-success" onClick={()=>bulkStatus('delivered')}>
                <CheckCircle size={16} />
                Mark Delivered
              </button>
              <button className="btn-danger" onClick={()=>bulkStatus('canceled')}>
                <XCircle size={16} />
                Cancel
              </button>
              <button className="btn-secondary" onClick={clearSel}>Clear</button>
            </div>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>No orders found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="orders-table">
            <div className="table-header">
              <label className="checkbox-cell"><input type="checkbox" onChange={selectAll} /></label>
              <div>Order</div>
              <div>Buyer</div>
              <div>Status</div>
              <div>Total</div>
              <div>Created</div>
              <div>Actions</div>
            </div>
            {orders.map(o => {
              const isSel = selected.has(o._id);
              const total = o.totals?.total || o.total || 0;
              const itemsLabel = (o.items || []).slice(0,3).map(i=>`${i.title || i.name}×${i.quantity}`).join(', ');
              return (
                <div key={o._id} className={`table-row ${isSel?'selected':''}`}>
                  <label className="checkbox-cell"><input type="checkbox" checked={isSel} onChange={()=>toggleSelected(o._id)} /></label>
                  <div className="order-cell">
                    <div className="order-id">#{o._id?.slice(-6)}</div>
                    <div className="order-items">{itemsLabel}{(o.items||[]).length>3?'...':''}</div>
                  </div>
                  <div className="buyer-cell">
                    <User size={14} />
                    {o.userId?.name || '—'}
                    <span className="buyer-email">({o.userId?.email || '—'})</span>
                  </div>
                  <div className="status-cell">
                    <select className={`status-select ${o.status}`} value={o.status} onChange={(e)=>setStatusApi(o._id, e.target.value)}>
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="total-cell">
                    <CreditCard size={14} />
                    ₹{total}
                  </div>
                  <div className="meta-cell">
                    <Calendar size={14} />
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                  <div className="actions-cell">
                    <button className="btn-icon" onClick={()=>setViewing(o)} title="View">
                      <Eye size={16} />
                    </button>
                  </div>
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

        {viewing && (
          <div 
            className="modal-overlay" 
            onClick={()=>setViewing(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setViewing(null);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          >
            <div className="modal-card large" onClick={(e)=>e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Order #{viewing._id?.slice(-6)}</h3>
                <button className="close-btn" onClick={()=>setViewing(null)} aria-label="Close modal">×</button>
              </div>
              <div className="modal-body">
                <div className="modal-grid">
                  <div className="modal-section">
                    <h4>Buyer</h4>
                    <div>{viewing.userId?.name} ({viewing.userId?.email})</div>
                    {viewing.shipping?.address && (
                      <div className="small-text">{viewing.shipping.address}, {viewing.shipping.city}, {viewing.shipping.state} {viewing.shipping.zip}</div>
                    )}
                  </div>
                  <div className="modal-section">
                    <h4>Totals</h4>
                    <div>Subtotal: ₹{viewing.totals?.subtotal || 0}</div>
                    <div>Discount: ₹{viewing.totals?.cartDiscount || 0}</div>
                    <div>Shipping: ₹{viewing.totals?.shipping || 0}</div>
                    <div>Tax: ₹{viewing.totals?.tax || 0}</div>
                    <div className="total-amount"><strong>Total: ₹{viewing.totals?.total || viewing.total || 0}</strong></div>
                  </div>
                </div>
                <div className="items-section">
                  <h4>Items</h4>
                  {(viewing.items || []).map(it => (
                    <div key={it._id || it.productId} className="item-row">
                      <div className="item-title">{it.title || it.name}</div>
                      <div className="item-meta">Qty {it.quantity} {it.size?`• Size ${it.size}`:''} {it.color?`• ${it.color}`:''}</div>
                      <div className="item-price">₹{(it.price || 0) * (it.quantity || 1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-orders-page {
          min-height: 100vh;
          background: var(--kc-navy-900);
          padding-top: 74px;
          font-family: var(--kc-font-sans);
          position: relative;
        }

        .admin-orders-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .admin-orders-page > * {
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

        .btn-success {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: rgba(30, 126, 52, 0.2);
          border: 1px solid rgba(161, 224, 181, 0.4);
          border-radius: var(--kc-radius);
          color: rgba(129, 199, 132, 1);
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
          color: rgba(239, 154, 154, 1);
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .btn-danger:hover {
          background: rgba(167, 29, 42, 0.3);
          transform: translateY(-2px);
        }

        .error-banner {
          padding: 12px 16px;
          background: rgba(167, 29, 42, 0.2);
          border: 1px solid rgba(167, 29, 42, 0.4);
          border-radius: var(--kc-radius);
          color: rgba(255, 179, 191, 1);
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

        .orders-table {
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius-lg);
          overflow: hidden;
          box-shadow: var(--kc-shadow-sm);
          backdrop-filter: blur(10px) saturate(110%);
        }

        .table-header {
          display: grid;
          grid-template-columns: 40px 2fr 1.6fr 1.2fr 1fr 1.4fr 1fr;
          gap: var(--kc-gap-sm);
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--kc-beige-300);
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table-row {
          display: grid;
          grid-template-columns: 40px 2fr 1.6fr 1.2fr 1fr 1.4fr 1fr;
          gap: var(--kc-gap-sm);
          padding: 16px 20px;
          border-top: 1px solid var(--kc-glass-border);
          align-items: center;
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .table-row:hover {
          background: rgba(211, 167, 95, 0.08);
        }

        .table-row.selected {
          background: rgba(255, 247, 230, 0.15);
          border-color: var(--kc-gold-200);
        }

        .checkbox-cell {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .order-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-id {
          font-weight: 800;
          color: var(--kc-cream-100);
        }

        .order-items {
          color: var(--kc-beige-300);
          font-size: 0.875rem;
        }

        .buyer-cell {
          display: flex;
          align-items: center;
          gap: var(--kc-gap-xs);
          color: var(--kc-cream-100);
        }

        .buyer-email {
          color: var(--kc-beige-300);
          font-size: 0.875rem;
        }

        .status-select {
          padding: 8px 12px;
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

        .status-select:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
        }

        .status-select:focus {
          outline: none;
          border-color: var(--kc-gold-200);
          box-shadow: 0 0 0 3px rgba(211, 167, 95, 0.1);
        }

        .total-cell {
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--kc-cream-100);
        }

        .meta-cell {
          color: var(--kc-beige-300);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
        }

        .actions-cell {
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
        }

        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
          transform: translateY(-2px);
        }

        .pagination {
          display: flex;
          gap: var(--kc-gap-sm);
          align-items: center;
          justify-content: center;
          margin-top: 32px;
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
          width: 100%;
          max-width: 600px;
          border: 1px solid var(--kc-glass-border);
          box-shadow: var(--kc-shadow-lg);
          backdrop-filter: blur(20px) saturate(110%);
        }

        .modal-card.large {
          max-width: 900px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--kc-glass-border);
        }

        .modal-title {
          font-family: var(--kc-font-serif);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--kc-cream-100);
          margin: 0;
        }

        .close-btn {
          background: transparent;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: var(--kc-beige-300);
          line-height: 1;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--kc-radius);
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--kc-cream-100);
        }

        .modal-body {
          padding: 24px;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .modal-section {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          padding: 16px;
          backdrop-filter: blur(10px);
        }

        .modal-section h4 {
          font-weight: 600;
          color: var(--kc-cream-100);
          margin: 0 0 12px 0;
        }

        .modal-section > div {
          color: var(--kc-beige-300);
          margin-bottom: 8px;
        }

        .small-text {
          font-size: 0.875rem;
          color: var(--kc-beige-300);
          opacity: 0.8;
        }

        .total-amount {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--kc-glass-border);
          font-size: 1.125rem;
          color: var(--kc-cream-100);
          font-weight: 700;
        }

        .items-section {
          margin-top: 24px;
        }

        .items-section h4 {
          font-weight: 600;
          color: var(--kc-cream-100);
          margin: 0 0 16px 0;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: start;
          padding: 12px 16px;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          margin-bottom: 12px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }

        .item-title {
          font-weight: 600;
          color: var(--kc-cream-100);
          flex: 1;
        }

        .item-meta {
          color: var(--kc-beige-300);
          font-size: 0.875rem;
          margin: 4px 0;
        }

        .item-price {
          font-weight: 700;
          color: var(--kc-cream-100);
          margin-left: 16px;
        }

        @media (max-width: 968px) {
          .table-header, .table-row {
            grid-template-columns: 32px 1.8fr 1.4fr 1.1fr 1fr 1.2fr 1fr;
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
