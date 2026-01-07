import { useEffect, useState } from 'react';
import { Loader2, Wallet, TrendingUp, PackageCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { KCCard, KCAlert } from '../../components/ui';

const metricCards = (data) => [
  {
    label: 'Lifetime Earnings',
    value: data.total ? `₹${data.total.toLocaleString()}` : '₹0',
    hint: 'After platform fees',
    icon: Wallet,
  },
  {
    label: 'Completed Orders',
    value: data.orders ?? 0,
    hint: 'Fulfilled and paid out',
    icon: PackageCheck,
  },
  {
    label: 'Average Order Value',
    value:
      data.orders && data.orders > 0
        ? `₹${Math.round((data.total || 0) / data.orders).toLocaleString()}`
        : '—',
    hint: 'Based on lifetime sales',
    icon: TrendingUp,
  },
];

export default function DesignerEarnings() {
  const { token } = useAuth();
  const [data, setData] = useState({ total: 0, orders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api('/api/designer/earnings', { token });
        setData(response || { total: 0, orders: 0 });
      } catch (err) {
        setError(err.message || 'Unable to fetch earnings snapshot right now.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      load();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-[var(--kc-bg)] py-16">
      <div className="kc-container max-w-4xl space-y-8">
        <header className="space-y-2">
          <p className="kc-pill bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-2)]">Earnings Overview</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--kc-ink)] md:text-[2.5rem]">
            Your designer revenue at a glance
          </h1>
          <p className="text-sm text-[var(--kc-ink-2)]">
            This dashboard tracks confirmed orders, payouts, and signals how your capsule collections perform over time.
          </p>
        </header>

        {error ? (
          <KCCard muted className="space-y-3">
            <KCAlert variant="danger">{error}</KCAlert>
            <p className="text-xs text-[var(--kc-ink-2)]">
              Try refreshing the page. If the issue persists, reach out to the Kapda Co. support team.
            </p>
          </KCCard>
        ) : null}

        {loading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[var(--kc-radius-lg)] border border-[var(--kc-border)] bg-[var(--kc-card)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--kc-gold-1)]" />
            <p className="text-sm text-[var(--kc-ink-2)]">Calculating your earnings…</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metricCards(data).map(({ label, value, hint, icon: Icon }) => (
              <KCCard key={label} className="space-y-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--kc-radius)] bg-[rgba(211,167,95,0.12)] text-[var(--kc-gold-1)]">
                  <Icon size={18} />
                </span>
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--kc-ink-2)]">{label}</p>
                  <p className="text-2xl font-semibold text-[var(--kc-ink)]">{value}</p>
                  <p className="text-xs text-[var(--kc-ink-2)]">{hint}</p>
                </div>
              </KCCard>
            ))}
          </div>
        )}

        <KCCard className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--kc-ink)]">Next steps</h2>
          <ul className="space-y-3 text-sm text-[var(--kc-ink-2)]">
            <li>• Track payout batches from the designer dashboard every Friday.</li>
            <li>• Enable premium pricing if your average order value grows above ₹2,000.</li>
            <li>• Create limited drops to nudge repeat customers and increase lifetime value.</li>
          </ul>
        </KCCard>
      </div>
    </div>
  );
}