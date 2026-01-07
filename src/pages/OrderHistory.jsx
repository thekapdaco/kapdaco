import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { X, AlertCircle, FileText, Download } from "lucide-react";
import "../styles/orderHistory.css";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    if (!token) {
      setError("Please log in to view your orders");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api('/api/orders', {
        method: 'GET',
        token: token
      });
      setOrders(response.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleCancelClick = (e, orderId) => {
    e.stopPropagation(); // Prevent navigation
    setCancellingOrderId(orderId);
    setCancelReason('');
    setCancelError('');
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;

    try {
      setCancelError('');
      const response = await api(`/api/orders/${cancellingOrderId}/cancel`, {
        method: 'POST',
        token: token,
        body: {
          reason: cancelReason || 'No reason provided'
        }
      });

      // Refresh orders list
      await fetchOrders();
      
      // Close modal
      setShowCancelModal(false);
      setCancellingOrderId(null);
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setCancelError(err.message || 'Failed to cancel order. Please try again.');
    }
  };

  const canCancelOrder = (order) => {
    const cancellableStatuses = ['pending', 'processing'];
    return cancellableStatuses.includes(order.status);
  };

  const handleDownloadInvoice = async (e, orderId) => {
    e.stopPropagation(); // Prevent navigation
    
    if (!token) {
      alert('Please log in to download invoice');
      return;
    }

    try {
      setDownloadingInvoiceId(orderId);
      
      // Get API base URL from environment (same as api.js)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const invoiceUrl = `${API_BASE_URL}/api/orders/${orderId}/invoice`;
      
      // Fetch invoice as blob
      const response = await fetch(invoiceUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download invoice');
      }

      // Get blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${orderId.toString().slice(-6)}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert(err.message || 'Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600',
      processing: 'text-blue-600',
      shipped: 'text-purple-600',
      delivered: 'text-green-600',
      canceled: 'text-red-600',
      refunded: 'text-gray-600'
    };
    return colors[status] || 'text-gray-600';
  };

  if (!token) {
    return (
      <div className="order-history-container section-container">
        <div className="section-header">
          <h1 className="section-title">Your Orders</h1>
          <p className="section-subtitle">Track your past purchases and their status</p>
        </div>
        <div className="text-center py-12">
          <p className="text-[var(--kc-ink-2)] mb-4">Please log in to view your orders.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] font-semibold rounded-lg hover:bg-[var(--kc-gold-300)] transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="order-history-container section-container">
        <div className="section-header">
          <h1 className="section-title">Your Orders</h1>
          <p className="section-subtitle">Track your past purchases and their status</p>
        </div>
        <div className="text-center py-12">
          <p className="text-[var(--kc-ink-2)]">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history-container section-container">
        <div className="section-header">
          <h1 className="section-title">Your Orders</h1>
          <p className="section-subtitle">Track your past purchases and their status</p>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] font-semibold rounded-lg hover:bg-[var(--kc-gold-300)] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-container section-container">
      <div className="section-header">
        <h1 className="section-title">Your Orders</h1>
        <p className="section-subtitle">Track your past purchases and their status</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--kc-ink-2)] mb-4">You have no orders yet.</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-6 py-3 bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] font-semibold rounded-lg hover:bg-[var(--kc-gold-300)] transition-colors"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="order-history-list grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div 
              key={order._id || order.id} 
              className="order-history-card glass-card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/orders/${order._id || order.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--kc-ink)]">
                    Order #{order._id?.toString().slice(-6) || order.id?.toString().slice(-6) || 'N/A'}
                  </h3>
                  <p className="text-xs text-[var(--kc-ink-2)] mt-1">
                    {formatDate(order.createdAt || order.created_at)}
                  </p>
                </div>
                <span className={`text-xs font-semibold uppercase px-3 py-1 rounded-full ${getStatusColor(order.status)} bg-opacity-10`}>
                  {order.status || 'pending'}
                </span>
              </div>
              
              {/* Handle both old single product format and new items[] format */}
              {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                <div className="mb-3">
                  <p className="text-sm text-[var(--kc-ink-2)] mb-2">Items:</p>
                  <ul className="space-y-1">
                    {order.items.map((item, i) => (
                      <li key={i} className="text-sm text-[var(--kc-ink)]">
                        {item.productId?.title || item.title || item.name || 'Product'} 
                        {item.quantity > 1 && ` (×${item.quantity})`}
                        <span className="text-[var(--kc-ink-2)] ml-2">
                          ₹{((item.price || item.priceAtPurchase || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : order.productId ? (
                <div className="mb-3">
                  <p className="text-sm text-[var(--kc-ink)]">
                    {order.productId?.title || 'Product'} 
                    {order.quantity > 1 && ` (×${order.quantity})`}
                  </p>
                </div>
              ) : null}
              
              <div className="flex justify-between items-center pt-3 border-t border-white/25">
                <span className="text-sm text-[var(--kc-ink-2)]">Total</span>
                <span className="text-lg font-semibold text-[var(--kc-ink)]">
                  ₹{(order.total || 0).toLocaleString('en-IN')}
                </span>
              </div>
              
              {order.paymentStatus && (
                <p className="text-xs text-[var(--kc-ink-2)] mt-2">
                  Payment: <span className="capitalize">{order.paymentStatus}</span>
                </p>
              )}
              
              {/* Action buttons */}
              <div className="mt-3 flex gap-2">
                {/* Download Invoice button - show for all orders */}
                <button
                  onClick={(e) => handleDownloadInvoice(e, order._id || order.id)}
                  disabled={downloadingInvoiceId === (order._id || order.id)}
                  className="flex-1 px-4 py-2 bg-[var(--kc-gold-200)] hover:bg-[var(--kc-gold-300)] text-[var(--kc-navy-900)] font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingInvoiceId === (order._id || order.id) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[var(--kc-navy-900)] border-t-transparent rounded-full animate-spin"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Invoice
                    </>
                  )}
                </button>
                
                {/* Cancel button - only show for cancellable orders */}
                {canCancelOrder(order) && (
                  <button
                    onClick={(e) => handleCancelClick(e, order._id || order.id)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              {cancellingOrderId && (
                <p className="text-xs text-gray-500 mb-3">
                  Order #{cancellingOrderId?.toString().slice(-6)}
                </p>
              )}
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please let us know why you're cancelling this order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--kc-gold-200)] focus:border-transparent resize-none"
                rows="3"
              />
            </div>

            {cancelError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{cancelError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
