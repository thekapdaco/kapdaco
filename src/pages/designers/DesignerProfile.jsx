import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  Globe,
  Heart,
  Instagram,
  Layers,
  Loader2,
  MapPin,
  Palette,
  Share2,
  Sparkles,
  Star,
  ShoppingBag,
  Package,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { KCButton, KCAlert } from "../../components/ui";
import {
  GoldButton,
  FollowButton,
  StatPill,
  TagChip,
  Badge,
  GalleryGrid,
  ReviewList,
  PillTabs,
  StudioCard,
  TableLite,
  FilterDrawer,
} from "../../components/designers";
import { cn } from "../../lib/cn";

const noiseTexture =
  "url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 400 400\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'n\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'1.2\\' numOctaves=\\'2\\' stitchTiles=\\'stitch\\'/%3E%3CfeColorMatrix type=\\'saturate\\' values=\\'0\\'/%3E%3C/filter%3E%3Crect width=\\'400\\' height=\\'400\\' filter=\\'url(%23n)\\' opacity=\\'0.05\\'/%3E%3C/svg%3E')";

const DesignerProfile = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  // Safely get auth context - may not be available if not logged in
  let user = null;
  let token = null;
  try {
    const auth = useAuth();
    user = auth?.user || null;
    token = auth?.token || null;
  } catch (e) {
    // Auth context not available, continue without auth
    console.log('Auth context not available, viewing as guest');
  }

  const [designer, setDesigner] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCollection, setActiveCollection] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [portfolioFilters, setPortfolioFilters] = useState({
    product: "all",
    style: "all",
    color: "all",
    price: "all",
  });
  const [aboutExpanded, setAboutExpanded] = useState(false);

  useEffect(() => {
    fetchDesignerProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDesignerProfile = async () => {
    try {
      setLoading(true);
      setError("");

      // Include auth token if user is logged in (to show own products if viewing own profile)
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/public/designers/${id}`, {
        headers
      });
      if (!response.ok) {
        if (response.status === 404) {
          setError("Designer not found");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      if (!data || !data.designer) {
        setError("Designer data not found");
        return;
      }
      
      setDesigner(data.designer);
      const allDesigns = Array.isArray(data.designs) ? data.designs : (Array.isArray(data.products) ? data.products : []);
      
      // Show all products returned by API (published and pending_review)
      // API filters out drafts, so we can show all returned products
      const visibleDesigns = allDesigns.filter((design) => {
        if (!design || typeof design !== 'object') return false;
        const status = design.status?.toLowerCase() || '';
        // Show published, pending_review, and approved products
        return status === 'published' || 
               status === 'pending_review' || 
               status === 'approved' || 
               status === 'active' ||
               design.approved === true || 
               design.isApproved === true;
      });
      setDesigns(visibleDesigns);
    } catch (err) {
      console.error("Failed to fetch designer profile:", err);
      setError("We couldn’t load this designer right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (design) => {
    try {
      await addToCart({
        productId: design._id,
        title: design.title,
        price: Number(design.price || 0),
        image: design.imageUrl,
        quantity: 1,
      });
      alert(`Added ${design.title} to your bag.`);
    } catch (e) {
      console.error("Failed to add to cart:", e);
      alert("Couldn’t add this design to your bag. Please try again.");
    }
  };

  const heroBackground =
    "linear-gradient(130deg, var(--kc-surface-dark) 0%, var(--kc-navy-900) 45%, var(--kc-navy-700) 80%, rgba(15, 27, 42, 0.85) 100%)";
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  const joinedDate = designer?.joinedDate || designer?.createdAt;
  const formattedJoinedDate = joinedDate ? new Date(joinedDate).toLocaleDateString() : "—";

  const statPills = useMemo(() => {
    if (!designer) return [];
    return [
      {
        label: "Followers",
        value: (designer.followerCount ?? designer.followers ?? 0).toLocaleString(),
        icon: Layers,
      },
      {
        label: "Pieces",
        value: (designer.totalDesigns ?? designs.length ?? 0).toLocaleString(),
        icon: Palette,
      },
      {
        label: "Rating",
        value: (designer.rating ?? 4.7).toFixed(1),
        icon: Star,
      },
    ];
  }, [designer, designs.length]);

  const collections = useMemo(() => {
    const unique = new Set(designs.map((design) => design.collection || design.category).filter(Boolean));
    return ["all", ...unique];
  }, [designs]);

  const portfolioFacets = useMemo(() => {
    const facets = {
      product: new Set(),
      style: new Set(),
      color: new Set(),
    };

    designs.forEach((design) => {
      if (!design || typeof design !== 'object') return;
      if (design.productType) facets.product.add(design.productType);
      if (Array.isArray(design.styles)) {
        design.styles.forEach((style) => facets.style.add(style));
      } else if (design.style) {
        facets.style.add(design.style);
      }
      if (design.colorway) facets.color.add(design.colorway);
      // Also check for colors array from Product model
      if (Array.isArray(design.colors)) {
        design.colors.forEach((color) => facets.color.add(color));
      }
    });

    return {
      product: Array.from(facets.product).slice(0, 8),
      style: Array.from(facets.style).slice(0, 10),
      color: Array.from(facets.color).slice(0, 6),
    };
  }, [designs]);

  const filteredDesigns = useMemo(() => {
    if (!Array.isArray(designs)) return [];
    return designs.filter((design) => {
      if (!design || typeof design !== 'object') return false;
      
      if (activeCollection !== "all") {
        const group = design.collection || design.category;
        if (group !== activeCollection) return false;
      }

      if (portfolioFilters.product !== "all" && design.productType !== portfolioFilters.product) {
        return false;
      }

      if (portfolioFilters.style !== "all") {
        const designStyles = Array.isArray(design.styles) ? design.styles : (design.style ? [design.style] : []);
        if (!designStyles.includes(portfolioFilters.style)) return false;
      }

      if (portfolioFilters.color !== "all") {
        const designColor = design.colorway || (Array.isArray(design.colors) ? design.colors[0] : null);
        if (designColor !== portfolioFilters.color) return false;
      }

      if (portfolioFilters.price !== "all") {
        const price = Number(design.price || 0);
        if (portfolioFilters.price === "access" && price > 1500) return false;
        if (portfolioFilters.price === "atelier" && (price < 1500 || price > 5000)) return false;
        if (portfolioFilters.price === "couture" && price < 5000) return false;
      }

      return true;
    });
  }, [designs, activeCollection, portfolioFilters]);

  const reviews = useMemo(() => designer?.reviews || [], [designer]);

  const productFocus = useMemo(() => {
    if (!designs.length) {
      const fallback = designer?.productTypes || designer?.productFocus;
      if (Array.isArray(fallback) && fallback.length) {
        return fallback.map((type) => ({ type, count: 1 }));
      }
      return [];
    }

    const map = new Map();
    designs.forEach((design) => {
      const type = (design.productType || design.category || "Apparel").replace(/_/g, " ").replace(/\s+/g, " ");
      const formatted = type.replace(/\btee\b/i, "T-Shirt");
      map.set(formatted, (map.get(formatted) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [designs, designer]);

  const ratingSummary = useMemo(() => {
    const histogram = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((review) => Math.round(review.rating || 0) === star).length,
    }));
    const total = histogram.reduce((acc, item) => acc + item.count, 0);
    const average = reviews.length
      ? reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / reviews.length
      : designer?.rating ?? 4.6;
    return { histogram, total, average };
  }, [reviews, designer]);


  const policies = useMemo(() => {
    if (designer?.policies?.length) return designer.policies;
    return [
      {
        type: "Shipping",
        detail: "Global shipping with insured packaging. Domestic deliveries in 5-7 working days post dispatch.",
      },
      {
        type: "Returns",
        detail: "Made-to-order pieces are final sale. Ready-to-wear eligible for returns within 5 days of receipt.",
      },
    ];
  }, [designer]);

  const handleFilterChange = (key, value) => {
    setPortfolioFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-white/70" style={{ backgroundColor: 'var(--kc-navy-900)' }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 border-t-[var(--kc-gold-1)]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.3em]">Loading designer profile…</p>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--kc-surface-dark)' }}>
        <StudioCard tone="dark" className="max-w-lg text-center">
          <KCAlert variant="danger">{error || "Designer not found."}</KCAlert>
          <GoldButton as={Link} to="/designers" className="mt-6" icon={<ArrowRight size={16} />} iconPosition="right">
            Browse Designers
          </GoldButton>
        </StudioCard>
      </div>
    );
  }

  const locationLabel = [designer.city, designer.country, designer.location].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[var(--kc-navy-900)] pb-32 text-[var(--kc-cream-100)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: heroBackground }} />
        <div className="absolute inset-0 opacity-35" style={{ backgroundImage: noiseTexture }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(211,167,95,0.25),transparent_55%)]" />

        <div className="kc-container relative z-10 grid gap-12 py-24 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-12">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="rounded-[24px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
                <div className="relative h-36 w-36 shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--kc-gold-200)]/50 bg-white/5" />
                  {designer.avatarUrl ? (
                    <img
                      src={designer.avatarUrl}
                      alt={designer.designerName || designer.name}
                      className="relative z-10 h-full w-full rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-[#111826] text-5xl font-semibold text-[var(--kc-gold-200)]">
                      {(designer.designerName || designer.name || "K").charAt(0)}
                    </div>
                  )}
                  {designer.verified ? (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-[var(--kc-gold-200)]/50 bg-[var(--kc-gold-200)]/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--kc-gold-200)]">
                      Verified
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 space-y-5 text-center lg:text-left">
                  <div>
                    <p className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--kc-beige-300)]">
                      Couture Designer
                    </p>
                    <div className="mt-3 h-0.5 w-16 bg-[var(--kc-gold-200)]/60" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-semibold tracking-[-0.02em] leading-tight">
                      {designer.designerName || designer.name}
                    </h1>
                    {designer.username ? (
                      <p className="text-base text-[var(--kc-gold-200)]/90">@{designer.username}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.3em] text-[var(--kc-beige-300)]/80 lg:justify-start">
                    {locationLabel ? (
                      <span className="flex items-center gap-2">
                        <MapPin size={14} />
                        {locationLabel}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-2">
                      <Calendar size={14} /> Joined {formattedJoinedDate}
                    </span>
                    {designer.responseTime ? (
                      <span className="flex items-center gap-2">
                        <Clock size={14} /> Responds in {designer.responseTime}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                    {designer.social?.instagram || designer.instagram ? (
                      <KCButton
                        as="a"
                        href={designer.social?.instagram || designer.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[18px] border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-[var(--kc-beige-300)] transition-colors hover:text-white"
                        icon={<Instagram size={16} />}
                      >
                        Instagram
                      </KCButton>
                    ) : null}
                    {designer.social?.website || designer.website ? (
                      <KCButton
                        as="a"
                        href={designer.social?.website || designer.website}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[18px] border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-[var(--kc-beige-300)] transition-colors hover:text-white"
                        icon={<Globe size={16} />}
                      >
                        Portfolio
                      </KCButton>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <GoldButton className="px-7" icon={<Sparkles size={16} />} iconPosition="right">
                  Message Atelier
                </GoldButton>
                <FollowButton className="px-6" />
                <KCButton
                  className="rounded-[18px] border border-white/20 bg-white/5 p-2 text-[var(--kc-cream-100)] hover:bg-white/10"
                  icon={<Share2 size={16} />}
                  aria-label="Share designer profile"
                />
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {statPills.map((pill, index) => {
                  const Icon = pill.icon;
                  return (
                    <motion.div 
                      key={pill.label} 
                      variants={fadeUp} 
                      initial="hidden" 
                      animate="visible" 
                      custom={0.1 + index * 0.05}
                      className="group rounded-[16px] border border-white/5 bg-white/5 p-6 backdrop-blur-sm transition-all duration-150 hover:border-white/10 hover:bg-white/8 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-[var(--kc-gold-200)]/20 bg-[var(--kc-gold-200)]/10 p-2.5">
                          <Icon className="h-5 w-5 text-[var(--kc-gold-200)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--kc-slate-500)]">{pill.label}</p>
                          <p className="mt-1 text-2xl font-semibold text-[var(--kc-cream-100)]">{pill.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {productFocus.length ? (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.15}
                className="rounded-[20px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[var(--kc-cream-100)]">Product Focus</h3>
                  <div className="mt-2 h-0.5 w-12 bg-[var(--kc-gold-200)]/60" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {productFocus.map((item) => (
                    <div
                      key={item.type}
                      className="rounded-[12px] border border-white/5 bg-white/5 px-5 py-4 text-[var(--kc-cream-100)] transition-all duration-150 hover:border-white/10 hover:bg-white/8"
                    >
                      <p className="text-sm font-semibold">{item.type}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--kc-slate-500)]">{item.count} pieces</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.2}>
            <div className="rounded-[20px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-150 hover:border-white/15 hover:bg-white/8 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1">
              <h3 className="text-xl font-semibold text-[var(--kc-cream-100)]">Availability</h3>
              <div className="mt-2 h-0.5 w-12 bg-[var(--kc-gold-200)]/60" />
              <p className="mt-4 text-sm leading-relaxed text-[var(--kc-beige-300)]">
                Browse the designer's portfolio below. Products are available for purchase and ready to ship.
              </p>
              <div className="mt-8 flex flex-col gap-4 text-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-[var(--kc-beige-300)]">Total Products</span>
                  <Badge tone="gold">{designs.length} items</Badge>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-[var(--kc-beige-300)]">Average response</span>
                  <span className="font-semibold text-[var(--kc-cream-100)]">Under 12 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--kc-beige-300)]">Status</span>
                  <Badge tone="gold">Active</Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Designer Story Section */}
      <section className="kc-container mt-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="rounded-[20px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl"
        >
          <div className="mb-6">
            <h2 className="text-3xl font-semibold text-[var(--kc-cream-100)]">Designer Story</h2>
            <div className="mt-3 h-0.5 w-16 bg-[var(--kc-gold-200)]/60" />
          </div>
          <p className="text-base leading-relaxed text-[var(--kc-beige-300)] max-w-3xl">
            {designer.bio ||
              "The Kapda Co. atelier celebrates crafted narratives and sculptural silhouettes, blending artisanal textile work with modern tailoring. Each collection is produced in limited runs with archival documentation and provenance."}
          </p>
        </motion.div>
      </section>

      <section className="kc-container mt-16 grid gap-12 lg:grid-cols-[1.65fr_1fr]">
        <div className="rounded-[20px] border border-white/10 bg-[var(--kc-cream-100)]/95 p-10 backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[var(--kc-navy-900)]">About the Atelier</h2>
            <div className="mt-2 h-0.5 w-12 bg-[var(--kc-gold-200)]/60" />
          </div>
          <div className="space-y-6">
            <p className={cn("text-sm leading-relaxed text-[var(--kc-slate-500)]", !aboutExpanded && "line-clamp-4")}>
              {designer.bio ||
                "The Kapda Co. atelier celebrates crafted narratives and sculptural silhouettes, blending artisanal textile work with modern tailoring. Each collection is produced in limited runs with archival documentation and provenance."}
            </p>
            {designer.bio?.length > 320 ? (
              <button
                type="button"
                onClick={() => setAboutExpanded((prev) => !prev)}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kc-gold-200)] hover:text-[var(--kc-gold-200)]/80 transition-colors duration-150"
              >
                {aboutExpanded ? "Show Less" : "Read More"}
              </button>
            ) : null}
          </div>

          {designer.specialties?.length ? (
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--kc-slate-500)]">Signature Codes</h3>
              <div className="flex flex-wrap gap-2">
                {designer.specialties.map((item) => (
                  <TagChip key={item}>{item}</TagChip>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[12px] border border-white/20 bg-white/60 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--kc-slate-500)]">Experience</p>
              <p className="mt-2 text-sm font-semibold text-[var(--kc-navy-900)]">
                {designer.experience || "7+ years in couture craftsmanship"}
              </p>
            </div>
            <div className="rounded-[12px] border border-white/20 bg-white/60 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--kc-slate-500)]">Materials</p>
              <p className="mt-2 text-sm font-semibold text-[var(--kc-navy-900)]">
                {designer.materials || "Handloom silks, botanical dyes, recycled blends"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--kc-cream-100)]">Metrics</h3>
              <div className="mt-2 h-0.5 w-12 bg-[var(--kc-gold-200)]/60" />
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="flex items-center gap-2 text-[var(--kc-beige-300)]"><Eye size={16} /> Profile views</span>
                <span className="font-semibold text-[var(--kc-cream-100)]">{designer.totalViews ? designer.totalViews.toLocaleString() : "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="flex items-center gap-2 text-[var(--kc-beige-300)]"><Heart size={16} /> Saved looks</span>
                <span className="font-semibold text-[var(--kc-cream-100)]">{designer.totalLikes ? designer.totalLikes.toLocaleString() : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--kc-beige-300)]"><Star size={16} /> Review count</span>
                <span className="font-semibold text-[var(--kc-cream-100)]">{designer.reviewCount ?? reviews.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="kc-container mt-20 space-y-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white">Portfolio Collections</h2>
            <div className="mt-3 h-0.5 w-16 bg-[var(--kc-gold-200)]/60" />
            <p className="mt-4 text-base text-white/70">
              {filteredDesigns.length} designs curated. Browse and add to your capsule.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="designer-tabs-scroll">
              <PillTabs
                tabs={collections.map((value) => ({ label: value === "all" ? "All" : value, value }))}
                activeTab={activeCollection}
                onChange={setActiveCollection}
              />
            </div>
            <KCButton
              variant="ghost"
              className="rounded-[18px] border border-white/15 bg-white/5 px-4 py-2 text-sm text-[var(--kc-cream-100)] hover:bg-white/10"
              onClick={() => setFiltersOpen(true)}
            >
              Refine Products
            </KCButton>
          </div>
          <Link
            to={`/designers/${id}/portfolio`}
            className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--kc-gold-200)] hover:text-[var(--kc-gold-200)]/80 transition-colors duration-150 flex items-center gap-2 mt-2"
          >
            View Full Portfolio
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 designer-profile-products-grid">
          {filteredDesigns.map((design, index) => {
            if (!design) return null;
            const imageUrl = design.imageUrl || design.images?.[0] || design.mainImage || 'https://via.placeholder.com/400x400?text=No+Image';
            const title = design.title || 'Untitled Product';
            return (
              <motion.div
                key={design._id || index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-[16px] border border-white/10 bg-white/5 shadow-lg transition-all duration-150 hover:border-white/15 hover:shadow-xl hover:-translate-y-1"
              >
                <img
                  src={imageUrl}
                  alt={title}
                  className="h-96 w-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
                  <div className="flex items-center justify-between text-sm text-white">
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/70 mt-0.5">
                        {design.productType || design.collection || design.category || "Signature"}
                      </p>
                    </div>
                    {design.price ? (
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                        ₹{Number(design.price || 0).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <TagChip onClick={() => {}}>{design.productType || design.category || "Limited"}</TagChip>
                      {Array.isArray(design.styles) && design.styles.length > 0 && design.styles.slice(0, 1).map((style) => (
                        <TagChip key={style}>{style}</TagChip>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <KCButton
                        variant="ghost"
                        className="border border-white/20 bg-white/10 p-2 text-white transition-colors duration-150 hover:bg-white/20 hover:text-[var(--kc-gold-200)]"
                        icon={<Heart size={16} />}
                        aria-label="Favourite"
                      />
                      <KCButton
                        variant="ghost"
                        className="border border-white/20 bg-white/10 p-2 text-white transition-colors duration-150 hover:bg-white/20 hover:text-[var(--kc-gold-200)]"
                        icon={<Eye size={16} />}
                        aria-label="Quick view"
                      />
                      {(design.isPurchasable !== false && design.status === 'published') ? (
                        <KCButton
                          variant="ghost"
                          onClick={() => handleAddToCart(design)}
                          className="border border-white/20 bg-white/10 p-2 text-white transition-colors duration-150 hover:bg-white/20 hover:text-[var(--kc-gold-200)]"
                          icon={<ShoppingBag size={16} />}
                          aria-label="Add to cart"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="kc-container mt-20 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
          <div className="mb-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--kc-cream-100)]">Client Impressions</h2>
                <div className="mt-2 h-0.5 w-12 bg-[var(--kc-gold-200)]/60" />
                <p className="mt-4 text-sm text-[var(--kc-beige-300)]">
                  {ratingSummary.total > 0 ? `${ratingSummary.total} verified collectors shared their experience.` : "No reviews yet."}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--kc-gold-200)]/30 bg-[var(--kc-gold-200)]/10 px-4 py-3 text-right">
                <span className="text-3xl font-semibold text-[var(--kc-gold-200)]">
                  {ratingSummary.average.toFixed(1)}
                </span>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--kc-slate-500)] mt-1">Average</p>
              </div>
            </div>
          </div>
          {ratingSummary.total > 0 ? (
            <div className="space-y-3 mb-8">
              {ratingSummary.histogram.map((item) => {
                const percentage = ratingSummary.total ? (item.count / ratingSummary.total) * 100 : 0;
                return (
                  <div key={item.star} className="flex items-center gap-4 text-xs">
                    <span className="w-8 text-[var(--kc-slate-500)]">{item.star}★</span>
                    <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                      {percentage > 0 ? (
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--kc-gold-200)]/60 to-[var(--kc-gold-200)] transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      ) : (
                        <div className="h-full w-full bg-white/5" />
                      )}
                    </div>
                    <span className="w-8 text-right text-[var(--kc-beige-300)]">{item.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mb-8 py-8 text-center">
              <Star className="h-12 w-12 mx-auto text-[var(--kc-slate-500)]/30 mb-4" />
              <p className="text-sm text-[var(--kc-beige-300)]/60">No reviews yet. Be the first to review!</p>
            </div>
          )}
          <ReviewList reviews={reviews} />
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-[var(--kc-cream-100)]">Policies</h3>
            <div className="mt-2 h-0.5 w-12 bg-[var(--kc-gold-200)]/60" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {policies.map((policy, index) => {
              const Icon = policy.type === "Shipping" ? Package : RotateCcw;
              return (
                <div key={index} className="rounded-[12px] border border-white/5 bg-white/5 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border border-[var(--kc-gold-200)]/20 bg-[var(--kc-gold-200)]/10 p-2 shrink-0">
                      <Icon className="h-4 w-4 text-[var(--kc-gold-200)]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[var(--kc-cream-100)] mb-1">{policy.type}</h4>
                      <p className="text-xs leading-relaxed text-[var(--kc-beige-300)]">{policy.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <FilterDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">Product Type</h4>
            <div className="flex flex-wrap gap-2">
              {["all", ...portfolioFacets.product].map((value) => (
                <TagChip
                  key={value}
                  active={portfolioFilters.product === value}
                  onClick={() => handleFilterChange("product", value)}
                >
                  {value === "all" ? "All" : value}
                </TagChip>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">Style Codes</h4>
            <div className="flex flex-wrap gap-2">
              {["all", ...portfolioFacets.style].map((value) => (
                <TagChip
                  key={value}
                  active={portfolioFilters.style === value}
                  onClick={() => handleFilterChange("style", value)}
                >
                  {value === "all" ? "All" : value}
                </TagChip>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">Color Stories</h4>
            <div className="flex flex-wrap gap-2">
              {["all", ...portfolioFacets.color].map((value) => (
                <TagChip
                  key={value}
                  active={portfolioFilters.color === value}
                  onClick={() => handleFilterChange("color", value)}
                >
                  {value === "all" ? "All" : value}
                </TagChip>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">Investment</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All" },
                { value: "access", label: "Ready-to-Wear" },
                { value: "atelier", label: "Atelier" },
                { value: "couture", label: "Couture" },
              ].map((option) => (
                <TagChip
                  key={option.value}
                  active={portfolioFilters.price === option.value}
                  onClick={() => handleFilterChange("price", option.value)}
                >
                  {option.label}
                </TagChip>
              ))}
            </div>
          </div>

          <GoldButton className="w-full" onClick={() => setFiltersOpen(false)}>
            Apply Filters
          </GoldButton>
        </div>
      </FilterDrawer>

    </div>
  );
};

export default DesignerProfile;