import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Filter,
  Globe2,
  Loader2,
  MapPin,
  Palette,
  Search,
  Sparkles,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { KCButton, KCInput, KCAlert } from "../../components/ui";
import {
  DesignerCard,
  StatPill,
  TagChip,
  GoldButton,
  FilterDrawer,
  PillTabs,
  Pagination,
  ModalSheet,
  Badge,
} from "../../components/designers";
import "../../styles/designer.css";

const backgroundNoise =
  "url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 400 400\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'n\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'1.2\\' numOctaves=\\'2\\' stitchTiles=\\'stitch\\'/%3E%3CfeColorMatrix type=\\'saturate\\' values=\\'0\\'/%3E%3C/filter%3E%3Crect width=\\'400\\' height=\\'400\\' filter=\\'url(%23n)\\' opacity=\\'0.05\\'/%3E%3C/svg%3E')";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

const DesignerList = () => {
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("trending");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [commissionModal, setCommissionModal] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveSearchTerm(searchTerm.trim());
      setPage(1);
      setDesigners([]);
    }, 420);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    fetchDesigners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeSearchTerm, sortBy]);

  const fetchDesigners = async () => {
    try {
      setLoading(true);
      setError("");

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort: sortBy,
        ...(activeSearchTerm && { search: activeSearchTerm }),
      });

      const response = await fetch(`/api/public/designers?${queryParams}`);

      let data;

      if (!response.ok) {
        // Graceful fallback for local/dev when API is not available (500, 404, etc.)
        console.warn(
          "Designer API returned an error status, using fallback designers instead:",
          response.status
        );

        const fallbackDesigners = [
          {
            id: "fallback-1",
            designerName: "Aarya Mehra",
            username: "@aaryamehra",
            city: "Mumbai",
            country: "India",
            specialties: ["Contemporary Saris", "Eveningwear"],
            productTypes: ["Saris", "Dresses"],
            bio: "Modern silhouettes rooted in Indian craft and textile stories.",
            followers: 12800,
            collections: 42,
            rating: 4.9,
          },
          {
            id: "fallback-2",
            designerName: "Noah Klein",
            username: "@atelierklein",
            city: "Berlin",
            country: "Germany",
            specialties: ["Minimal Tailoring", "Outerwear"],
            productTypes: ["Coats", "Blazers"],
            bio: "Architectural tailoring with a focus on clean lines and longevity.",
            followers: 7200,
            collections: 18,
            rating: 4.8,
          },
          {
            id: "fallback-3",
            designerName: "Lina Ortega",
            username: "@linaortega",
            city: "Barcelona",
            country: "Spain",
            specialties: ["Resortwear", "Art Prints"],
            productTypes: ["Kaftans", "Resort Sets"],
            bio: "Sun-drenched color stories inspired by Mediterranean summers.",
            followers: 9600,
            collections: 25,
            rating: 4.7,
          },
        ];

        data = {
          designers: fallbackDesigners,
          pagination: { hasNext: false },
        };
      } else {
        data = await response.json();
      }

      if (page === 1) {
        setDesigners(data.designers || []);
      } else {
        setDesigners((prev) => [...prev, ...(data.designers || [])]);
      }

      setHasMore(data.pagination?.hasNext || false);
    } catch (err) {
      console.error("Failed to fetch designers:", err);
      setError("We couldn’t load designers right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const highlightMetrics = useMemo(() => {
    const designerCount = designers.length ? `${Math.max(designers.length, 150)}+` : "150+";
    return [
      {
        label: "Talented Designers",
        value: designerCount,
        icon: Users,
      },
      {
        label: "Unique Collections",
        value: "10K+",
        icon: Palette,
      },
      {
        label: "Happy Clients",
        value: "50K+",
        icon: Sparkles,
      },
    ];
  }, [designers.length]);

  const benefits = [
    {
      icon: Sparkles,
      text: "Earn 70% commission on every sale",
    },
    {
      icon: Globe2,
      text: "Reach thousands of collectors worldwide",
    },
    {
      icon: Sparkles,
      text: "Dedicated marketing and platform support",
    },
  ];

  const isInitialLoading = loading && page === 1;
  const isEmpty = !loading && (!Array.isArray(designers) || designers.length === 0);
  const showErrorState = error && (!Array.isArray(designers) || designers.length === 0);

  const normalizedDesigners = useMemo(
    () => {
      if (!Array.isArray(designers)) return [];
      return designers
        .filter(designer => designer && typeof designer === 'object')
        .map((designer) => {
          const title = designer.designerName || designer.name || "Designer";
        const handle = designer.username || designer.handle || designer.slug;
        const location = [designer.city, designer.country, designer.location]
          .filter(Boolean)
          .join(", ");
        const styles = designer.specialties || designer.tags || [];
        const rawProducts =
          designer.productTypes ||
          designer.productFocus ||
          designer.products ||
          designer.catalogueTypes ||
          designer.categories;
        let products = Array.isArray(rawProducts)
          ? rawProducts
          : typeof rawProducts === "string"
          ? rawProducts.split(",").map((item) => item.trim())
          : [];
        if (!products.length && Array.isArray(designer.specialties)) {
          const apparelKeywords = ["tee", "t-shirt", "hoodie", "sweatshirt", "crew", "tote", "cap", "jogger", "jacket"];
          products = designer.specialties.filter((item) =>
            apparelKeywords.some((keyword) => item.toLowerCase().includes(keyword)),
          );
        }
        if (!products.length && designer.catalogue?.length) {
          products = designer.catalogue
            .map((item) => item.productType || item.category)
            .filter(Boolean)
            .slice(0, 4);
        }
        if (!products.length) {
          products = ["T-Shirts", "Hoodies", "Tote Bags"];
        }
        const metrics = {
          followers: designer.followerCount ?? designer.followers ?? "—",
          pieces: designer.productCount ?? designer.collectionCount ?? "—",
          rating: designer.rating ?? designer.averageRating ?? 0,
        };

        return {
          id: designer._id ?? designer.id ?? title,
          title,
          handle,
          location,
          avatar: designer.avatarUrl || designer.profileImage || designer.photo,
          bio: designer.bio || designer.about,
          styles,
          products,
          metrics,
          verified: Boolean(designer.isVerified || designer.verified),
          openForCommissions: Boolean(designer.openForCommissions || designer.acceptsCommissions),
          raw: designer,
        };
      });
    },
    [designers],
  );

  const availableStyles = useMemo(() => {
    const set = new Set();
    normalizedDesigners.forEach((designer) => {
      designer.styles?.forEach((style) => set.add(style));
    });
    return Array.from(set).slice(0, 12);
  }, [normalizedDesigners]);

  const availableLocations = useMemo(() => {
    const set = new Set();
    normalizedDesigners.forEach((designer) => {
      if (designer.location) {
        set.add(designer.location);
      }
    });
    return Array.from(set).slice(0, 12);
  }, [normalizedDesigners]);

  const availableAesthetics = useMemo(() => {
    const aesthetics = ['Minimalist', 'Vintage', 'Streetwear', 'Bohemian', 'Contemporary', 'Artisanal', 'Luxury', 'Sustainable'];
    return aesthetics;
  }, []);

  const availableCategories = useMemo(() => {
    const categories = ['T-Shirts', 'Hoodies', 'Tote Bags', 'Caps', 'Accessories', 'Apparel'];
    return categories;
  }, []);

  const filteredDesigners = useMemo(() => {
    const search = activeSearchTerm.toLowerCase();
    let list = normalizedDesigners.filter((designer) => {
      if (!search) return true;
      return (
        designer.title.toLowerCase().includes(search) ||
        designer.handle?.toLowerCase().includes(search) ||
        designer.location?.toLowerCase().includes(search) ||
        designer.styles?.some((style) => style.toLowerCase().includes(search))
      );
    });

    if (activeFilters.length) {
      list = list.filter((designer) => {
        return activeFilters.every((filter) => {
          if (filter.type === "style") {
            return designer.styles?.some((style) => style === filter.value);
          }
          if (filter.type === "location" || filter.type === "region") {
            return designer.location === filter.value;
          }
          if (filter.type === "commission") {
            return designer.openForCommissions;
          }
          if (filter.type === "verified") {
            return designer.verified;
          }
          if (filter.type === "aesthetic") {
            // Match aesthetic based on styles or bio keywords
            const aestheticKeywords = {
              'Minimalist': ['minimal', 'clean', 'simple'],
              'Vintage': ['vintage', 'retro', 'classic'],
              'Streetwear': ['street', 'urban', 'casual'],
              'Bohemian': ['boho', 'bohemian', 'free'],
              'Contemporary': ['contemporary', 'modern', 'current'],
              'Artisanal': ['artisan', 'handmade', 'craft'],
              'Luxury': ['luxury', 'premium', 'exclusive'],
              'Sustainable': ['sustainable', 'eco', 'green']
            };
            const keywords = aestheticKeywords[filter.value] || [];
            const bioText = (designer.bio || '').toLowerCase();
            const styleText = (designer.styles || []).join(' ').toLowerCase();
            return keywords.some(keyword => bioText.includes(keyword) || styleText.includes(keyword));
          }
          if (filter.type === "category") {
            return designer.products?.some(product => 
              product.toLowerCase().includes(filter.value.toLowerCase())
            );
          }
          return true;
        });
      });
    }

    const sorted = [...list];
    if (sortBy === "topRated") {
      sorted.sort((a, b) => (b.metrics.rating ?? 0) - (a.metrics.rating ?? 0));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.raw?.createdAt || 0) - new Date(a.raw?.createdAt || 0));
    } else {
      // trending fallback to followers
      sorted.sort((a, b) => (b.metrics.followers ?? 0) - (a.metrics.followers ?? 0));
    }
    return sorted;
  }, [normalizedDesigners, activeSearchTerm, activeFilters, sortBy]);

  // Featured designers (top rated)
  const featuredDesigners = useMemo(() => {
    if (!Array.isArray(filteredDesigners) || filteredDesigners.length === 0) return [];
    return [...filteredDesigners]
      .sort((a, b) => (b.metrics?.rating ?? 0) - (a.metrics?.rating ?? 0))
      .slice(0, 3);
  }, [filteredDesigners]);

  // Emerging designers (newest with good ratings)
  const emergingDesigners = useMemo(() => {
    if (!Array.isArray(filteredDesigners) || filteredDesigners.length === 0) return [];
    return [...filteredDesigners]
      .filter(d => {
        if (!d || !d.raw) return false;
        const createdAt = new Date(d.raw.createdAt || 0);
        const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreation < 90 && (d.metrics?.rating ?? 0) >= 4.0;
      })
      .sort((a, b) => new Date(b.raw?.createdAt || 0) - new Date(a.raw?.createdAt || 0))
      .slice(0, 3);
  }, [filteredDesigners]);

  // Designer of the Month (highest rated with most followers)
  const designerOfTheMonth = useMemo(() => {
    if (!Array.isArray(filteredDesigners) || filteredDesigners.length === 0) return null;
    return [...filteredDesigners]
      .sort((a, b) => {
        const scoreA = (a.metrics?.rating ?? 0) * 0.6 + (Number(a.metrics?.followers) || 0) * 0.4;
        const scoreB = (b.metrics?.rating ?? 0) * 0.6 + (Number(b.metrics?.followers) || 0) * 0.4;
        return scoreB - scoreA;
      })[0];
  }, [filteredDesigners]);

  const atelierStories = useMemo(() => {
    if (!Array.isArray(filteredDesigners) || filteredDesigners.length === 0) return [];
    return filteredDesigners.slice(0, 4).map(designer => ({
      designer: designer?.title || 'Designer',
      story: designer?.bio || `Crafting ${designer?.products?.[0] || 'unique pieces'} with heritage techniques and modern vision.`,
      location: designer?.location || ''
    }));
  }, [filteredDesigners]);

  const toggleFilter = (filter) => {
    setActiveFilters((prev) => {
      const exists = prev.some((active) => active.type === filter.type && active.value === filter.value);
      if (exists) {
        return prev.filter((active) => !(active.type === filter.type && active.value === filter.value));
      }
      return [...prev, filter];
    });
    setPage(1);
  };

  const removeFilter = (filter) => {
    setActiveFilters((prev) => prev.filter((active) => !(active.type === filter.type && active.value === filter.value)));
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setFiltersOpen(false);
  };

  const sortTabs = useMemo(
    () => [
      { label: "Trending", value: "trending", icon: TrendingUp },
      { label: "Top Rated", value: "topRated", icon: Star },
      { label: "Newest", value: "newest", icon: Zap },
    ],
    [],
  );

  const activePageCount = hasMore ? page + 1 : page;

  return (
    <div className="min-h-screen bg-[var(--kc-navy-900)] pb-32 text-[var(--kc-cream-100)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#050814_0%,#0a1426_55%,#101a32_100%)]" />
        <div className="absolute inset-0 opacity-45" style={{ backgroundImage: backgroundNoise }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(211,167,95,0.25),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.4)_0%,transparent_70%)]" />
        <div className="kc-container relative z-10 flex flex-col items-center gap-8 py-32 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-medium uppercase tracking-[0.28em] text-[var(--kc-beige-300)]"
          >
            Designer Marketplace
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl text-5xl font-semibold tracking-[-0.02em] leading-tight text-[var(--kc-cream-100)] md:text-[4rem]"
          >
            Meet the Visionaries Behind Kapda Co.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--kc-beige-300)]">
              Discover couture-level creativity, curated edits, and limited collections from designers who redefine wardrobes across the globe.
            </p>
            <div className="mx-auto h-0.5 w-20 bg-[var(--kc-gold-200)]/60" />
            <p className="max-w-xl text-sm text-[var(--kc-slate-500)]">
              Search by artist, style, or region and curate your next collaboration.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="kc-container relative z-20 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[24px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-10"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative flex flex-1 items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm transition-all duration-150 focus-within:border-[var(--kc-gold-200)]/30 focus-within:bg-white/8 focus-within:shadow-[0_0_20px_rgba(211,167,95,0.15)]">
              <Search className="h-5 w-5 text-[var(--kc-slate-500)] shrink-0" />
              <KCInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by designer name, style, location, or specialty..."
                className="flex-1 border-none bg-transparent text-[var(--kc-cream-100)] placeholder:text-[var(--kc-slate-500)]/60 focus:border-none focus:bg-transparent focus:outline-none focus:ring-0"
              />
              <KCButton
                onClick={() => {
                  setActiveSearchTerm(searchTerm.trim());
                  setPage(1);
                  setDesigners([]);
                }}
                className="rounded-[16px] bg-gradient-to-r from-[var(--kc-gold)] to-[var(--kc-gold-300)] px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] shadow-lg shadow-[var(--kc-gold)]/20 transition-all hover:shadow-xl hover:shadow-[var(--kc-gold)]/30 hover:scale-[1.02]"
                style={{ color: 'var(--kc-navy-900)', transitionDuration: 'var(--kc-duration-sm)' }}
                icon={<ArrowRight size={16} />}
                iconPosition="right"
              >
                Search
              </KCButton>
            </div>
            <KCButton
              variant="secondary"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 rounded-[20px] border border-white/15 bg-white/5 px-6 py-4 text-sm font-semibold text-[var(--kc-cream-100)] transition-all duration-150 hover:bg-white/10 hover:border-white/20"
              icon={<Filter size={18} />}
            >
              Filters
              {activeFilters.length ? (
                <span className="rounded-full bg-[var(--kc-gold-200)]/20 border border-[var(--kc-gold-200)]/30 px-2.5 py-1 text-xs font-semibold text-[var(--kc-gold-200)]">{activeFilters.length}</span>
              ) : null}
            </KCButton>
          </div>

          {activeFilters.length ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {activeFilters.map((filter) => (
                <TagChip key={`${filter.type}-${filter.value}`} active onClick={() => removeFilter(filter)}>
                  {filter.label}
                </TagChip>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--kc-slate-500)] transition-all duration-150 hover:bg-white/10 hover:text-[var(--kc-cream-100)]"
              >
                Clear All
              </button>
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {highlightMetrics.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-white/5 to-white/2 p-6 backdrop-blur-sm transition-all duration-150 hover:border-white/15 hover:bg-white/8 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl border border-[var(--kc-gold-200)]/30 bg-gradient-to-br from-[var(--kc-gold-200)]/20 to-[var(--kc-gold-200)]/10 p-4 shadow-lg shadow-[var(--kc-gold-200)]/10">
                    <Icon className="h-7 w-7 text-[var(--kc-gold-200)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--kc-slate-500)]">{label}</p>
                    <p className="mt-1 text-3xl font-serif font-semibold text-[var(--kc-cream-100)]">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Featured Collectives Section */}
      {featuredDesigners.length > 0 && (
        <section className="kc-container mt-20">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-[var(--kc-cream-100)]">Featured Collectives</h2>
            <div className="mt-3 h-0.5 w-16 bg-[var(--kc-gold-200)]/60" />
            <p className="mt-4 text-sm text-[var(--kc-beige-300)]">Celebrated designers setting new standards in craftsmanship</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDesigners.map((designer, index) => (
              <motion.div
                key={designer.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/2 p-8 backdrop-blur-xl transition-all duration-150 hover:border-[var(--kc-gold-200)]/30 hover:shadow-xl hover:shadow-[var(--kc-gold-200)]/10 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--kc-gold-200)]/5 to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                <div className="relative flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--kc-gold-200)]/50 bg-white/5" />
                    {designer.avatar ? (
                      <img src={designer.avatar} alt={designer.title} className="relative z-10 h-full w-full rounded-full object-cover" />
                    ) : (
                      <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full text-2xl font-semibold text-[var(--kc-gold)]" style={{ backgroundColor: 'var(--kc-surface-dark)' }}>
                        {designer.title?.charAt(0) || "K"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[var(--kc-cream-100)]">{designer.title}</h3>
                    <p className="text-xs text-[var(--kc-gold-200)] mt-0.5">@{designer.handle}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-[var(--kc-gold-200)] fill-[var(--kc-gold-200)]" />
                      <span className="text-sm font-medium text-[var(--kc-cream-100)]">
                        {typeof designer.metrics?.rating === 'number' ? designer.metrics.rating.toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--kc-beige-300)]">{designer.bio || "Renowned for exceptional craftsmanship and innovative design."}</p>
                <GoldButton
                  className="mt-6 w-full"
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                  onClick={() => navigate(`/designers/${designer.raw?.slug || designer.raw?._id || ""}`)}
                >
                  View Profile
                </GoldButton>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Designer of the Month */}
      {designerOfTheMonth && (
        <section className="kc-container mt-20">
          <div className="relative overflow-hidden rounded-[28px] border border-[var(--kc-gold-200)]/30 bg-gradient-to-br from-[var(--kc-gold-200)]/10 via-white/5 to-white/5 p-10 backdrop-blur-xl shadow-[0_30px_100px_rgba(211,167,95,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--kc-gold-200)]/5 to-transparent" />
            <div className="relative grid gap-8 lg:grid-cols-[200px_1fr] lg:items-center">
              <div className="flex justify-center lg:justify-start">
                <div className="relative h-32 w-32">
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--kc-gold-200)]/60 bg-white/10" />
                  {designerOfTheMonth.avatar ? (
                    <img src={designerOfTheMonth.avatar} alt={designerOfTheMonth.title} className="relative z-10 h-full w-full rounded-full object-cover" />
                  ) : (
                    <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-[#111826] text-4xl font-semibold text-[var(--kc-gold-200)]">
                      {designerOfTheMonth.title?.charAt(0) || "K"}
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 rounded-full border-2 border-[var(--kc-gold-200)] bg-[var(--kc-gold-200)] p-2">
                    <Award className="h-5 w-5" style={{ color: 'var(--kc-navy-900)' }} />
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <Badge tone="gold" className="border-[var(--kc-gold-200)]/30 bg-[var(--kc-gold-200)]/20 text-[var(--kc-gold-200)]">
                    Designer of the Month
                  </Badge>
                </div>
                <h2 className="text-3xl font-semibold text-[var(--kc-cream-100)]">{designerOfTheMonth.title}</h2>
                <p className="text-base text-[var(--kc-gold-200)] mt-1">@{designerOfTheMonth.handle}</p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--kc-beige-300)] max-w-2xl">
                  {designerOfTheMonth.bio || "Recognized for exceptional creativity and outstanding contributions to contemporary fashion."}
                </p>
                <GoldButton
                  className="mt-6"
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                  onClick={() => navigate(`/designers/${designerOfTheMonth.raw?.slug || designerOfTheMonth.raw?._id || ""}`)}
                >
                  Explore Collection
                </GoldButton>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Emerging Designers Spotlight */}
      {emergingDesigners.length > 0 && (
        <section className="kc-container mt-20">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-[var(--kc-cream-100)]">Emerging Designers Spotlight</h2>
            <div className="mt-3 h-0.5 w-16 bg-[var(--kc-gold-200)]/60" />
            <p className="mt-4 text-sm text-[var(--kc-beige-300)]">Rising talents making their mark in the fashion world</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {emergingDesigners.map((designer, index) => (
              <motion.div
                key={designer.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-150 hover:border-white/15 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--kc-gold-200)]/30 bg-white/5" />
                    {designer.avatar ? (
                      <img src={designer.avatar} alt={designer.title} className="relative z-10 h-full w-full rounded-full object-cover transition-transform duration-150 group-hover:scale-105" />
                    ) : (
                      <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full text-2xl font-semibold text-[var(--kc-gold)]" style={{ backgroundColor: 'var(--kc-surface-dark)' }}>
                        {designer.title?.charAt(0) || "K"}
                      </div>
                    )}
                    <Zap className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white/10 bg-[var(--kc-gold-200)]/20 p-1 text-[var(--kc-gold-200)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[var(--kc-cream-100)]">{designer.title}</h3>
                    <p className="text-xs text-[var(--kc-slate-500)] mt-0.5">{designer.location}</p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--kc-beige-300)]">{designer.bio || "A fresh perspective on contemporary design."}</p>
                <KCButton
                  className="mt-6 w-full rounded-[16px] border border-white/15 bg-white/5 text-sm font-semibold text-[var(--kc-cream-100)] transition-all duration-150 hover:bg-white/10 hover:border-white/20"
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                  onClick={() => navigate(`/designers/${designer.raw?.slug || designer.raw?._id || ""}`)}
                >
                  Discover
                </KCButton>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Atelier Stories */}
      {atelierStories.length > 0 && (
        <section className="kc-container mt-20">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-[var(--kc-cream-100)]">Atelier Stories</h2>
            <div className="mt-3 h-0.5 w-16 bg-[var(--kc-gold-200)]/60" />
            <p className="mt-4 text-sm text-[var(--kc-beige-300)]">Brief narratives from our creative community</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {atelierStories.map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-150 hover:border-white/15 hover:bg-white/8 hover:shadow-lg"
              >
                <h4 className="text-lg font-semibold text-[var(--kc-cream-100)] mb-2">{story.designer}</h4>
                <p className="text-sm leading-relaxed text-[var(--kc-beige-300)] line-clamp-3">{story.story}</p>
                {story.location && (
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--kc-slate-500)] flex items-center gap-1">
                    <MapPin size={12} />
                    {story.location}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="kc-container py-16 text-[var(--kc-cream-100)]">
        {isInitialLoading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-[var(--kc-beige-300)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/15 border-t-[var(--kc-gold-1)]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <p className="text-sm font-medium tracking-[0.28em] uppercase">Curating the latest designer lineup…</p>
          </div>
        ) : showErrorState ? (
          <KCAlert variant="danger" className="mx-auto max-w-xl text-center">
            <KCAlert variant="danger" className="text-sm text-[var(--kc-ink)]">
              {error}
            </KCAlert>
            <div className="mt-4 flex justify-center">
              <GoldButton onClick={fetchDesigners} icon={<ArrowRight size={16} />} iconPosition="right">
                Try Again
              </GoldButton>
            </div>
          </KCAlert>
        ) : isEmpty ? (
          <KCAlert variant="info" className="mx-auto max-w-xl text-center text-sm">
            We couldn’t match that request. Try adjusting your filters or exploring popular creators below.
          </KCAlert>
        ) : (
          <>
          <div className="mb-12 flex flex-col gap-8">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--kc-slate-500)]">
                    {filteredDesigners.length} Designers curated
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 designer-sort-tabs">
                  {sortTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setSortBy(tab.value)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-150 ${
                          sortBy === tab.value
                            ? "border-[var(--kc-gold-200)]/50 bg-[var(--kc-gold-200)]/20 text-[var(--kc-gold-200)] shadow-lg shadow-[var(--kc-gold-200)]/10"
                            : "border-white/15 bg-white/5 text-[var(--kc-beige-300)] hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 designer-list-grid">
                {filteredDesigners.map((designer, index) => (
                  <motion.div
                    key={designer.id}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    custom={index % 6}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/2 backdrop-blur-xl transition-all duration-150 hover:border-[var(--kc-gold-200)]/30 hover:shadow-xl hover:shadow-[var(--kc-gold-200)]/10 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--kc-gold-200)]/5 to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                      <div className="relative">
                        <DesignerCard
                          avatar={designer.avatar}
                          name={designer.title}
                          handle={designer.handle}
                          location={designer.location}
                          bio={designer.bio}
                          styles={designer.styles?.slice(0, 4) || []}
                          products={designer.products || []}
                          metrics={designer.metrics || {}}
                          verified={designer.verified}
                          openForCommissions={designer.openForCommissions}
                          badges={designer.verified ? [{ label: "Verified", tone: "gold", icon: Sparkles }] : []}
                          onViewProfile={() => navigate(`/designers/${designer.raw?.slug || designer.raw?._id || ""}`)}
                          onCommission={() => setCommissionModal(designer)}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {hasMore ? (
              <div className="flex justify-center">
                <Pagination
                  page={page}
                  pageCount={activePageCount}
                  onPageChange={(nextPage) => {
                    if (nextPage > page) {
                      loadMore();
                    } else {
                      setPage(nextPage);
                    }
                  }}
                  isLoading={loading}
                />
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="kc-container mt-24">
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--kc-gold-200)]/20 bg-gradient-to-br from-white/5 via-white/5 to-white/2 p-[1px] shadow-[0_40px_120px_rgba(211,167,95,0.2)]">
          <div className="relative rounded-[28px] border border-white/10 bg-white/5 px-8 py-12 backdrop-blur-xl md:px-12 md:py-16">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--kc-gold-200)]/5 to-transparent opacity-50" />
            <div className="relative grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-center">
              <div className="space-y-6">
                <div>
                  <p className="inline-block rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium uppercase tracking-[0.2em] text-[var(--kc-beige-300)]">
                    Join the Collective
                  </p>
                  <div className="mt-3 h-0.5 w-16 bg-[var(--kc-gold-200)]/60" />
                </div>
                <h2 className="text-3xl font-semibold tracking-[-0.02em] leading-tight md:text-[2.8rem]">
                  Are you a designer looking to scale your craft?
                </h2>
                <p className="text-base leading-relaxed text-[var(--kc-beige-300)]">
                  Partner with Kapda Co. to access high-intent shoppers, premium production, and a global audience that values craftsmanship and provenance.
                </p>
                <div className="grid gap-4">
                  {benefits.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-4 text-sm text-[var(--kc-cream-100)]">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--kc-gold-200)]/30 bg-gradient-to-br from-[var(--kc-gold-200)]/20 to-[var(--kc-gold-200)]/10 text-[var(--kc-gold-200)] shadow-lg shadow-[var(--kc-gold-200)]/10">
                        <Icon size={18} />
                      </span>
                      <span className="leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-[16px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-[var(--kc-gold-200)] fill-[var(--kc-gold-200)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[var(--kc-cream-100)]">"Kapda Co. transformed my independent studio into a global brand."</p>
                      <p className="mt-2 text-xs text-[var(--kc-slate-500)]">— Priya Sharma, Featured Designer</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-6">
                <div className="relative w-full">
                  <div className="absolute inset-0 rounded-[20px] bg-gradient-to-r from-[var(--kc-gold)]/20 to-[var(--kc-gold-300)]/20 blur-xl" />
                  <GoldButton
                    as={Link}
                    to="/designer/signup"
                    icon={<ArrowRight size={18} />}
                    iconPosition="right"
                    className="relative w-full justify-center px-10 py-5 text-base shadow-xl shadow-[var(--kc-gold-200)]/30 transition-all duration-150 hover:scale-[1.02]"
                  >
                    Become a Designer
                  </GoldButton>
                </div>
                <Link 
                  to="/designer/login" 
                  className="text-sm font-semibold text-[var(--kc-beige-300)] transition-colors duration-150 hover:text-[var(--kc-gold-200)]"
                >
                  Already with us? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FilterDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              <Sparkles size={16} className="text-[var(--kc-gold-200)]" />
              Commission Availability
            </h4>
            <TagChip
              active={activeFilters.some((filter) => filter.type === "commission")}
              onClick={() => toggleFilter({ type: "commission", value: true, label: "Commissions Open" })}
            >
              Commissions Open
            </TagChip>
          </div>

          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              <Award size={16} className="text-[var(--kc-gold-200)]" />
              Verified Creators
            </h4>
            <TagChip
              active={activeFilters.some((filter) => filter.type === "verified")}
              onClick={() => toggleFilter({ type: "verified", value: true, label: "Verified" })}
            >
              Verified Only
            </TagChip>
          </div>

          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              <Palette size={16} className="text-[var(--kc-gold-200)]" />
              Aesthetic
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableAesthetics.map((aesthetic) => (
                <TagChip
                  key={aesthetic}
                  active={activeFilters.some((filter) => filter.type === "aesthetic" && filter.value === aesthetic)}
                  onClick={() => toggleFilter({ type: "aesthetic", value: aesthetic, label: aesthetic })}
                >
                  {aesthetic}
                </TagChip>
              ))}
            </div>
          </div>

          {availableStyles.length ? (
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                <Sparkles size={16} className="text-[var(--kc-gold-200)]" />
                Styles
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableStyles.map((style) => (
                  <TagChip
                    key={style}
                    active={activeFilters.some((filter) => filter.type === "style" && filter.value === style)}
                    onClick={() => toggleFilter({ type: "style", value: style, label: style })}
                  >
                    {style}
                  </TagChip>
                ))}
              </div>
            </div>
          ) : null}

          {availableLocations.length ? (
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                <MapPin size={16} className="text-[var(--kc-gold-200)]" />
                Region
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableLocations.map((location) => (
                  <TagChip
                    key={location}
                    active={activeFilters.some((filter) => (filter.type === "location" || filter.type === "region") && filter.value === location)}
                    onClick={() => toggleFilter({ type: "region", value: location, label: location })}
                  >
                    {location}
                  </TagChip>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              <ShoppingBag size={16} className="text-[var(--kc-gold-200)]" />
              Category
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <TagChip
                  key={category}
                  active={activeFilters.some((filter) => filter.type === "category" && filter.value === category)}
                  onClick={() => toggleFilter({ type: "category", value: category, label: category })}
                >
                  {category}
                </TagChip>
              ))}
            </div>
          </div>

          <GoldButton onClick={clearFilters} className="w-full border-white/20 bg-white/10 text-white transition-all duration-150 hover:bg-white/15">
            Reset Filters
          </GoldButton>
        </div>
      </FilterDrawer>

      <ModalSheet
        open={Boolean(commissionModal)}
        onClose={() => setCommissionModal(null)}
        title="Commission Request"
        description="Share your brief and timeline. The designer will respond within 24 hours."
        actions={[
          <KCButton key="close" variant="ghost" onClick={() => setCommissionModal(null)} className="border border-white/12 bg-white/8 text-white/80">
            Cancel
          </KCButton>,
          <GoldButton key="submit" icon={<ArrowRight size={16} />} iconPosition="right">
            Submit Brief
          </GoldButton>,
        ]}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.28em] text-white/60">Project Title</label>
            <KCInput placeholder="E.g. Heritage capsule for AW25" className="border-white/15 bg-white/6 text-white placeholder:text-white/40" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.28em] text-white/60">Budget</label>
            <KCInput placeholder="₹" className="border-white/15 bg-white/6 text-white placeholder:text-white/40" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.28em] text-white/60">Creative Brief</label>
          <textarea
            rows={4}
            className="w-full rounded-[var(--kc-radius)] border border-white/15 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--kc-gold-1)]"
            placeholder="Describe the silhouette, materials, and any heritage inspiration."
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.28em] text-white/60">Reference Links</label>
          <KCInput placeholder="https://" className="border-white/15 bg-white/6 text-white placeholder:text-white/40" />
        </div>
      </ModalSheet>
    </div>
  );
};

export default DesignerList;