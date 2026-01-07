import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { 
  Users, UserCheck, Clock, CheckCircle, XCircle, 
  Eye, Settings, LogOut, TrendingUp, DollarSign,
  ShoppingBag, Star, ArrowRight, Activity
} from "lucide-react";
import AdminNav from "../../components/AdminNav";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedDesigners: 0,
    pendingDesigns: 0
  });
  const [applications, setApplications] = useState([]);
  const [brandProducts, setBrandProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const appRes = await fetch("/api/admin/applications?status=pending&limit=10", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData.applications || []);
        setStats(prev => ({
          ...prev,
          pendingApplications: appData.applications?.length || 0
        }));
      }

      const statsRes = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` }});
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(prev => ({
          ...prev,
          totalApplications: s.applications?.total || 0,
          approvedDesigners: s.users?.designers || 0,
          totalDesigns: s.designs?.total || 0,
          pendingDesigns: s.designs?.pending || 0
        }));
      }

      // Fetch recent pending brand products for quick review
      try {
        const prodRes = await fetch('/api/admin/products?approved=false&limit=6', { headers: { Authorization: `Bearer ${token}` }});
        if (prodRes.ok) {
          const p = await prodRes.json();
          setBrandProducts(p.products || p || []);
        } else {
          setBrandProducts([]);
        }
      } catch {
        setBrandProducts([]);
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (userId, action, notes = "") => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = action === "approve" 
        ? "/api/admin/applications/approve" 
        : "/api/admin/applications/reject";

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, adminNotes: notes })
      });

      if (response.ok) {
        fetchDashboardData();
      } else {
        console.error("Failed to process application");
      }
    } catch (error) {
      console.error("Error processing application:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">LOADING DASHBOARD</p>
        <style>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
            gap: var(--kc-gap-md);
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid var(--kc-glass-border);
            border-top: 3px solid var(--kc-gold-200);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loading-text {
            color: var(--kc-cream-100);
            font-family: var(--kc-font-sans);
            font-size: 0.875rem;
            font-weight: 600;
            letter-spacing: 2px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Hero Header */}
      <div className="hero-header">
        <div className="hero-content">
          <div className="hero-left">
            <div className="welcome-badge">
              <Activity size={16} />
              <span>ADMIN PANEL</span>
            </div>
            <h1 className="hero-title">Dashboard</h1>
            <p className="hero-subtitle">Welcome back, <strong>{user.name}</strong></p>
          </div>
          <div className="hero-actions">
            <button className="icon-btn" onClick={() => navigate("/admin/settings")}>
              <Settings size={20} />
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <AdminNav />

      <div className="dashboard-container">
        {/* Quick Actions */}
        <div className="quick-actions-grid">
          <Link to="/admin/products" className="action-card primary">
            <div className="action-icon">
              <ShoppingBag size={24} />
            </div>
            <div className="action-content">
              <h3>Review Products</h3>
              <p>Manage brand submissions</p>
            </div>
            <ArrowRight size={20} className="action-arrow" />
          </Link>
          
          <Link to="/admin/designs" className="action-card secondary">
            <div className="action-icon">
              <Star size={24} />
            </div>
            <div className="action-content">
              <h3>Review Designs</h3>
              <p>Approve new submissions</p>
            </div>
            <ArrowRight size={20} className="action-arrow" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card urgent">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <Clock size={24} />
              </div>
              <span className="stat-badge">ACTION NEEDED</span>
            </div>
            <h2 className="stat-number">{stats.pendingApplications}</h2>
            <p className="stat-label">Pending Applications</p>
            <div className="stat-footer">
              <span className="stat-trend">Requires immediate review</span>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <UserCheck size={24} />
              </div>
            </div>
            <h2 className="stat-number">{stats.approvedDesigners}</h2>
            <p className="stat-label">Active Designers</p>
            <div className="stat-footer">
              <span className="stat-trend">Approved & verified</span>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <ShoppingBag size={24} />
              </div>
            </div>
            <h2 className="stat-number">{stats.totalDesigns}</h2>
            <p className="stat-label">Total Designs</p>
            <div className="stat-footer">
              <span className="stat-trend">{stats.pendingDesigns} pending review</span>
            </div>
          </div>

          <div className="stat-card revenue">
            <div className="stat-header">
              <div className="stat-icon-wrapper">
                <DollarSign size={24} />
              </div>
            </div>
            <h2 className="stat-number">₹2.5L</h2>
            <p className="stat-label">Revenue This Month</p>
            <div className="stat-footer">
              <TrendingUp size={14} />
              <span className="stat-trend">+12% from last month</span>
            </div>
          </div>
        </div>

        {/* Applications Section */}
        <div className="applications-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Designer Applications</h2>
              <p className="section-subtitle">Review and manage pending applications</p>
            </div>
            <button 
              className="view-all-btn"
              onClick={() => navigate("/admin/applications")}
            >
              VIEW ALL
              <ArrowRight size={18} />
            </button>
          </div>

          {applications.length > 0 ? (
            <div className="applications-grid">
              {applications.slice(0, 5).map((app) => (
                <div key={app._id} className="application-card">
                  <div className="card-header">
                    <div className="applicant-avatar">
                      {app.designerName?.charAt(0) || app.fullName?.charAt(0)}
                    </div>
                    <div className="applicant-info">
                      <h4 className="applicant-name">
                        {app.designerName || `${app.fullName} ${app.lastName}`}
                      </h4>
                      <p className="applicant-email">{app.email}</p>
                      <span className="applicant-location">
                        {app.city}, {app.country}
                      </span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="specialties-row">
                      {app.specialties?.slice(0, 3).map(spec => (
                        <span key={spec} className="specialty-pill">{spec}</span>
                      ))}
                    </div>
                    <div className="meta-row">
                      <span className="meta-item">{app.experience}</span>
                      <span className="meta-divider">•</span>
                      <span className="meta-item">
                        {new Date(app.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => navigate(`/admin/applications/${app._id}`)}
                    >
                      <Eye size={16} />
                      REVIEW
                    </button>
                    <button 
                      className="action-btn approve-btn"
                      onClick={() => handleApplicationAction(app.userId, "approve")}
                    >
                      <CheckCircle size={16} />
                      APPROVE
                    </button>
                    <button 
                      className="action-btn reject-btn"
                      onClick={() => handleApplicationAction(app.userId, "reject")}
                    >
                      <XCircle size={16} />
                      REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Users size={56} />
              </div>
              <h3 className="empty-title">All Caught Up!</h3>
              <p className="empty-text">
                No pending applications at the moment. Great work keeping up with reviews.
              </p>
            </div>
          )}
        </div>

        {/* Brand Products Section */}
        <div className="applications-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Brand Products</h2>
              <p className="section-subtitle">Latest pending products from brands</p>
            </div>
            <button 
              className="view-all-btn"
              onClick={() => navigate("/admin/products")}
            >
              VIEW ALL
              <ArrowRight size={18} />
            </button>
          </div>

          {brandProducts && brandProducts.length > 0 ? (
            <div className="applications-grid">
              {brandProducts.slice(0, 6).map((prod) => (
                <div key={prod._id} className="application-card">
                  <div className="card-header">
                    <div className="product-thumb">
                      {prod.media?.mainImage ? (
                        <img src={prod.media.mainImage} alt={prod.title} />
                      ) : (
                        <div className="thumb-placeholder">IMG</div>
                      )}
                    </div>
                    <div className="applicant-info">
                      <h4 className="applicant-name">{prod.title || 'Untitled Product'}</h4>
                      <p className="applicant-email" style={{ color: 'var(--kc-gold-300)' }}>{prod.category}</p>
                      <span className="applicant-location">₹{prod.pricing?.price || 0}{prod.pricing?.discountPrice ? ` → ₹${prod.pricing.discountPrice}`: ''}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="specialties-row">
                      {(prod.variants?.colors || []).slice(0, 4).map((c) => (
                        <span key={c} className="specialty-pill">{c}</span>
                      ))}
                    </div>
                    <div className="meta-row">
                      <span className="meta-item">{(prod.variants?.sizes || []).join(', ') || 'One size'}</span>
                      <span className="meta-divider">•</span>
                      <span className="meta-item">{new Date(prod.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => navigate('/admin/products')}
                    >
                      <Eye size={16} /> REVIEW
                    </button>
                    <button 
                      className="action-btn approve-btn"
                      onClick={() => navigate('/admin/products')}
                    >
                      <CheckCircle size={16} /> APPROVE
                    </button>
                    <button 
                      className="action-btn reject-btn"
                      onClick={() => navigate('/admin/products')}
                    >
                      <XCircle size={16} /> REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: 16 }}>
              <div className="empty-icon"><ShoppingBag size={56} /></div>
              <h3 className="empty-title">No pending brand products</h3>
              <p className="empty-text">Great! All brand submissions are up to date.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        /* Disable ALL transitions and animations for admin dashboard */
        .admin-dashboard *,
        .admin-dashboard *::before,
        .admin-dashboard *::after {
          transition: none !important;
          animation: none !important;
        }

        .admin-dashboard {
          min-height: 100vh;
          background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
          position: relative;
          font-family: var(--kc-font-sans);
          padding-top: 74px;
        }

        .admin-dashboard::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: var(--kc-noise);
          opacity: 0.02;
          pointer-events: none;
          z-index: 0;
        }

        /* Hero Header */
        .hero-header {
          position: relative;
          background: var(--kc-navy-900);
          padding: 48px 40px;
          border-bottom: 2px solid var(--kc-gold-200);
          overflow: hidden;
          margin-bottom: var(--kc-gap-xl);
          box-shadow: var(--kc-shadow-md);
          backdrop-filter: blur(10px) saturate(110%);
        }
        .hero-header::after {
          content: '';
          position: absolute;
          inset: -40% -10% auto auto;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(closest-side, rgba(211,167,95,0.08), transparent 60%);
          filter: blur(60px);
          pointer-events: none;
        }

        .hero-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .welcome-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--kc-gap-xs);
          padding: 6px 16px;
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          color: var(--kc-gold-200);
          font-family: var(--kc-font-sans);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 1.5px;
          margin-bottom: 16px;
          backdrop-filter: blur(10px);
        }

        .hero-title {
          font-family: var(--kc-font-serif);
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 700;
          color: var(--kc-cream-100);
          margin: 0 0 8px 0;
          line-height: 1.1;
          letter-spacing: 0.5px;
        }

        .hero-subtitle {
          color: rgba(248, 244, 238, 0.8);
          font-size: 1.125rem;
          margin: 0;
          font-weight: 400;
        }

        .hero-subtitle strong {
          color: var(--kc-gold-200);
          font-weight: 600;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-btn {
          width: 48px;
          height: 48px;
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--kc-cream-100);
          cursor: pointer;
          backdrop-filter: blur(10px);
        }

        .icon-btn:active {
          opacity: 0.9;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: var(--kc-gap-xs);
          padding: 12px 24px;
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          color: var(--kc-cream-100);
          font-family: var(--kc-font-sans);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          backdrop-filter: blur(10px);
        }

        .logout-btn:active {
          opacity: 0.9;
        }

        /* Main Container */
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 48px 40px 80px;
          position: relative;
          z-index: 1;
        }

        /* Quick Actions */
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--kc-gap-md);
          margin-bottom: var(--kc-gap-xl);
          position: relative;
          z-index: 1;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: var(--kc-gap-lg);
          background: var(--kc-cream-100);
          border-radius: var(--kc-radius-lg);
          text-decoration: none;
          border: 1px solid var(--kc-glass-border);
          position: relative;
          overflow: hidden;
          box-shadow: var(--kc-shadow-sm);
        }

        .action-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--kc-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--kc-navy-700);
          color: var(--kc-gold-200);
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .action-content {
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .action-content h3 {
          font-family: var(--kc-font-serif);
          font-size: 1.375rem;
          font-weight: 600;
          color: var(--kc-ink);
          margin: 0 0 4px 0;
          letter-spacing: 0.5px;
        }

        .action-content p {
          color: var(--kc-gray-500);
          font-size: 0.875rem;
          margin: 0;
        }

        .action-arrow {
          color: var(--kc-gold-200);
          position: relative;
          z-index: 1;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--kc-gap-md);
          margin-bottom: var(--kc-gap-xl);
          position: relative;
          z-index: 1;
        }

        .stat-card {
          background: var(--kc-glass-01);
          padding: var(--kc-gap-lg);
          border-radius: var(--kc-radius-lg);
          border: 1px solid var(--kc-glass-border);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px) saturate(130%);
          box-shadow: var(--kc-shadow-sm);
        }

        .stat-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--kc-grad-gold);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .stat-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: var(--kc-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--kc-grad-gold);
          color: var(--kc-navy-700);
          box-shadow: 0 4px 12px rgba(211, 167, 95, 0.25);
        }


        .stat-badge {
          padding: 4px 12px;
          background: var(--kc-glass-strong);
          border: 1px solid var(--kc-gold-200);
          border-radius: var(--kc-radius);
          color: var(--kc-gold-200);
          font-family: var(--kc-font-sans);
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 1px;
          backdrop-filter: blur(10px);
        }

        .stat-number {
          font-family: var(--kc-font-serif);
          font-size: 3rem;
          font-weight: 700;
          color: var(--kc-cream-100);
          margin: 0 0 8px 0;
          line-height: 1;
        }

        .stat-label {
          color: rgba(248, 244, 238, 0.7);
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--kc-gold-100);
          font-size: 0.8rem;
          font-weight: 500;
        }

        /* Applications Section */
        .applications-section {
          background: var(--kc-cream-100);
          padding: var(--kc-spacing-xl);
          border-radius: var(--kc-radius-lg);
          border: 1px solid var(--kc-glass-border);
          box-shadow: var(--kc-shadow-sm);
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid var(--kc-gold-200);
        }

        .section-title {
          font-family: var(--kc-font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--kc-navy-700);
          margin: 0 0 4px 0;
          letter-spacing: 0.5px;
        }

        .section-subtitle {
          color: var(--kc-gray-500);
          font-size: 0.875rem;
          margin: 0;
        }

        .view-all-btn {
          display: flex;
          align-items: center;
          gap: var(--kc-gap-xs);
          padding: 12px 28px;
          background: var(--kc-grad-gold);
          color: var(--kc-navy-700);
          border: none;
          border-radius: var(--kc-radius);
          font-family: var(--kc-font-sans);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          box-shadow: var(--kc-shadow-sm);
        }

        .view-all-btn:active {
          opacity: 0.9;
        }

        /* Applications Grid */
        .applications-grid {
          display: grid;
          gap: 20px;
        }

        .application-card {
          background: var(--kc-cream-100);
          padding: 28px;
          border-radius: var(--kc-radius-lg);
          border: 1px solid var(--kc-glass-border);
          box-shadow: var(--kc-shadow-sm);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .applicant-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--kc-grad-gold);
          color: var(--kc-navy-700);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          font-weight: 700;
          flex-shrink: 0;
          border: 3px solid var(--kc-cream-100);
          box-shadow: var(--kc-shadow-sm);
        }

        .product-thumb {
          width: 64px;
          height: 64px;
          border-radius: var(--kc-radius);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
        }

        .product-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--kc-gray-500);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .applicant-info {
          flex: 1;
        }

        .applicant-name {
          font-family: var(--kc-font-serif);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--kc-ink);
          margin: 0 0 4px 0;
          letter-spacing: 0.3px;
        }

        .applicant-email {
          color: var(--kc-gray-500);
          font-size: 0.875rem;
          margin: 0 0 4px 0;
        }

        .applicant-location {
          display: inline-block;
          padding: 2px 10px;
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          color: var(--kc-gold-300);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .card-body {
          margin-bottom: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--kc-glass-border);
        }

        .specialties-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--kc-gap-xs);
          margin-bottom: 12px;
        }

        .specialty-pill {
          padding: 6px 14px;
          background: var(--kc-cream-100);
          border: 1px solid var(--kc-gold-200);
          border-radius: var(--kc-radius-full);
          color: var(--kc-ink);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--kc-gray-500);
          font-size: 0.875rem;
        }

        .meta-divider {
          color: var(--kc-gold-200);
        }

        .card-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--kc-gap-xs);
          padding: 12px 16px;
          border-radius: var(--kc-radius);
          border: none;
          font-family: var(--kc-font-sans);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
        }

        .view-btn {
          background: var(--kc-cream-100);
          color: var(--kc-gray-500);
          border: 1px solid var(--kc-glass-border);
        }

        .view-btn:active {
          opacity: 0.9;
        }

        .approve-btn {
          background: var(--kc-grad-gold);
          color: var(--kc-navy-700);
        }

        .approve-btn:active {
          opacity: 0.9;
        }

        .reject-btn {
          background: transparent;
          color: var(--kc-danger);
          border: 1px solid var(--kc-danger);
        }

        .reject-btn:active {
          opacity: 0.9;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 80px 40px;
          background: linear-gradient(135deg, var(--kc-beige-300) 0%, var(--kc-cream-100) 100%);
          border-radius: var(--kc-radius-lg);
          margin-top: 16px;
        }

        .empty-icon {
          display: inline-flex;
          width: 96px;
          height: 96px;
          align-items: center;
          justify-content: center;
          background: var(--kc-glass-01);
          border: 1px solid var(--kc-glass-border);
          border-radius: 50%;
          color: var(--kc-gold-200);
          margin-bottom: 24px;
          backdrop-filter: blur(10px);
        }

        .empty-title {
          font-family: var(--kc-font-serif);
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--kc-navy-700);
          margin: 0 0 12px 0;
          letter-spacing: 0.5px;
        }

        .empty-text {
          color: var(--kc-gray-500);
          font-size: 1rem;
          margin: 0;
          max-width: 400px;
          margin: 0 auto;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .dashboard-container {
            padding: 24px;
          }

          .hero-header {
            padding: 32px 24px;
          }

          .applications-section {
            padding: 24px;
          }
        }

        @media (max-width: 768px) {
          .hero-content {
            flex-direction: column;
            gap: var(--kc-gap-md);
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-actions {
            width: 100%;
            justify-content: space-between;
          }

          .quick-actions-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .view-all-btn {
            width: 100%;
          }

          .card-actions {
            grid-template-columns: 1fr;
          }

          .dashboard-container {
            padding: 16px;
          }

          .applications-section {
            padding: 20px;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 2rem;
          }

          .stat-number {
            font-size: 2.5rem;
          }

          .action-card {
            padding: 24px;
          }

          .stat-card {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;