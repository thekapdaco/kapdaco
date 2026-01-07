import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, MapPin, Clock, CheckCircle, Truck, Home } from 'lucide-react';
import { KCCard, KCInput, KCButton } from '../components/ui';
import { api } from '../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  canceled: Home,
};

const statusColors = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  shipped: 'text-purple-500',
  delivered: 'text-green-500',
  canceled: 'text-red-500',
};

const OrderTracking = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      setError('Please enter both order ID and email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // TODO: Replace with actual API endpoint when available
      // const response = await api(`/api/orders/track?orderId=${orderId}&email=${email}`);
      // setOrder(response.order);

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOrder({
        _id: orderId,
        orderNumber: `ORD-${orderId.slice(-6).toUpperCase()}`,
        status: 'shipped',
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        shippingAddress: {
          street: '123 Fashion Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
        items: [
          {
            product: { title: 'Oversized Classic White T-Shirt', mainImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200' },
            quantity: 1,
            price: 999,
            size: 'L',
            color: 'White',
          },
        ],
        total: 999,
        shippingCost: 0,
        trackingNumber: 'TRACK123456789',
        trackingHistory: [
          { status: 'pending', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), location: 'Order placed' },
          { status: 'processing', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), location: 'Order confirmed' },
          { status: 'processing', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), location: 'Item prepared for shipment' },
          { status: 'shipped', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), location: 'Mumbai, India' },
        ],
      });
    } catch (err) {
      setError(err.message || 'Order not found. Please check your order ID and email.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Order Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      canceled: 'Canceled',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-[var(--kc-bg)]">
      <div className="kc-container py-16 md:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mx-auto max-w-4xl"
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--kc-gold-1)]/20 bg-gradient-to-br from-[var(--kc-gold-1)]/10 to-[var(--kc-gold-2)]/5"
            >
              <Package size={32} className="text-[var(--kc-gold-1)]" strokeWidth={1.5} />
            </motion.div>
            <h1 className="mb-4 text-4xl font-serif text-[var(--kc-ink)] md:text-5xl">
              Track Your Order
            </h1>
            <p className="text-[var(--kc-ink-2)]">
              Enter your order details to view real-time tracking information
            </p>
          </div>

          {/* Search Form */}
          <KCCard className="mb-8 p-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="orderId" className="mb-2 block text-sm font-medium text-[var(--kc-ink)]">
                    Order ID / Order Number
                  </label>
                  <KCInput
                    id="orderId"
                    type="text"
                    placeholder="ORD-123456"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--kc-ink)]">
                    Email Address
                  </label>
                  <KCInput
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="rounded-[var(--kc-radius)] border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <KCButton type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Search size={18} className="mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} className="mr-2" />
                    Track Order
                  </>
                )}
              </KCButton>
            </form>
          </KCCard>

          {/* Order Details */}
          {order && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="space-y-6"
            >
              {/* Order Summary */}
              <KCCard className="p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--kc-ink-2)]">Order Number</p>
                    <h2 className="text-2xl font-serif text-[var(--kc-ink)]">{order.orderNumber}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--kc-ink-2)]">Status</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const StatusIcon = statusIcons[order.status] || Package;
                        return (
                          <StatusIcon
                            size={20}
                            className={statusColors[order.status] || 'text-[var(--kc-ink-2)]'}
                            strokeWidth={1.5}
                          />
                        );
                      })()}
                      <span className={`font-medium ${statusColors[order.status] || 'text-[var(--kc-ink)]'}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 border-t border-[var(--kc-border)] pt-6 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm text-[var(--kc-ink-2)]">Order Date</p>
                    <p className="text-[var(--kc-ink)]">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-[var(--kc-ink-2)]">Estimated Delivery</p>
                    <p className="text-[var(--kc-ink)]">
                      {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </KCCard>

              {/* Tracking Timeline */}
              <KCCard className="p-8">
                <h3 className="mb-6 text-xl font-serif text-[var(--kc-ink)]">Tracking History</h3>
                <div className="relative">
                  {order.trackingHistory?.map((event, index) => {
                    const EventIcon = statusIcons[event.status] || Package;
                    const isLast = index === order.trackingHistory.length - 1;
                    const isActive = order.status === event.status && isLast;

                    return (
                      <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
                        {!isLast && (
                          <div className="absolute left-5 top-10 h-full w-0.5 bg-[var(--kc-border)]" />
                        )}
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                            isActive
                              ? 'border-[var(--kc-gold-1)] bg-[var(--kc-gold-1)]/10'
                              : 'border-[var(--kc-border)] bg-[var(--kc-bg)]'
                          }`}
                        >
                          <EventIcon
                            size={20}
                            className={
                              isActive
                                ? 'text-[var(--kc-gold-1)]'
                                : statusColors[event.status] || 'text-[var(--kc-ink-2)]'
                            }
                            strokeWidth={1.5}
                          />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="mb-1 font-medium text-[var(--kc-ink)]">{event.location}</p>
                          <p className="text-sm text-[var(--kc-ink-2)]">
                            {new Date(event.timestamp).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </KCCard>

              {/* Order Items */}
              <KCCard className="p-8">
                <h3 className="mb-6 text-xl font-serif text-[var(--kc-ink)]">Order Items</h3>
                <div className="space-y-4">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex gap-4 border-b border-[var(--kc-border)] pb-4 last:border-0">
                      <img
                        src={item.product.mainImage || item.product.images?.[0]}
                        alt={item.product.title}
                        className="h-20 w-20 rounded-[var(--kc-radius)] object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-[var(--kc-ink)]">{item.product.title}</h4>
                        <p className="text-sm text-[var(--kc-ink-2)]">
                          Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--kc-ink)]">
                          ₹{item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-[var(--kc-border)] pt-6">
                  <span className="text-lg font-medium text-[var(--kc-ink)]">Total</span>
                  <span className="text-2xl font-serif text-[var(--kc-ink)]">
                    ₹{order.total.toLocaleString()}
                  </span>
                </div>
              </KCCard>

              {/* Shipping Address */}
              <KCCard className="p-8">
                <div className="mb-4 flex items-center gap-3">
                  <MapPin size={20} className="text-[var(--kc-gold-1)]" strokeWidth={1.5} />
                  <h3 className="text-xl font-serif text-[var(--kc-ink)]">Shipping Address</h3>
                </div>
                <p className="text-[var(--kc-ink-2)]">
                  {order.shippingAddress.street}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  <br />
                  {order.shippingAddress.country}
                </p>
                {order.trackingNumber && (
                  <div className="mt-4 rounded-[var(--kc-radius)] border border-[var(--kc-border)] bg-[var(--kc-surface-muted)] p-4">
                    <p className="mb-1 text-sm text-[var(--kc-ink-2)]">Tracking Number</p>
                    <p className="font-mono text-[var(--kc-ink)]">{order.trackingNumber}</p>
                  </div>
                )}
              </KCCard>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OrderTracking;

