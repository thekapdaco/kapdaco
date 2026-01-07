import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav';
import { CheckCircle, XCircle, Eye, ChevronDown, ChevronUp, Package, DollarSign, Truck, User, Tag, Palette } from 'lucide-react';

export default function Designs() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [expanded, setExpanded] = useState({});
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const q = status === 'all' ? '' : `?status=${status}`;
      const res = await api(`/api/admin/designs${q}`, { token });
      setItems(res.designs || res || []);
    } catch (err) {
      console.error('Failed to load designs:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token, status]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const moderate = async (designId, action, notes = '') => {
    try {
      await api('/api/admin/designs/moderate', { 
        method: 'PATCH', 
        token, 
        body: { designId, action, adminNotes: notes } 
      });
      setShowRejectModal(null);
      setRejectNote('');
      load();
    } catch (err) {
      alert(err.message || 'Failed to moderate design');
    }
  };

  const handleReject = (id) => {
    if (rejectNote.trim()) {
      moderate(id, 'reject', rejectNote);
    } else {
      alert('Please provide a reason for rejection');
    }
  };

  const getStatusBadge = (s) => {
    const styles = {
      pending: { bg: 'rgba(255, 183, 77, 0.15)', color: 'rgba(255, 183, 77, 0.95)', label: 'Pending Review' },
      approved: { bg: 'rgba(46, 125, 50, 0.15)', color: 'rgba(46, 125, 50, 0.95)', label: 'Approved' },
      rejected: { bg: 'rgba(183, 28, 28, 0.15)', color: 'rgba(183, 28, 28, 0.95)', label: 'Rejected' },
      published: { bg: 'rgba(46, 125, 50, 0.15)', color: 'rgba(46, 125, 50, 0.95)', label: 'Published' },
    };
    const style = styles[s] || styles.pending;
    return <span style={{ padding: '4px 12px', borderRadius: 12, background: style.bg, color: style.color, fontSize: '0.75rem', fontWeight: 600 }}>{style.label}</span>;
  };

  return (
    <div className="admin-designs-page">
      <div className="page-hero-header">
        <div className="page-hero-content">
          <div>
            <div className="hero-badge">
              <Palette size={16} />
              <span>DESIGNER PRODUCTS REVIEW</span>
            </div>
            <h1 className="page-title">Designer Products</h1>
            <p className="page-subtitle">Review and moderate designer product submissions</p>
          </div>
        </div>
      </div>

      <AdminNav />

      <div className="designs-content-wrapper">
      <div className="filters-bar">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="filter-select">
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="published">Published</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="stats-badge">
          {items.length} {status === 'all' ? 'total' : status} product{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>No products found</h3>
          <p>No products match the selected filter.</p>
        </div>
      ) : (
        <div className="products-grid">
          {items.map(d => {
            const isExpanded = expanded[d._id];
            const product = d;
            const media = product.media || {};
            const variants = product.variants || {};
            const pricing = product.pricing || {};
            const shipping = product.shipping || {};
            const designer = product.designer || product.designerId || {};

            return (
              <div key={d._id} className="product-card">
                <div className="product-header" onClick={() => toggleExpand(d._id)}>
                  <div className="product-preview">
                    {media.mainImage ? (
                      <img src={media.mainImage} alt={product.title || product.name} className="preview-img" />
                    ) : (
                      <div className="preview-placeholder">No Image</div>
                    )}
                    {getStatusBadge(product.status || d.status)}
                  </div>
                  <div className="product-summary">
                    <h3 className="product-title">{product.title || product.name || 'Untitled Product'}</h3>
                    <div className="product-meta">
                      <span className="meta-item">
                        <User size={14} />
                        {designer.name || designer.designerName || 'Unknown Designer'}
                      </span>
                      <span className="meta-item">
                        <Tag size={14} />
                        {product.category || 'N/A'}
                      </span>
                      <span className="meta-item">
                        <DollarSign size={14} />
                        ₹{pricing.price || '0'}
                        {pricing.discountPrice && (
                          <span style={{ textDecoration: 'line-through', marginLeft: 4, opacity: 0.6 }}>
                            ₹{pricing.price}
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="product-description-short">
                      {(product.description || '').substring(0, 120)}
                      {(product.description || '').length > 120 ? '...' : ''}
                    </p>
                  </div>
                  <button className="expand-btn">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="product-details">
                    {/* Basic Info */}
                    <div className="detail-section">
                      <h4 className="section-heading">Basic Information</h4>
                      <div className="detail-grid">
                        <div><strong>Name:</strong> {product.title || product.name}</div>
                        <div><strong>Category:</strong> {product.category}</div>
                        {product.subcategory && <div><strong>Subcategory:</strong> {product.subcategory}</div>}
                        <div><strong>Description:</strong> {product.description}</div>
                        {product.tags && product.tags.length > 0 && (
                          <div><strong>Tags:</strong> {product.tags.join(', ')}</div>
                        )}
                      </div>
                    </div>

                    {/* Design & Media */}
                    <div className="detail-section">
                      <h4 className="section-heading">Design & Media</h4>
                      <div className="media-grid">
                        {media.mainImage && (
                          <div className="media-item">
                            <label>Design File:</label>
                            <img src={media.mainImage} alt="Design" className="detail-img" />
                          </div>
                        )}
                        {media.placement && (
                          <div><strong>Placement:</strong> {media.placement}</div>
                        )}
                        {media.designType && (
                          <div><strong>Design Type:</strong> {media.designType}</div>
                        )}
                        {media.galleryImages && media.galleryImages.length > 0 && (
                          <div className="media-item">
                            <label>Mockups:</label>
                            <div className="gallery">
                              {media.galleryImages.map((img, idx) => (
                                <img key={idx} src={img} alt={`Mockup ${idx + 1}`} className="gallery-img" />
                              ))}
                            </div>
                          </div>
                        )}
                        {media.sizeChart && (
                          <div className="media-item">
                            <label>Size Chart:</label>
                            <img src={media.sizeChart} alt="Size Chart" className="detail-img" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Variants */}
                    <div className="detail-section">
                      <h4 className="section-heading">Variants & Inventory</h4>
                      <div className="detail-grid">
                        {variants.colors && variants.colors.length > 0 && (
                          <div>
                            <strong>Colors:</strong> {variants.colors.join(', ')}
                          </div>
                        )}
                        {variants.sizes && variants.sizes.length > 0 && (
                          <div>
                            <strong>Sizes:</strong> {variants.sizes.join(', ')}
                          </div>
                        )}
                        {variants.material && <div><strong>Material:</strong> {variants.material}</div>}
                        {variants.fitType && <div><strong>Fit Type:</strong> {variants.fitType}</div>}
                        {variants.inventoryMatrix && Object.keys(variants.inventoryMatrix).length > 0 && (
                          <div className="inventory-matrix-view">
                            <strong>Inventory Matrix:</strong>
                            <table className="matrix-table">
                              <thead>
                                <tr>
                                  <th>Color / Size</th>
                                  {variants.sizes && variants.sizes.map(s => <th key={s}>{s}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {variants.colors && variants.colors.map(c => (
                                  <tr key={c}>
                                    <td><strong>{c}</strong></td>
                                    {variants.sizes && variants.sizes.map(s => (
                                      <td key={c + '-' + s}>
                                        {variants.inventoryMatrix[c]?.[s] || 0}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing & Shipping */}
                    <div className="detail-section">
                      <h4 className="section-heading">Pricing & Shipping</h4>
                      <div className="detail-grid">
                        <div><strong>Base Price:</strong> ₹{pricing.price || '0'}</div>
                        {pricing.discountPercent > 0 && (
                          <>
                            <div><strong>Discount:</strong> {pricing.discountPercent}%</div>
                            <div><strong>Final Price:</strong> ₹{pricing.discountPrice || pricing.price}</div>
                          </>
                        )}
                        {pricing.royaltyPercent && (
                          <div><strong>Royalty:</strong> {pricing.royaltyPercent}%</div>
                        )}
                        <div><strong>Shipping:</strong> {shipping.isFree ? 'Free' : `₹${shipping.flatRate || 0}`}</div>
                        <div><strong>Dispatch Days:</strong> {shipping.dispatchDays || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Designer Info */}
                    <div className="detail-section">
                      <h4 className="section-heading">Designer Information</h4>
                      <div className="detail-grid">
                        <div><strong>Name:</strong> {designer.name || designer.designerName || 'N/A'}</div>
                        <div><strong>ID:</strong> {designer.id || designer._id || 'N/A'}</div>
                        {product.rightsConfirmed && (
                          <div style={{ color: 'var(--kc-success)' }}>
                            <strong>✓ Rights Confirmed:</strong> Designer confirmed ownership
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submission Info */}
                    <div className="detail-section">
                      <h4 className="section-heading">Submission Details</h4>
                      <div className="detail-grid">
                        <div><strong>Submitted:</strong> {new Date(product.createdAt || d.createdAt).toLocaleString()}</div>
                        <div><strong>Status:</strong> {product.status || d.status}</div>
                        {product.adminNotes && (
                          <div><strong>Admin Notes:</strong> {product.adminNotes}</div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {product.status === 'pending' || product.status === 'pending_review' ? (
                      <div className="action-buttons">
                        <button 
                          className="btn-approve"
                          onClick={() => moderate(d._id, 'approve')}
                        >
                          <CheckCircle size={18} />
                          Approve & Publish
                        </button>
                        <button 
                          className="btn-reject"
                          onClick={() => setShowRejectModal(d._id)}
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        {product.status === 'approved' && (
                          <button 
                            className="btn-publish"
                            onClick={() => moderate(d._id, 'publish')}
                          >
                            <Eye size={18} />
                            Publish Now
                          </button>
                        )}
                        <button 
                          className="btn-secondary"
                          onClick={() => moderate(d._id, product.status === 'rejected' ? 'approve' : 'reject')}
                        >
                          {product.status === 'rejected' ? 'Approve' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => { setShowRejectModal(null); setRejectNote(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Reject Product</h3>
            <p>Please provide a reason for rejection (this will be visible to the designer):</p>
            <textarea
              className="reject-textarea"
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="e.g., Design does not meet quality standards, inappropriate content, etc."
              rows={4}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setShowRejectModal(null); setRejectNote(''); }}>
                Cancel
              </button>
              <button className="btn-confirm-reject" onClick={() => handleReject(showRejectModal)}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-designs-page {
          min-height: 100vh;
          background: var(--kc-navy-900);
          padding: 0;
          padding-top: 74px;
          font-family: var(--kc-font-sans);
          position: relative;
        }

        .admin-designs-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .admin-designs-page > * {
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

        .designs-content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px 48px;
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: var(--kc-glass-01);
          border-radius: var(--kc-radius-lg);
          border: 1px solid var(--kc-glass-border);
          box-shadow: var(--kc-shadow-sm);
          backdrop-filter: blur(10px) saturate(110%);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: var(--kc-gap-sm);
        }

        .filter-select {
          padding: 8px 16px;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          font-size: 0.9375rem;
          background: rgba(255, 255, 255, 0.08);
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

        .stats-badge {
          padding: 8px 16px;
          background: var(--kc-grad-gold);
          color: var(--kc-navy-900);
          border-radius: var(--kc-radius);
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: var(--kc-glass-01);
          border-radius: var(--kc-radius-lg);
          border: 1px solid var(--kc-glass-border);
          backdrop-filter: blur(10px) saturate(110%);
        }

        .loading-state p, .empty-state h3 {
          color: var(--kc-cream-100);
          font-family: var(--kc-font-serif);
        }

        .empty-state p {
          color: var(--kc-beige-300);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--kc-glass-border);
          border-top: 4px solid var(--kc-gold-200);
          border-radius: 50%;
          animation: spin var(--kc-duration-lg) linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .products-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .product-card {
          background: var(--kc-glass-01);
          border-radius: var(--kc-radius-lg);
          border: 1px solid var(--kc-glass-border);
          box-shadow: var(--kc-shadow-sm);
          overflow: hidden;
          backdrop-filter: blur(10px) saturate(110%);
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--kc-shadow-md);
          border-color: var(--kc-gold-200);
        }
        .product-header {
          display: grid;
          grid-template-columns: 120px 1fr auto;
          gap: 1.5rem;
          padding: 1.5rem;
          cursor: pointer;
          align-items: start;
        }
        .product-preview {
          position: relative;
        }
        .preview-img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
        }
        .preview-placeholder {
          width: 100%;
          height: 120px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--kc-beige-300);
          border: 1px solid var(--kc-glass-border);
        }
        .product-summary {
          flex: 1;
        }
        .product-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--kc-cream-100);
          margin: 0 0 0.75rem 0;
          font-family: var(--kc-font-serif);
        }

        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--kc-beige-300);
          font-size: 0.875rem;
        }

        .product-description-short {
          color: var(--kc-beige-300);
          font-size: 0.9rem;
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
          padding: 0 1.5rem 1.5rem;
          border-top: 1px solid var(--kc-glass-border);
        }

        .detail-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--kc-glass-border);
        }

        .detail-section:first-child {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: none;
        }

        .section-heading {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--kc-cream-100);
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(211, 167, 95, 0.3);
          font-family: var(--kc-font-serif);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .detail-grid > div {
          color: var(--kc-beige-300);
          line-height: 1.6;
        }
        .media-grid {
          display: grid;
          gap: 1rem;
        }
        .media-item {
          margin-top: 0.5rem;
        }
        .media-item label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--kc-cream-100);
          font-family: var(--kc-font-serif);
        }

        .detail-img {
          max-width: 300px;
          max-height: 300px;
          border-radius: var(--kc-radius);
          border: 1px solid var(--kc-glass-border);
        }

        .gallery {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .gallery-img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: var(--kc-radius);
          border: 1px solid var(--kc-glass-border);
        }
        .inventory-matrix-view {
          grid-column: 1 / -1;
          margin-top: 1rem;
        }
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.5rem;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }
        .matrix-table th, .matrix-table td {
          padding: 8px 12px;
          text-align: center;
          border: 1px solid var(--kc-glass-border);
        }

        .matrix-table th {
          background: rgba(255, 255, 255, 0.08);
          font-weight: 600;
          color: var(--kc-cream-100);
        }

        .matrix-table td {
          color: var(--kc-beige-300);
        }
        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--kc-glass-border);
        }

        .btn-approve, .btn-reject, .btn-publish, .btn-secondary, .btn-cancel, .btn-confirm-reject {
          display: flex;
          align-items: center;
          gap: var(--kc-gap-xs);
          padding: 12px 24px;
          border: none;
          border-radius: var(--kc-radius);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--kc-duration-sm) var(--kc-ease);
        }

        .btn-approve {
          background: var(--kc-grad-gold);
          color: var(--kc-navy-900);
          box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
        }

        .btn-approve:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(211, 167, 95, 0.35);
        }

        .btn-reject {
          background: transparent;
          color: #f5b5b5;
          border: 1px solid rgba(245, 181, 181, 0.5);
        }

        .btn-reject:hover {
          background: rgba(167, 29, 42, 0.2);
          border-color: rgba(245, 181, 181, 0.8);
          transform: translateY(-2px);
        }

        .btn-publish {
          background: var(--kc-grad-gold);
          color: var(--kc-navy-900);
          box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
        }

        .btn-publish:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(211, 167, 95, 0.35);
        }

        .btn-secondary {
          background: var(--kc-glass-01);
          color: var(--kc-cream-100);
          border: 1px solid var(--kc-glass-border);
          backdrop-filter: blur(10px);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
          transform: translateY(-2px);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(8px);
        }

        .modal-content {
          background: var(--kc-glass-01);
          padding: 2rem;
          border-radius: var(--kc-radius-lg);
          max-width: 500px;
          width: 90%;
          box-shadow: var(--kc-shadow-lg);
          border: 1px solid var(--kc-glass-border);
          backdrop-filter: blur(20px) saturate(110%);
        }

        .modal-content h3 {
          margin: 0 0 1rem 0;
          color: var(--kc-cream-100);
          font-family: var(--kc-font-serif);
        }

        .modal-content p {
          color: var(--kc-beige-300);
        }

        .reject-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          font-family: inherit;
          margin: 1rem 0;
          resize: vertical;
          color: var(--kc-cream-100);
          background: rgba(255, 255, 255, 0.08);
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

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-cancel {
          background: var(--kc-glass-01);
          color: var(--kc-cream-100);
          border: 1px solid var(--kc-glass-border);
          backdrop-filter: blur(10px);
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
        }

        .btn-confirm-reject {
          background: rgba(167, 29, 42, 0.3);
          color: #f5b5b5;
          border: 1px solid rgba(245, 181, 181, 0.5);
          backdrop-filter: blur(10px);
        }

        .btn-confirm-reject:hover {
          background: rgba(167, 29, 42, 0.4);
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .admin-designs-page {
            padding: 1rem;
          }
          .product-header {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .filters-bar {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
