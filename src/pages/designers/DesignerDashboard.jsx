import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  GalleryHorizontal,
  Heart,
  Layers,
  Loader2,
  LogOut,
  MessageSquare,
  PackageCheck,
  Plus,
  Settings,
  Sparkles,
  TrendingUp,
  Upload,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { KCButton } from "../../components/ui";
import api from "../../lib/api";
import {
  GoldButton,
  StatPill,
  StudioCard,
  TableLite,
  PillTabs,
  GalleryGrid,
  TagChip,
} from "../../components/designers";

const DesignerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentDesigns, setRecentDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "designer") {
      navigate(user.role === "admin" ? "/admin/dashboard" : "/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== "designer") return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [statsJson, designsJson] = await Promise.all([
          api("/api/designer/stats", { token }),
          api("/api/designer/products?limit=12", { token }),
        ]);

        setStats(statsJson);
        setRecentDesigns(designsJson.products || designsJson.designs || []);
      } catch (err) {
        console.error("Failed to fetch designer dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const statData = useMemo(
    () => [
      {
        label: "Revenue (MTD)",
        value: stats.revenueMtd ? `₹${Number(stats.revenueMtd).toLocaleString()}` : "₹0",
        icon: DollarSign,
      },
      {
        label: "Orders",
        value: stats.totalOrders ?? 0,
        icon: PackageCheck,
      },
      {
        label: "Commissions In Progress",
        value: stats.commissions ?? 2,
        icon: Layers,
      },
      {
        label: "Followers",
        value: stats.followerCount ?? stats.followers ?? 0,
        icon: Heart,
      },
      {
        label: "Conversion Rate",
        value: stats.conversionRate ? `${stats.conversionRate}%` : "3.8%",
        icon: TrendingUp,
      },
    ],
    [stats],
  );

  const boardColumns = useMemo(() => {
    const sample = recentDesigns.slice(0, 6).map((design, index) => ({
      id: design._id || index,
      title: design.title,
      client: design.client || "Studio commission",
      due: design.deadline ? new Date(design.deadline).toLocaleDateString() : "In 5 days",
      status: ["New", "In Review", "In Production", "Shipped", "Completed"][index % 5],
      preview: design.imageUrl,
    }));

    const grouped = {
      New: sample.filter((item) => item.status === "New"),
      "In Review": sample.filter((item) => item.status === "In Review"),
      "In Production": sample.filter((item) => item.status === "In Production"),
      Shipped: sample.filter((item) => item.status === "Shipped"),
      Completed: sample.filter((item) => item.status === "Completed"),
    };

    return grouped;
  }, [recentDesigns]);

  const productRows = useMemo(() => {
    return recentDesigns.map((design, index) => ({
      id: design._id || index,
      sku: design.sku || `KC-${1000 + index}`,
      title: design.title,
      price: design.price ? `₹${Number(design.price).toLocaleString()}` : "—",
      status: design.status || "draft",
      stock: design.stock ?? "On demand",
      updated: design.updatedAt ? new Date(design.updatedAt).toLocaleDateString() : "—",
    }));
  }, [recentDesigns]);

  const assets = useMemo(() => {
    if (!recentDesigns.length) {
      return [
        {
          id: "mock-1",
          image:
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
          dpi: "300 DPI",
          tag: "Lookbook",
        },
        {
          id: "mock-2",
          image:
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
          dpi: "360 DPI",
          tag: "Flatlay",
        },
      ];
    }

    return recentDesigns.slice(0, 8).map((design, index) => ({
      id: design._id || index,
      image: design.imageUrl,
      dpi: `${design.dpi || 300} DPI`,
      tag: design.category || "Campaign",
    }));
  }, [recentDesigns]);

  const balance = stats.balance ?? 0;

  const handleLogout = () => {
    logout();
    navigate("/designer/login");
  };

  if (!user || user.role !== "designer") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-white/70" style={{ backgroundColor: 'var(--kc-surface-dark)' }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 border-t-[var(--kc-gold-1)]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-sm uppercase tracking-[0.3em]">Loading designer studio…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 text-white" style={{ backgroundColor: 'var(--kc-surface-dark)' }}>
      <section className="relative overflow-hidden border-b border-white/10" style={{ backgroundColor: 'var(--kc-navy-900)' }}>
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "var(--kc-grad-gold)" }} />
        <div className="kc-container relative z-10 flex flex-col gap-10 py-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="kc-pill border-white/12 bg-white/10 text-white/70">Designer Portal</p>
              <h1 className="text-3xl font-semibold drop-shadow-[0_32px_90px_rgba(0,0,0,0.65)] md:text-[2.9rem]">
                Welcome back, {user.name}
              </h1>
              <p className="max-w-2xl text-sm text-white/70">
                Manage commissions, collections, and analytics in one place. Update availability when you open new
                slots.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <GoldButton as={Link} to="/designer/products/new" icon={<Upload size={16} />} iconPosition="right">
                  Upload Design
                </GoldButton>
                <KCButton
                  variant="ghost"
                  onClick={() => navigate("/designer/collections/new")}
                  className="border border-white/18 bg-white/6 px-5 py-2 text-white/80 hover:text-white"
                  icon={<Plus size={16} />}
                >
                  Create Collection
                </KCButton>
                <KCButton
                  variant="ghost"
                  onClick={() => navigate("/brand/settings")}
                  className="border border-white/18 bg-white/6 p-2 text-white/70 hover:text-white"
                  icon={<Settings size={18} />}
                  aria-label="Settings"
                />
                <KCButton
                  variant="ghost"
                  onClick={handleLogout}
                  className="border border-white/18 bg-white/6 p-2 hover:opacity-80"
                  style={{ color: 'rgba(255, 132, 132, 1)' }}
                  icon={<LogOut size={18} />}
                  aria-label="Logout"
                />
              </div>
            </div>

            <StudioCard tone="dark" className="bg-white/6 text-white">
              <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/60">Availability</h3>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>Commission slots</span>
                  <TagChip active className="bg-[var(--kc-gold-1)]/20 text-[var(--kc-gold-1)]">
                    2 / 5 booked
                  </TagChip>
                </div>
                <div className="flex items-center justify-between">
                  <span>Next consult window</span>
                  <span className="font-semibold text-white">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-responder</span>
                  <span className="font-semibold text-white">On</span>
                </div>
                <GoldButton className="w-full" onClick={() => navigate("/designer/settings/availability")}>Update</GoldButton>
              </div>
            </StudioCard>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {statData.map((stat) => (
              <StatPill key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <section className="kc-container mt-14 grid gap-8 xl:grid-cols-[1.7fr_1fr]">
        <StudioCard tone="dark" className="bg-white/6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Orders & Commissions</h2>
            <PillTabs
              tabs={[{ label: "Kanban", value: "kanban" }, { label: "Table", value: "table" }]}
              activeTab="kanban"
              onChange={() => {}}
            />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(boardColumns).map(([column, items]) => (
              <div key={column} className="rounded-[var(--kc-radius-lg)] border border-white/10 bg-white/4">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.32em] text-white/55">
                  <span>{column}</span>
                  <TagChip active className="bg-white/10 text-white/70">
                    {items.length}
                  </TagChip>
                </div>
                <div className="space-y-3 p-4">
                  {items.length ? (
                    items.map((item) => (
                      <div key={item.id} className="rounded-[var(--kc-radius)] border border-white/12 bg-white/6 p-4 text-sm text-white/75">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white">{item.title}</p>
                          <span className="text-xs uppercase tracking-[0.3em] text-white/45">{item.due}</span>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/45">{item.client}</p>
                        {item.preview ? (
                          <img src={item.preview} alt="Preview" className="mt-3 h-20 w-full rounded-[var(--kc-radius)] object-cover" />
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-white/60">No items in this stage.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </StudioCard>

        <StudioCard tone="dark" className="bg-white/6 text-white">
          <h2 className="text-xl font-semibold text-white">Payouts</h2>
          <div className="mt-6 space-y-4 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Current balance</span>
              <span className="text-2xl font-semibold text-[var(--kc-gold-1)]">₹{Number(balance).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Next payout</span>
              <span>{stats.nextPayoutDate ? new Date(stats.nextPayoutDate).toLocaleDateString() : "12 Nov 2025"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Commission %</span>
              <span>{stats.commissionPercent ?? 30}%</span>
            </div>
            <GoldButton className="w-full" icon={<ArrowRight size={16} />} iconPosition="right">
              Request Payout
            </GoldButton>
            <p className="text-xs text-white/55">
              Review GST & tax configuration, download invoices, and manage beneficiaries from the payout center.
            </p>
          </div>
        </StudioCard>
      </section>

      <section className="kc-container mt-14 grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <StudioCard tone="dark" className="bg-white/6 text-white">
          <h2 className="text-xl font-semibold text-white">Products</h2>
          <div className="mt-6">
            <TableLite
              columns={[
                { key: "sku", label: "SKU" },
                { key: "title", label: "Title" },
                { key: "price", label: "Price" },
                { key: "status", label: "Status", render: (value) => value?.toUpperCase() },
                { key: "stock", label: "Stock" },
                { key: "updated", label: "Updated" },
              ]}
              data={productRows.slice(0, 6)}
              renderActions={(row) => (
                <KCButton
                  variant="ghost"
                  className="border border-white/14 bg-white/6 px-3 py-1 text-xs text-white/70 hover:text-white"
                  onClick={() => navigate(`/designer/products/${row.id}`)}
                >
                  Manage
                </KCButton>
              )}
            />
          </div>
        </StudioCard>

        <StudioCard tone="dark" className="bg-white/6 text-white">
          <h2 className="text-xl font-semibold text-white">Messages</h2>
          <div className="mt-6 space-y-4 text-sm text-white/70">
            {["Aditi", "Marcus", "Elena"].map((client, index) => (
              <div key={client} className="rounded-[var(--kc-radius)] border border-white/12 bg-white/6 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{client}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/45">SLA {index + 2} hrs</span>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  Moodboard updated with new palette references. Awaiting your confirmation before embroidery.
                </p>
                <div className="mt-3 flex gap-2">
                  <KCButton
                    variant="ghost"
                    className="border border-white/14 bg-white/8 px-3 py-1 text-xs text-white/70 hover:text-white"
                  >
                    Reply
                  </KCButton>
                  <KCButton
                    variant="ghost"
                    className="border border-white/14 bg-white/8 px-3 py-1 text-xs text-white/70 hover:text-white"
                  >
                    Share files
                  </KCButton>
                </div>
              </div>
            ))}
          </div>
        </StudioCard>
      </section>

      <section className="kc-container mt-14 grid gap-8 xl:grid-cols-[1.4fr_1.2fr]">
        <StudioCard tone="dark" className="bg-white/6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Asset Library</h2>
            <PillTabs tabs={[{ label: "All", value: "all" }, { label: "Campaign", value: "campaign" }]} activeTab="all" onChange={() => {}} />
          </div>
          <div className="mt-6">
            <GalleryGrid
              items={assets}
              renderItem={(asset) => (
                <>
                  <div className="aspect-square w-full overflow-hidden">
                    <img src={asset.image} alt="Asset" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs text-white/75">
                    <GalleryHorizontal size={14} /> {asset.dpi}
                  </div>
                  <div className="absolute bottom-3 left-3 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs text-white/75">
                    {asset.tag}
                  </div>
                </>
              )}
            />
          </div>
        </StudioCard>

        <StudioCard tone="dark" className="bg-white/6 text-white">
          <h2 className="text-xl font-semibold text-white">Insights & Settings</h2>
          <div className="mt-6 space-y-6 text-sm text-white/70">
            <div className="rounded-[var(--kc-radius)] border border-white/12 bg-white/6 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Top Collection</span>
                <TagChip active className="bg-[var(--kc-gold-1)]/20 text-[var(--kc-gold-1)]">
                  View → Cart 62%
                </TagChip>
              </div>
              <p className="mt-2 text-xs text-white/55">Neo-Minimal AW25 drives the highest add-to-bag conversions.</p>
            </div>
            <div className="rounded-[var(--kc-radius)] border border-white/12 bg-white/6 p-4">
              <span className="font-semibold text-white">Heatmap Calendar</span>
              <p className="mt-2 text-xs text-white/55">Peak engagement on Thursdays. Consider scheduling drops mid-week.</p>
            </div>
            <div className="rounded-[var(--kc-radius)] border border-white/12 bg-white/6 p-4">
              <span className="font-semibold text-white">Profile & Policies</span>
              <p className="mt-2 text-xs text-white/55">Update atelier info, commission intake, and social links.</p>
              <GoldButton
                className="mt-3 w-full"
                icon={<Settings size={16} />}
                iconPosition="right"
                onClick={() => navigate("/designer/settings")}
              >
                Manage Settings
              </GoldButton>
            </div>
          </div>
        </StudioCard>
      </section>
    </div>
  );
};

export default DesignerDashboard;