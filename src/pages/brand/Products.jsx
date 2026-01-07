import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { Link } from 'react-router-dom';
import { Plus, Package, CheckCircle, Clock, AlertCircle, Eye, Edit } from 'lucide-react';
import { normalizeImageUrl } from '../../lib/imageUtils.js';

export default function BrandProducts(){
const { token } = useAuth();
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [err, setErr] = useState('');

const load = async () => {
  try {
    setLoading(true);
    const data = await api('/api/brand/products', { token });
    setItems(data.products || data);
  } catch (e) { setErr(e.message); } finally { setLoading(false); }
};

useEffect(()=>{ load(); }, [token]);

return (
  <div className="brand-products-container">
    <div className="products-content">
      {/* Header Section */}
      <div className="products-header">
        <div className="header-main">
          <div className="header-text">
            <h2 className="products-title">My Products</h2>
            <p className="products-subtitle">Manage your product listings and inventory</p>
          </div>
          <Link to="/brand/products/new" className="add-product-btn">
            <Plus size={20} />
            Add New Product
          </Link>
        </div>

        {/* Error Message */}
        {err && (
          <div className="error-message">
            <AlertCircle size={16} />
            <p>{err}</p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your products...</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && items.length > 0 && (
        <div className="products-grid">
          {items.map(p => (
            <div key={p._id} className="product-card">
              {/* Product Image */}
              <div className="product-image-container">
                {p.images && p.images[0] ? (
                  <img 
                    src={normalizeImageUrl(p.images[0])} 
                    alt={p.title}
                    className="product-image"
                    onError={(e) => {
                      // If image fails to load, try with normalized path
                      const img = e.target;
                      const normalized = normalizeImageUrl(p.images[0]);
                      if (img.src !== normalized && normalized) {
                        img.src = normalized;
                      }
                    }}
                  />
                ) : (
                  <div className="product-placeholder">
                    <Package size={48} />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="status-badge">
                  {p.isApproved ? (
                    <span className="badge approved">
                      <CheckCircle size={12} />
                      Approved
                    </span>
                  ) : (
                    <span className="badge pending">
                      <Clock size={12} />
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="product-details">
                <h3 className="product-title">{p.title}</h3>
                
                <div className="price-stock">
                  <div className="product-price">₹{p.price?.toLocaleString()}</div>
                  <div className="product-stock">Stock: {p.stock || 0}</div>
                </div>

                {/* Category Tag */}
                {p.category && (
                  <div className="category-container">
                    <span className="category-tag">
                      {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {p.tags && p.tags.length > 0 && (
                  <div className="tags-container">
                    {p.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="tag">#{tag}</span>
                    ))}
                    {p.tags.length > 3 && (
                      <span className="tag">+{p.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button className="view-btn">
                    <Eye size={16} />
                    View
                  </button>
                  <button className="edit-btn">
                    <Edit size={16} />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && !err && (
        <div className="empty-state">
          <div className="empty-card">
            <Package size={64} className="empty-icon" />
            <h3 className="empty-title">No Products Yet</h3>
            <p className="empty-text">Start building your product catalog by adding your first item.</p>
            <Link to="/brand/products/new" className="empty-action-btn">
              <Plus size={20} />
              Add Your First Product
            </Link>
          </div>
        </div>
      )}
    </div>

    <style>{`
      .brand-products-container {
        min-height: 100vh;
        background: var(--kc-navy-900);
        padding: 2rem 1rem;
        padding-top: 90px;
        font-family: var(--kc-font-sans);
        position: relative;
      }

      .brand-products-container::before {
        content: '';
        position: fixed;
        inset: 0;
        background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
        opacity: 0.4;
        pointer-events: none;
        z-index: 0;
      }

      .brand-products-container > * {
        position: relative;
        z-index: 1;
      }

      .products-content {
        max-width: 1200px;
        margin: 0 auto;
      }

      .products-header {
        margin-bottom: 2rem;
      }

      .header-main {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .products-title {
        font-family: var(--kc-font-serif);
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--kc-cream-100);
        margin: 0 0 0.5rem 0;
        line-height: 1.2;
        letter-spacing: var(--kc-letterspacing-heading);
      }

      .products-subtitle {
        color: var(--kc-beige-300);
        font-size: 1.125rem;
        margin: 0;
      }

      .add-product-btn, .empty-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: var(--kc-grad-gold);
        color: var(--kc-navy-900);
        text-decoration: none;
        border: none;
        border-radius: var(--kc-radius);
        font-weight: 600;
        font-family: var(--kc-font-sans);
        cursor: pointer;
        transition: all var(--kc-duration-sm) var(--kc-ease);
        box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
      }

      .add-product-btn:hover, .empty-action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(211, 167, 95, 0.35);
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(167, 29, 42, 0.2);
        border: 1px solid rgba(245, 181, 181, 0.4);
        border-radius: var(--kc-radius);
        padding: 1rem;
        margin-bottom: 1.5rem;
        backdrop-filter: blur(10px);
      }

      .error-message p {
          color: rgba(239, 154, 154, 1);
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 0;
      }

      .loading-spinner {
        width: 2.5rem;
        height: 2.5rem;
        border: 4px solid var(--kc-glass-border);
        border-top: 4px solid var(--kc-gold-200);
        border-radius: 50%;
        animation: spin var(--kc-duration-lg) linear infinite;
        margin-bottom: 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-container p {
        color: var(--kc-beige-300);
        font-size: 1.125rem;
        margin: 0;
        font-weight: 600;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
      }

      .product-card {
        background: var(--kc-glass-01);
        border-radius: var(--kc-radius-lg);
        box-shadow: var(--kc-shadow-sm);
        transition: all var(--kc-duration-sm) var(--kc-ease);
        overflow: hidden;
        border: 1px solid var(--kc-glass-border);
        backdrop-filter: blur(10px) saturate(110%);
      }

      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--kc-shadow-md);
        border-color: var(--kc-gold-200);
        background: rgba(255, 255, 255, 0.1);
      }

      .product-image-container {
        position: relative;
        height: 12rem;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.08);
      }

      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .product-placeholder {
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--kc-beige-300);
        border: 1px solid var(--kc-glass-border);
      }

      .status-badge {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border-radius: var(--kc-radius-full);
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
        backdrop-filter: blur(10px);
      }

      .badge.approved {
        background: rgba(30, 126, 52, 0.8);
        border: 1px solid rgba(161, 224, 181, 0.5);
      }

      .badge.pending {
        background: rgba(211, 167, 95, 0.8);
        border: 1px solid rgba(243, 209, 166, 0.5);
      }

      .product-details {
        padding: 1.5rem;
      }

      .product-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--kc-cream-100);
        margin: 0 0 0.5rem 0;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-family: var(--kc-font-serif);
      }

      .price-stock {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .product-price {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--kc-gold-200);
      }

      .product-stock {
        font-size: 0.875rem;
        color: var(--kc-beige-300);
      }

      .category-container {
        margin-bottom: 1rem;
      }

      .category-tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: rgba(211, 167, 95, 0.15);
        color: var(--kc-gold-200);
        border: 1px solid rgba(211, 167, 95, 0.3);
        border-radius: var(--kc-radius-full);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-bottom: 1rem;
      }

      .tag {
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.08);
        color: var(--kc-beige-300);
        border: 1px solid var(--kc-glass-border);
        border-radius: var(--kc-radius);
        font-size: 0.75rem;
        backdrop-filter: blur(10px);
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
      }

      .view-btn, .edit-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid;
        border-radius: var(--kc-radius);
        cursor: pointer;
        font-weight: 500;
        font-size: 0.875rem;
        transition: all var(--kc-duration-sm) var(--kc-ease);
        backdrop-filter: blur(10px);
      }

      .view-btn {
        background: var(--kc-glass-01);
        color: var(--kc-cream-100);
        border-color: var(--kc-glass-border);
      }

      .view-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: var(--kc-gold-200);
        transform: translateY(-2px);
      }

      .edit-btn {
        background: var(--kc-grad-gold);
        color: var(--kc-navy-900);
        border-color: transparent;
        box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
      }

      .edit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(211, 167, 95, 0.35);
      }

      .empty-state {
        display: flex;
        justify-content: center;
        padding: 4rem 0;
      }

      .empty-card {
        background: var(--kc-glass-01);
        border-radius: var(--kc-radius-lg);
        box-shadow: var(--kc-shadow-sm);
        padding: 3rem;
        max-width: 28rem;
        text-align: center;
        border: 1px solid var(--kc-glass-border);
        backdrop-filter: blur(10px) saturate(110%);
      }

      .empty-icon {
        color: var(--kc-gold-200);
        margin: 0 auto 1.5rem;
      }

      .empty-title {
        font-family: var(--kc-font-serif);
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--kc-cream-100);
        margin: 0 0 1rem 0;
      }

      .empty-text {
        color: var(--kc-beige-300);
        font-size: 1rem;
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
      }

      /* Responsive Design */
      @media (min-width: 768px) {
        .header-main {
          flex-direction: row;
          align-items: center;
        }

        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }
      }

      @media (max-width: 768px) {
        .brand-products-container {
          padding: 1rem;
        }

        .products-title {
          font-size: 2rem;
        }

        .products-subtitle {
          font-size: 1rem;
        }

        .products-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 480px) {
        .products-title {
          font-size: 1.75rem;
        }

        .product-details {
          padding: 1rem;
        }

        .action-buttons {
          flex-direction: column;
        }

        .view-btn, .edit-btn {
          flex: none;
        }
      }
    `}</style>
  </div>
);
}