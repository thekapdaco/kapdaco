import { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Package, DollarSign, User, Tag, ChevronDown, ChevronUp } from 'lucide-react';

export default function Products() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | approved | pending
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Selection & Actions
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState({});
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const categories = ['mens', 'womens', 'accessories', 'tshirt', 'hoodie', 'cap'];

  const loadBrands = async () => {
    try {
      const data = await api('/api/admin/users?role=brand', { token });
      setBrands(data.users || data || []);
    } catch {}
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query.trim());
    if (statusFilter !== 'all') params.append('approved', statusFilter === 'approved' ? 'true' : 'false');
    if (categoryFilter !== 'all') params.append('category', categoryFilter);
    if (brandFilter !== 'all') params.append('brandId', brandFilter);
    params.append('page', String(page));
    params.append('limit', '24');
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api(`/api/admin/products${buildQuery()}`, { token });
      if (Array.isArray(res)) {
        setProducts(res);
        setTotalPages(1);
      } else {
        setProducts(res.products || []);
        setTotalPages(res.pagination?.total || 1);
      }
    } catch (e) {
      setError(e.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token, query, statusFilter, categoryFilter, brandFilter, page]);
  useEffect(() => { loadBrands(); }, [token]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map(p => p._id)));
  };

  const approve = async (productId, isApproved) => {
    await api('/api/admin/products/approve', { method: 'PATCH', token, body: { productId, isApproved } });
    load();
  };

  const bulkApprove = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Approve ${selected.size} product(s)?`)) return;
    for (const id of selected) {
      try { await api('/api/admin/products/approve', { method: 'PATCH', token, body: { productId: id, isApproved: true } }); } catch {}
    }
    setSelected(new Set());
    load();
  };

  const bulkReject = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Reject ${selected.size} product(s)?`)) return;
    for (const id of selected) {
      try { await api('/api/admin/products/approve', { method: 'PATCH', token, body: { productId: id, isApproved: false } }); } catch {}
    }
    setSelected(new Set());
    load();
  };

  const remove = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    await api(`/api/admin/products/${productId}`, { method: 'DELETE', token });
    load();
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (p) => {
    const approved = p.isApproved || p.status === 'approved' || p.status === 'published';
    return (
      <span className={`status-badge ${approved ? 'approved' : 'pending'}`}>
        {approved ? 'Approved' : 'Pending'}
      </span>
    );
  };

  const getImage = (p) => {
    return p.media?.mainImage || p.images?.[0] || p.imageUrl || null;
  };

  const filteredCount = useMemo(() => products.length, [products]);

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Brand Products</h1>
          <div className="meta">{filteredCount} product{filteredCount !== 1 ? 's' : ''}</div>
        </div>
        <div className="header-actions">
          <button 
            className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <Package size={18} />
          </button>
          <button 
            className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="products-content-wrapper">
      <div className="toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input
            className="search-input"
            placeholder="Search products by name, description..."
            value={query}
            onChange={(e) => { setPage(1); setQuery(e.target.value); }}
          />
        </div>
        <div className="filters">
          <select className="filter-select" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
          <select className="filter-select" value={categoryFilter} onChange={(e) => { setPage(1); setCategoryFilter(e.target.value); }}>
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
          </select>
          <select className="filter-select" value={brandFilter} onChange={(e) => { setPage(1); setBrandFilter(e.target.value); }}>
            <option value="all">All Brands</option>
            {brands.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk-actions">
          <span>{selected.size} selected</span>
          <div className="bulk-buttons">
            <button className="btn success" onClick={bulkApprove}>
              <CheckCircle size={16} /> Approve All
            </button>
            <button className="btn danger" onClick={bulkReject}>
              <XCircle size={16} /> Reject All
            </button>
            <button className="btn" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <Package size={64} />
          <h3>No products found</h3>
          <p>Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <>
          <div className={`products-${viewMode}`}>
            {products.map(p => {
              const img = getImage(p);
              const isExpanded = expanded[p._id];
              const isSelected = selected.has(p._id);
              const pricing = p.pricing || {};
              const brand = p.createdBy || p.brand || {};

              return (
                <div key={p._id} className={`product-card ${isSelected ? 'selected' : ''}`}>
                  <div 
                    className="card-header" 
                    onClick={() => toggleExpand(p._id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(p._id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={expanded === p._id}
                    aria-label={`${expanded === p._id ? 'Collapse' : 'Expand'} product ${p.title || p.name}`}
                  >
                    <div className="product-image-wrapper">
                      {img ? (
                        <img src={img} alt={p.title || p.name} className="product-image" />
                      ) : (
                        <div className="image-placeholder">
                          <Package size={32} />
                        </div>
                      )}
                      {getStatusBadge(p)}
                      <button 
                        type="button"
                        className="checkbox-wrapper" 
                        onClick={(e) => { e.stopPropagation(); toggleSelect(p._id); }}
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} product ${p.title || p.name}`}
                        aria-pressed={isSelected}
                      >
                        <input type="checkbox" checked={isSelected} onChange={() => {}} />
                      </button>
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">{p.title || p.name || 'Untitled Product'}</h3>
                      <div className="product-meta">
                        <span className="meta-item">
                          <User size={14} />
                          {brand.name || 'Unknown Brand'}
                        </span>
                        <span className="meta-item">
                          <Tag size={14} />
                          {p.category || 'N/A'}
                        </span>
                        <span className="meta-item">
                          <DollarSign size={14} />
                          ₹{pricing.price || p.price || '0'}
                          {pricing.discountPrice && (
                            <span className="discount"> → ₹{pricing.discountPrice}</span>
                          )}
                        </span>
                      </div>
                      <p className="product-description">
                        {(p.description || '').substring(0, 100)}
                        {(p.description || '').length > 100 ? '...' : ''}
                      </p>
                    </div>
                    <button className="expand-btn">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="product-details">
                      <div className="detail-section">
                        <h4>Product Details</h4>
                        <div className="detail-grid">
                          <div><strong>ID:</strong> {p._id}</div>
                          <div><strong>SKU:</strong> {p.inventory?.sku || 'N/A'}</div>
                          <div><strong>Stock:</strong> {p.inventory?.stockQty || 0}</div>
                          <div><strong>Material:</strong> {p.variants?.material || 'N/A'}</div>
                          {p.variants?.colors && (
                            <div><strong>Colors:</strong> {p.variants.colors.join(', ')}</div>
                          )}
                          {p.variants?.sizes && (
                            <div><strong>Sizes:</strong> {p.variants.sizes.join(', ')}</div>
                          )}
                          <div><strong>Created:</strong> {new Date(p.createdAt).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button className="btn" onClick={() => setViewing(p)}>
                          <Eye size={16} /> View Full
                        </button>
                        <button className="btn" onClick={() => setEditing(p)}>
                          <Edit size={16} /> Edit
                        </button>
                        <button 
                          className={`btn ${p.isApproved ? 'warning' : 'success'}`}
                          onClick={() => approve(p._id, !p.isApproved)}
                        >
                          {p.isApproved ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          {p.isApproved ? 'Unapprove' : 'Approve'}
                        </button>
                        <button className="btn danger" onClick={() => remove(p._id)}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Previous
              </button>
              <div className="page-info">Page {page} of {totalPages}</div>
              <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next
              </button>
            </div>
          )}
        </>
      )}
      </div>

      {/* View Modal */}
      {viewing && (
        <div 
          className="modal" 
          onClick={() => setViewing(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setViewing(null);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div className="modal-content large" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{viewing.title || viewing.name}</h2>
              <button className="close-btn" onClick={() => setViewing(null)} aria-label="Close modal">×</button>
            </div>
            <div className="modal-body">
              {getImage(viewing) && (
                <img src={getImage(viewing)} alt={viewing.title} className="modal-image" />
              )}
              <div className="modal-details">
                <div><strong>Description:</strong> {viewing.description || 'N/A'}</div>
                <div><strong>Price:</strong> ₹{viewing.pricing?.price || viewing.price || '0'}</div>
                <div><strong>Category:</strong> {viewing.category || 'N/A'}</div>
                <div><strong>Brand:</strong> {viewing.createdBy?.name || 'Unknown'}</div>
                <div><strong>Status:</strong> {getStatusBadge(viewing)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .products-page {
          padding: 0;
          padding-top: 74px;
          max-width: 100%;
          margin: 0;
          font-family: var(--kc-font-sans);
          background: var(--kc-navy-900);
          min-height: 100vh;
          position: relative;
        }

        .products-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .products-page > * {
          position: relative;
          z-index: 1;
        }

        .page-header {
          background: var(--kc-navy-900);
          border-bottom: 1px solid var(--kc-glass-border);
          padding: var(--kc-gap-lg) var(--kc-spacing-xl);
          margin-bottom: var(--kc-gap-xl);
          backdrop-filter: blur(10px);
        }

        .header-left h1 {
          font-family: var(--kc-font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--kc-cream-100);
          margin: 0 0 4px 0;
          letter-spacing: var(--kc-letterspacing-heading);
        }

        .meta {
          color: var(--kc-beige-300);
          font-size: 0.9rem;
        }

        .products-content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px 48px;
        }

        .header-actions {
          display: flex;
          gap: var(--kc-gap-xs);
        }

        .view-toggle {
          padding: 10px;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          background: var(--kc-glass-01);
          cursor: pointer;
          color: var(--kc-beige-300);
          transition: all var(--kc-duration-sm) var(--kc-ease);
          backdrop-filter: blur(10px);
        }

        .view-toggle:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
        }

        .view-toggle.active {
          background: var(--kc-grad-gold);
          color: var(--kc-navy-900);
          border-color: transparent;
          box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
        }

        .toolbar {
          display: flex;
          gap: var(--kc-gap-sm);
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-bar {
          flex: 1;
          min-width: 300px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          backdrop-filter: blur(10px);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.9375rem;
          color: var(--kc-cream-100);
          background: transparent;
          font-family: var(--kc-font-sans);
        }

        .search-input::placeholder {
          color: var(--kc-beige-300);
          opacity: 0.6;
        }

        .filters {
          display: flex;
          gap: var(--kc-gap-xs);
        }

        .filter-select {
          padding: 12px 16px;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          background: rgba(255, 255, 255, 0.08);
          font-size: 0.9375rem;
          cursor: pointer;
          color: var(--kc-cream-100);
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

        .bulk-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 247, 230, 0.15);
          border: 1px solid var(--kc-gold-200);
          border-radius: var(--kc-radius);
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
        }

        .bulk-buttons {
          display: flex;
          gap: var(--kc-gap-xs);
        }

        .error-banner {
          padding: 12px 16px;
          background: rgba(167, 29, 42, 0.2);
          border: 1px solid rgba(167, 29, 42, 0.4);
          border-radius: var(--kc-radius);
          color: rgba(255, 179, 191, 1);
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--kc-glass-01);
          border-radius: var(--kc-radius-lg);
          border: 1px solid var(--kc-glass-border);
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

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .products-list {
          display: flex;
          flex-direction: column;
          gap: var(--kc-gap-sm);
          margin-bottom: 24px;
        }

        .products-list .product-card {
          display: grid;
          grid-template-columns: 120px 1fr auto;
          gap: var(--kc-gap-sm);
        }

        .product-card {
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius-lg);
          overflow: hidden;
          box-shadow: var(--kc-shadow-sm);
          backdrop-filter: blur(10px) saturate(110%);
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--kc-shadow-md);
          border-color: var(--kc-gold-200);
          background: rgba(255, 255, 255, 0.1);
        }

        .product-card.selected {
          border-color: var(--kc-gold-200);
          background: rgba(255, 247, 230, 0.15);
        }

        .card-header {
          display: flex;
          gap: var(--kc-gap-sm);
          padding: 16px;
          cursor: pointer;
          align-items: start;
        }

        .product-image-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          flex-shrink: 0;
          border-radius: var(--kc-radius);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--kc-glass-border);
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--kc-beige-300);
        }

        .status-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 4px 10px;
          border-radius: var(--kc-radius);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.approved {
          background: rgba(30, 126, 52, 0.2);
          color: rgba(129, 199, 132, 1);
          border: 1px solid rgba(161, 224, 181, 0.4);
        }

        .status-badge.pending {
          background: rgba(255, 247, 230, 0.2);
          color: rgba(255, 183, 77, 0.9);
          border: 1px solid rgba(243, 209, 166, 0.4);
        }

        .checkbox-wrapper {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 4px;
          backdrop-filter: blur(10px);
        }

        .checkbox-wrapper input {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .product-info {
          flex: 1;
        }

        .product-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--kc-cream-100);
          margin: 0 0 8px 0;
          font-family: var(--kc-font-serif);
        }

        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: var(--kc-gap-sm);
          margin-bottom: 8px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--kc-beige-300);
          font-size: 0.875rem;
        }

        .discount {
          color: var(--kc-gold-200);
          font-weight: 600;
        }

        .product-description {
          color: var(--kc-beige-300);
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.5;
        }

        .expand-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--kc-beige-300);
          padding: 8px;
          transition: color var(--kc-duration-sm) var(--kc-ease);
        }

        .expand-btn:hover {
          color: var(--kc-cream-100);
        }

        .product-details {
          padding: 16px;
          border-top: 1px solid var(--kc-glass-border);
        }

        .detail-section {
          margin-bottom: 16px;
        }

        .detail-section h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--kc-cream-100);
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(211, 167, 95, 0.3);
          font-family: var(--kc-font-serif);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--kc-gap-sm);
        }

        .detail-grid > div {
          color: var(--kc-beige-300);
          font-size: 0.9rem;
        }

        .card-actions {
          display: flex;
          gap: var(--kc-gap-xs);
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: var(--kc-radius);
          border: 1px solid var(--kc-glass-border);
          background: var(--kc-glass-01);
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          color: var(--kc-cream-100);
          backdrop-filter: blur(10px);
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--kc-shadow-sm);
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
        }

        .btn.success {
          background: rgba(30, 126, 52, 0.2);
          border-color: rgba(161, 224, 181, 0.4);
          color: rgba(129, 199, 132, 1);
        }

        .btn.success:hover {
          background: rgba(30, 126, 52, 0.3);
        }

        .btn.warning {
          background: rgba(255, 247, 230, 0.2);
          border-color: rgba(243, 209, 166, 0.4);
          color: rgba(255, 183, 77, 0.9);
        }

        .btn.warning:hover {
          background: rgba(255, 247, 230, 0.3);
        }

        .btn.danger {
          background: rgba(167, 29, 42, 0.2);
          border-color: rgba(245, 181, 181, 0.4);
          color: #f5b5b5;
        }

        .btn.danger:hover {
          background: rgba(167, 29, 42, 0.3);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--kc-gap-sm);
          margin-top: 32px;
        }

        .page-info {
          color: var(--kc-cream-100);
          font-weight: 600;
        }

        .modal {
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

        .modal-content {
          background: var(--kc-glass-01);
          border-radius: var(--kc-radius-lg);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--kc-glass-border);
          backdrop-filter: blur(20px) saturate(110%);
        }

        .modal-content.large {
          max-width: 900px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid var(--kc-glass-border);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--kc-cream-100);
          font-family: var(--kc-font-serif);
        }

        .close-btn {
          background: transparent;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: var(--kc-beige-300);
          line-height: 1;
          transition: color var(--kc-duration-sm) var(--kc-ease);
        }

        .close-btn:hover {
          color: var(--kc-cream-100);
        }

        .modal-body {
          padding: 20px;
        }

        .modal-image {
          width: 100%;
          max-height: 400px;
          object-fit: contain;
          border-radius: var(--kc-radius);
          margin-bottom: 20px;
        }

        .modal-details {
          display: grid;
          gap: var(--kc-gap-sm);
        }

        .modal-details > div {
          padding: 12px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--kc-radius);
          color: var(--kc-beige-300);
          border: 1px solid var(--kc-glass-border);
        }

        @media (max-width: 768px) {
          .products-page {
            padding: 16px;
          }

          .toolbar {
            flex-direction: column;
          }

          .search-bar {
            min-width: 100%;
          }

          .filters {
            flex-direction: column;
            width: 100%;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }

          .products-list .product-card {
            grid-template-columns: 1fr;
          }

          .card-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
