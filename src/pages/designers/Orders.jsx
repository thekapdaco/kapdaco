import { useEffect, useState } from 'react';
import { Loader2, Package, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { KCButton, KCCard, KCAlert } from '../../components/ui';
import { cn } from '../../lib/cn';

const statusTone = {
  pending: 'bg-[rgba(255,196,0,0.18)] text-[var(--kc-ink)]',
  processing: 'bg-[rgba(33,150,243,0.14)] text-[var(--kc-ink)]',
  shipped: 'bg-[rgba(46,204,113,0.18)] text-[var(--kc-ink)]',
  delivered: 'bg-[rgba(46,204,113,0.18)] text-[var(--kc-ink)]',
};

export default function DesignerOrders() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api('/api/designer/orders', { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Orders could not be retrieved.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const markShipped = async (id) => {
    if (!id) return;
    try {
      setActioning(id);
      await api(`/api/designer/orders/${id}/ship`, { method: 'PATCH', token });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to update the order status.');
    } finally {
      setActioning('');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--kc-bg)] py-16">
      <div className="kc-container max-w-5xl space-y-8">
        <header className="space-y-2">
          <p className="kc-pill bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-2)]">Order Management</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--kc-ink)] md:text-[2.5rem]">
            Fulfil the latest designer purchases
          </h1>
          <p className="text-sm text-[var(--kc-ink-2)]">
            Keep clients delighted by shipping on time. Update statuses here once parcels are handed to your carrier.
          </p>
        </header>

        {error ? (
          <KCAlert variant="danger">{error}</KCAlert>
        ) : null}

        {loading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[var(--kc-radius-lg)] border border-[var(--kc-border)] bg-[var(--kc-card)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--kc-gold-1)]" />
            <p className="text-sm text-[var(--kc-ink-2)]">Fetching orders…</p>
          </div>
        ) : items.length === 0 ? (
          <KCCard muted className="space-y-4 text-center">
            <Package size={24} className="mx-auto text-[var(--kc-gold-1)]" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-[var(--kc-ink)]">No orders yet</p>
              <p className="text-sm text-[var(--kc-ink-2)]">Promote your capsule collection to drive the first few sales.</p>
            </div>
            <KCButton as={ArrowRight} className="hidden" />
          </KCCard>
        ) : (
          <div className="space-y-4">
            {items.map((order) => {
              const displayId = order._id ? order._id.slice(-6).toUpperCase() : '—';
              const status = (order.status || 'pending').toLowerCase();
              const statusClass = statusTone[status] || 'bg-[var(--kc-card)] text-[var(--kc-ink-2)]';

              return (
                <KCCard key={order._id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="kc-pill bg-[var(--kc-card)] text-xs font-semibold text-[var(--kc-ink-2)]">
                        #{displayId}
                      </span>
                      <span className={cn('kc-pill text-xs font-semibold', statusClass)}>{status}</span>
                    </div>
                    <div className="space-y-1 text-sm text-[var(--kc-ink-2)]">
                      <p className="text-[var(--kc-ink)] font-semibold">{order.productId?.title || 'Untitled Product'}</p>
                      <p>
                        Quantity: <span className="font-medium text-[var(--kc-ink)]">{order.quantity ?? 0}</span>
                      </p>
                      <p>
                        Placed on{' '}
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'} by{' '}
                        <span className="font-medium text-[var(--kc-ink)]">{order.customer?.name || 'Kapda Co. Customer'}</span>
                      </p>
                      {order.shippingAddress ? (
                        <p>
                          Ship to {order.shippingAddress.city}, {order.shippingAddress.country}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    {status === 'pending' ? (
                      <KCButton
                        className="min-w-[180px] justify-center"
                        onClick={() => markShipped(order._id)}
                        disabled={actioning === order._id}
                        icon={actioning === order._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={16} />}
                      >
                        {actioning === order._id ? 'Updating…' : 'Mark as Shipped'}
                      </KCButton>
                    ) : (
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--kc-ink-2)]">
                        <Clock size={14} /> {status === 'shipped' ? 'Awaiting delivery' : 'Completed'}
                      </span>
                    )}
                  </div>
                </KCCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}