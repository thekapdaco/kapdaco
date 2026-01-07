import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { Link, useNavigate } from 'react-router-dom';
import { Package, CheckCircle, Clock, Plus, Settings, TrendingUp, Eye } from 'lucide-react';

export default function BrandDashboard(){
const { user, token } = useAuth();
const nav = useNavigate();
const [stats, setStats] = useState({ total:0, approved:0, pending:0 });
const [loading, setLoading] = useState(true);

useEffect(()=>{ if (!user) nav('/brand/login'); if (user && user.role !== 'brand') nav('/'); }, [user]);

useEffect(()=>{
  const load = async () => {
    try {
      setLoading(true);
      // Fetch brand products once and compute counts locally to avoid admin-only endpoints
      const res = await api('/api/brand/products', { token });
      // Normalize potential response shapes
      const productsCandidate = res?.products ?? res?.items ?? res?.data ?? res;
      const list = Array.isArray(productsCandidate) ? productsCandidate : [];
      const total = Number.isFinite(res?.pagination?.total) ? res.pagination.total : list.length;
      const approvedCount = list.filter(p => p?.isApproved === true).length;
      const pendingCount = Math.max(0, list.length - approvedCount);
      setStats({ total, approved: approvedCount, pending: pendingCount });
    } catch {} finally {
      setLoading(false);
    }
  };
  if (token && user) load();
}, [token, user]);

if (loading) {
  return (
    <div className="brand-loading">
      <div className="loading-spinner"></div>
      <p>Loading your dashboard...</p>
      <style>{`
        .brand-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--kc-navy-900);
          gap: var(--kc-spacing-lg);
          position: relative;
        }

        .brand-loading::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .brand-loading > * {
          position: relative;
          z-index: 1;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--kc-glass-border);
          border-top: 4px solid var(--kc-gold-200);
          border-radius: 50%;
          animation: spin var(--kc-duration-lg) linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .brand-loading p {
          color: var(--kc-beige-300);
          font-family: var(--kc-font-sans);
          font-size: 1.1rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

return (
  <div className="brand-dashboard">
    {/* Header */}
    <div className="dashboard-header">
      <div className="header-content">
        <div className="brand-info">
          <h1 className="dashboard-title">Brand Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user?.name}</p>
        </div>
        <div className="header-actions">
          <Link to="/brand/profile" className="action-btn settings">
            <Settings size={20} />
          </Link>
        </div>
      </div>
    </div>

    {/* Stats Cards */}
    <div className="stats-container">
      <div className="stat-card total">
        <div className="stat-icon">
          <Package size={32} />
        </div>
        <div className="stat-content">
          <h3 className="stat-number">{stats.total}</h3>
          <p className="stat-label">Total Products</p>
          <span className="stat-desc">In your catalog</span>
        </div>
      </div>

      <div className="stat-card approved">
        <div className="stat-icon">
          <CheckCircle size={32} />
        </div>
        <div className="stat-content">
          <h3 className="stat-number">{stats.approved}</h3>
          <p className="stat-label">Approved</p>
          <span className="stat-desc">Live on store</span>
        </div>
      </div>

      <div className="stat-card pending">
        <div className="stat-icon">
          <Clock size={32} />
        </div>
        <div className="stat-content">
          <h3 className="stat-number">{stats.pending}</h3>
          <p className="stat-label">Pending</p>
          <span className="stat-desc">Under review</span>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="actions-section">
      <h2 className="section-title">Quick Actions</h2>
      <div className="action-cards">
        <Link to="/brand/products/new" className="action-card primary">
          <div className="action-icon">
            <Plus size={24} />
          </div>
          <div className="action-content">
            <h3>Add New Product</h3>
            <p>Create a new product listing</p>
          </div>
        </Link>

        <Link to="/brand/products" className="action-card secondary">
          <div className="action-icon">
            <Eye size={24} />
          </div>
          <div className="action-content">
            <h3>Manage Products</h3>
            <p>View and edit your products</p>
          </div>
        </Link>
      </div>
    </div>

    <style>{`
      .brand-dashboard {
        min-height: 100vh;
        background: var(--kc-navy-900);
        font-family: var(--kc-font-sans);
        position: relative;
        padding-top: 74px;
      }

      .brand-dashboard::before {
        content: '';
        position: fixed;
        inset: 0;
        background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
        opacity: 0.4;
        pointer-events: none;
        z-index: 0;
      }

      .brand-dashboard > * {
        position: relative;
        z-index: 1;
      }

      .dashboard-header {
        background: var(--kc-navy-900);
        padding: var(--kc-gap-lg) var(--kc-spacing-xl);
        border-bottom: 1px solid var(--kc-glass-border);
        backdrop-filter: blur(10px);
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .dashboard-title {
        font-family: var(--kc-font-serif);
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--kc-cream-100);
        margin: 0 0 4px 0;
        line-height: 1.2;
        letter-spacing: var(--kc-letterspacing-heading);
      }

      .dashboard-subtitle {
        color: var(--kc-beige-300);
        font-size: 1.1rem;
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: var(--kc-gap-sm);
      }

      .action-btn {
        padding: 12px;
        background: var(--kc-glass-01);
        border: 1px solid var(--kc-glass-border);
        border-radius: var(--kc-radius);
        cursor: pointer;
        color: var(--kc-cream-100);
        text-decoration: none;
        transition: all var(--kc-duration-sm) var(--kc-ease);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
      }

      .action-btn:hover {
        background: var(--kc-grad-gold);
        color: var(--kc-navy-900);
        border-color: transparent;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(211, 167, 95, 0.3);
      }

      .stats-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--kc-spacing-xl) var(--kc-spacing-xl) var(--kc-spacing-lg);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--kc-gap-md);
      }

      .stat-card {
        background: var(--kc-glass-01);
        padding: var(--kc-gap-lg);
        border-radius: var(--kc-radius-lg);
        box-shadow: var(--kc-shadow-sm);
        display: flex;
        align-items: center;
        gap: 20px;
        transition: all var(--kc-duration-sm) var(--kc-ease);
        border: 1px solid var(--kc-glass-border);
        backdrop-filter: blur(10px) saturate(110%);
        position: relative;
        overflow: hidden;
      }

      .stat-card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        transition: width var(--kc-duration-sm) var(--kc-ease);
      }

      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--kc-shadow-md);
        border-color: var(--kc-gold-200);
        background: rgba(255, 255, 255, 0.1);
      }

      .stat-card.total::before {
        background: var(--kc-grad-gold);
      }

      .stat-card.approved::before {
        background: linear-gradient(180deg, rgba(129, 199, 132, 1) 0%, var(--kc-success) 100%);
      }

      .stat-card.pending::before {
        background: linear-gradient(180deg, rgba(255, 183, 77, 0.9) 0%, rgba(255, 183, 77, 1) 100%);
      }

      .stat-card:hover::before {
        width: 6px;
      }

      .stat-icon {
        width: 70px;
        height: 70px;
        border-radius: var(--kc-radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      }

      .stat-card.total .stat-icon {
        background: var(--kc-grad-gold);
      }

      .stat-card.approved .stat-icon {
        background: linear-gradient(135deg, rgba(129, 199, 132, 1) 0%, var(--kc-success) 100%);
      }

      .stat-card.pending .stat-icon {
        background: linear-gradient(135deg, rgba(255, 183, 77, 0.9) 0%, rgba(255, 183, 77, 1) 100%);
      }

      .stat-number {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--kc-cream-100);
        margin: 0 0 4px 0;
        line-height: 1;
        font-family: var(--kc-font-serif);
      }

      .stat-label {
        font-size: 1.1rem;
        color: var(--kc-cream-100);
        font-weight: 600;
        margin: 0 0 4px 0;
      }

      .stat-desc {
        font-size: 0.9rem;
        color: var(--kc-beige-300);
      }

      .actions-section {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px 40px 40px;
      }

      .section-title {
        font-family: var(--kc-font-serif);
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--kc-cream-100);
        margin: 0 0 24px 0;
        letter-spacing: var(--kc-letterspacing-heading);
      }

      .action-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }

      .action-card {
        background: var(--kc-glass-01);
        padding: var(--kc-gap-lg);
        border-radius: var(--kc-radius-lg);
        box-shadow: var(--kc-shadow-sm);
        display: flex;
        align-items: center;
        gap: 20px;
        text-decoration: none;
        transition: all var(--kc-duration-sm) var(--kc-ease);
        border: 1px solid var(--kc-glass-border);
        backdrop-filter: blur(10px) saturate(110%);
        position: relative;
        overflow: hidden;
      }

      .action-card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        transition: width var(--kc-duration-sm) var(--kc-ease);
      }

      .action-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--kc-shadow-md);
        border-color: var(--kc-gold-200);
        background: rgba(255, 255, 255, 0.1);
      }

      .action-card.primary::before {
        background: var(--kc-grad-gold);
      }

      .action-card.secondary::before {
        background: linear-gradient(180deg, var(--kc-gold-200) 0%, var(--kc-beige-500) 100%);
      }

      .action-card:hover::before {
        width: 6px;
      }

      .action-icon {
        width: 60px;
        height: 60px;
        border-radius: var(--kc-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      }

      .action-card.primary .action-icon {
        background: var(--kc-grad-gold);
      }

      .action-card.secondary .action-icon {
        background: linear-gradient(135deg, var(--kc-gold-200) 0%, var(--kc-beige-500) 100%);
      }

      .action-content h3 {
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--kc-cream-100);
        margin: 0 0 4px 0;
        font-family: var(--kc-font-serif);
      }

      .action-content p {
        color: var(--kc-beige-300);
        margin: 0;
        font-size: 0.95rem;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .dashboard-header {
          padding: 20px;
        }

        .header-content {
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }

        .header-actions {
          justify-content: center;
        }

        .dashboard-title {
          font-size: 2rem;
        }

        .stats-container, .actions-section {
          padding: 20px;
        }

        .stat-card, .action-card {
          padding: 24px;
        }

        .stat-icon, .action-icon {
          width: 50px;
          height: 50px;
        }

        .stat-number {
          font-size: 2rem;
        }

        .action-cards {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 480px) {
        .dashboard-header {
          padding: 16px;
        }

        .dashboard-title {
          font-size: 1.75rem;
        }

        .stats-container, .actions-section {
          padding: 16px;
        }

        .stat-card, .action-card {
          padding: 20px;
          gap: 16px;
        }

        .stat-card {
          flex-direction: column;
          text-align: center;
        }
      }
    `}</style>
  </div>
);
}