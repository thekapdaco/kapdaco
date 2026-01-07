// components/customer/CustomerDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  ShoppingBag, Heart, User, Package, 
  Star, Settings, LogOut, CreditCard,
  MapPin, Phone, Mail, Calendar
} from "lucide-react";

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not a customer or not logged in
  useEffect(() => {
    if (!user) {
      navigate("/customer/login");
    } else if (user.role === "designer") {
      navigate("/designer/dashboard");
    } else if (user.role === "admin") {
      navigate("/admin/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === "customer") {
      fetchCustomerData();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    try {
      // Mock data for now - you'd fetch from your API
      setOrders([
        {
          id: "ORD-001",
          date: "2024-01-15",
          status: "delivered",
          total: 1299,
          items: 2,
          trackingNumber: "TRK123456"
        },
        {
          id: "ORD-002", 
          date: "2024-01-20",
          status: "shipped",
          total: 899,
          items: 1,
          trackingNumber: "TRK789012"
        }
      ]);

      setWishlist([
        {
          id: "WISH-001",
          name: "Minimalist Typography Tee",
          price: 799,
          image: "/api/placeholder/200/200",
          designer: "Priya Designs"
        }
      ]);
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/customer/login");
  };

  if (!user || user.role !== "customer") {
    return null;
  }

  if (loading) {
    return (
      <div className="customer-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#28a745';
      case 'shipped': return '#007bff';
      case 'processing': return '#ffc107';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="customer-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Welcome back, {user.name}!</h1>
            <p>Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div className="header-actions">
            <Link to="/customer/profile" className="profile-btn">
              <User size={20} />
              Profile
            </Link>
            <button className="settings-btn" onClick={() => navigate("/customer/settings")}>
              <Settings size={20} />
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon orders">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-content">
              <h3>{orders.length}</h3>
              <p>Total Orders</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon wishlist">
              <Heart size={24} />
            </div>
            <div className="stat-content">
              <h3>{wishlist.length}</h3>
              <p>Wishlist Items</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon spending">
              <CreditCard size={24} />
            </div>
            <div className="stat-content">
              <h3>₹{orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}</h3>
              <p>Total Spent</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon reviews">
              <Star size={24} />
            </div>
            <div className="stat-content">
              <h3>0</h3>
              <p>Reviews Given</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/shop" className="action-card">
              <ShoppingBag size={32} />
              <h3>Continue Shopping</h3>
              <p>Discover new designs from our talented artists</p>
            </Link>

            <Link to="/customer/wishlist" className="action-card">
              <Heart size={32} />
              <h3>My Wishlist</h3>
              <p>View and manage your saved items</p>
            </Link>

            <Link to="/customer/orders" className="action-card">
              <Package size={32} />
              <h3>Track Orders</h3>
              <p>Check status and tracking information</p>
            </Link>

            <Link to="/designers" className="action-card">
              <User size={32} />
              <h3>Browse Designers</h3>
              <p>Explore profiles of our creative community</p>
            </Link>
          </div>
        </div>

        <div className="dashboard-sections">
          {/* Recent Orders */}
          <div className="recent-orders">
            <div className="section-header">
              <h2>Recent Orders</h2>
              <Link to="/customer/orders" className="view-all">
                View All Orders
              </Link>
            </div>

            {orders.length > 0 ? (
              <div className="orders-list">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-info">
                      <div className="order-header">
                        <h4>Order #{order.id}</h4>
                        <span 
                          className="order-status"
                          style={{ color: getStatusColor(order.status) }}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="order-date">
                        <Calendar size={14} />
                        Placed on {new Date(order.date).toLocaleDateString()}
                      </p>
                      <p className="order-items">{order.items} item(s)</p>
                    </div>
                    <div className="order-actions">
                      <span className="order-total">₹{order.total.toLocaleString()}</span>
                      <Link to={`/customer/orders/${order.id}`} className="view-order-btn">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <ShoppingBag size={48} />
                <h3>No orders yet</h3>
                <p>Start shopping to see your orders here!</p>
                <Link to="/shop" className="shop-btn">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>

          {/* Wishlist Preview */}
          <div className="wishlist-preview">
            <div className="section-header">
              <h2>Wishlist</h2>
              <Link to="/customer/wishlist" className="view-all">
                View All Items
              </Link>
            </div>

            {wishlist.length > 0 ? (
              <div className="wishlist-grid">
                {wishlist.slice(0, 4).map((item) => (
                  <div key={item.id} className="wishlist-item">
                    <div className="item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p className="designer">by {item.designer}</p>
                      <span className="price">₹{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-wishlist">
                <Heart size={32} />
                <p>Your wishlist is empty</p>
                <p>Add items you love while browsing!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .customer-dashboard {
          min-height: 100vh;
          background: #FAF6EF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .customer-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e9ecef;
          border-top: 4px solid var(--kc-gold);
          border-radius: 50%;
          animation: spin var(--kc-duration-lg) linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .dashboard-header {
          background: white;
          border-bottom: 1px solid #e9ecef;
          padding: 32px 40px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-section h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .welcome-section p {
          color: var(--kc-gray-500);
          font-size: 1rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #D3A75F, #B8956A);
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .profile-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(211, 167, 95, 0.3);
        }

        .settings-btn, .logout-btn {
          padding: 12px;
          background: transparent;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          cursor: pointer;
          color: var(--kc-gray-500);
          transition: all 0.3s;
        }

        .settings-btn:hover, .logout-btn:hover {
          border-color: #D3A75F;
          color: #D3A75F;
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 28px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-icon.orders {
          background: linear-gradient(135deg, #D3A75F, #B8956A);
        }

        .stat-icon.wishlist {
          background: linear-gradient(135deg, #E91E63, #AD1457);
        }

        .stat-icon.spending {
          background: linear-gradient(135deg, #2196F3, #1976D2);
        }

        .stat-icon.reviews {
          background: linear-gradient(135deg, #FF9800, #F57C00);
        }

        .stat-content h3 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 4px 0;
        }

        .stat-content p {
          font-size: 0.9rem;
          color: var(--kc-gray-500);
          margin: 0;
        }

        .quick-actions {
          margin-bottom: 50px;
        }

        .quick-actions h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 24px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .action-card {
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s;
          text-align: center;
        }

        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .action-card svg {
          color: #D3A75F;
          margin-bottom: 16px;
        }

        .action-card h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .action-card p {
          color: var(--kc-gray-500);
          margin: 0;
          line-height: 1.5;
        }

        .dashboard-sections {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .view-all {
          color: #D3A75F;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s;
        }

        .view-all:hover {
          color: #B8956A;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .order-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s;
        }

        .order-card:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .order-header h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .order-status {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .order-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--kc-gray-500);
          margin: 4px 0;
        }

        .order-items {
          font-size: 0.85rem;
          color: var(--kc-gray-500);
          margin: 0;
        }

        .order-actions {
          text-align: right;
        }

        .order-total {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .view-order-btn {
          padding: 8px 16px;
          background: #F8F9FA;
          color: var(--kc-gray-500);
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.3s;
        }

        .view-order-btn:hover {
          background: #D3A75F;
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        }

        .empty-state svg {
          color: #D3A75F;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: var(--kc-gray-500);
          margin-bottom: 24px;
        }

        .shop-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #D3A75F, #B8956A);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .shop-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(211, 167, 95, 0.3);
        }

        .wishlist-preview {
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        }

        .wishlist-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .wishlist-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .wishlist-item:hover {
          border-color: #D3A75F;
          transform: translateY(-2px);
        }

        .item-image {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-info h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 4px 0;
        }

        .designer {
          font-size: 0.8rem;
          color: var(--kc-gray-500);
          margin: 0 0 8px 0;
        }

        .price {
          font-size: 0.9rem;
          font-weight: 700;
          color: #D3A75F;
        }

        .empty-wishlist {
          text-align: center;
          padding: 40px 20px;
          color: var(--kc-gray-500);
        }

        .empty-wishlist svg {
          margin-bottom: 12px;
        }

        .empty-wishlist p {
          margin: 4px 0;
          font-size: 0.9rem;
        }

        @media (max-width: 1024px) {
          .dashboard-sections {
            grid-template-columns: 1fr;
            gap: 30px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: 20px;
          }

          .header-content {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }

          .header-actions {
            justify-content: center;
          }

          .quick-stats {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .order-card {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .order-actions {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerDashboard;