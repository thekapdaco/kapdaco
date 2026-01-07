import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import heroImage from '../assets/hero2.png';
import model1 from '../assets/model1.png';
import model2 from '../assets/model2.png';
import model3 from '../assets/model3.png';
import ProductCard from '../components/ProductCard';
import { KCButton, KCCard, KCCardHeader, GridSkeleton, ProductCardSkeleton } from '../components/ui';
import SEO from '../components/SEO';
import { ANIMATION_DURATIONS, ANIMATION_EASE, ANIMATION_EASE_OUT } from '../lib/animationConstants';
import { getCachedProducts, setCachedProducts } from '../lib/productCache';
import { getOrganizationJsonLd, getWebsiteJsonLd } from '../lib/seoHelpers';
import '../styles/home-responsive.css';
import {
  Users,
  PackageCheck,
  Heart,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  Quote,
  ArrowRight,
  ShoppingBag,
  TrendingUp,
  Star,
  Lock,
  RotateCcw,
  Headphones,
  Award,
  MapPin,
  Leaf,
  Palette,
  Package,
  Instagram,
} from 'lucide-react';

const fadeStagger = {
  hidden: { opacity: 0, y: 24 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.12, duration: ANIMATION_DURATIONS.lg, ease: ANIMATION_EASE },
  }),
};

const stats = [
  { label: 'Designer Collectives', value: '500+', icon: Users },
  { label: 'Fine Garments Crafted', value: '10K+', icon: PackageCheck },
  { label: 'Patrons Worldwide', value: '50K+', icon: Heart },
];

const services = [
  {
    title: 'Artisan Logistics',
    copy: 'Insured express delivery with pristine packaging and real-time traceability.',
    icon: Truck,
  },
  {
    title: 'Assured Quality',
    copy: 'Every piece passes 27-point atelier inspection with archival documentation.',
    icon: ShieldCheck,
  },
  {
    title: 'Signature Authentication',
    copy: 'Each design ships with tamper-proof provenance and limited-edition certification.',
    icon: BadgeCheck,
  },
];

const categories = [
  {
    title: "Menswear Atelier",
    summary: 'Sharp tailoring, architectural silhouettes, elevated essentials.',
    metrics: '156 designs',
    image: 'https://nobero.com/cdn/shop/files/WhatsApp_Image_2024-08-13_at_6.50.45_PM.jpg?v=1723555771',
    to: '/shop/men',
  },
  {
    title: "Womenswear Maison",
    summary: 'Fluid draping, couture detailing, statement eveningwear.',
    metrics: '204 designs',
    image: 'https://www.mydesignation.com/cdn/shop/files/swag-112835.jpg?v=1728643580',
    to: '/shop/women',
  },
  {
    title: 'Accoutrements',
    summary: 'Fine leather, sculptural jewellery, curated accessories edit.',
    metrics: '128 designs',
    image: 'https://ounass-kw.atgcdn.ae/contentful/b3xlytuyfm3e/4CEnplsFhY1u2DXk4qP7gK/d4cb5fcd039105581fbf78bb0386a52c/Women_Accessories_APP_PLP_Banner_copy.jpg?q=70',
    to: '/shop/accessories',
  },
];

const featuredProducts = [
  {
    id: 1,
    name: 'Oversized Atelier Tee',
    price: 999,
    originalPrice: 1499,
    image: 'https://5.imimg.com/data5/ECOM/Default/2024/5/417620814/NM/VP/BA/13548708/17116136833fe8716c81f686af3371d1ce69cc7fa6-thumbnail-900x-f9436bb7-5ba0-4767-ad64-0e61580dea69-500x500.jpg',
    hoverImage: 'https://images.unsplash.com/photo-1525171254930-643fc658b64e?auto=format&fit=crop&w=800&q=80',
    badge: 'Signature',
    rating: 4.8,
    reviewCount: 86,
  },
  {
    id: 2,
    name: 'Handloom Heritage Hoodie',
    price: 1499,
    originalPrice: 2199,
    image: 'https://shopokbye.ca/cdn/shop/files/9AA62E3D-8F6D-4299-91D3-B2856A1B048C.png?v=1725763266',
    hoverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    badge: 'New Arrival',
    rating: 4.9,
    reviewCount: 143,
  },
  {
    id: 3,
    name: 'Monogram Atelier Tote',
    price: 599,
    originalPrice: 899,
    image: 'https://www.intelligentchange.com/cdn/shop/products/4X5-WebRes-Intelligent-Change-Tote-Bags-1_301b012d-03b9-4917-96ff-e911c5783d56.jpg?v=1671127106&width=1120',
    hoverImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    badge: 'Limited',
    rating: 4.7,
    reviewCount: 64,
  },
];

const trendTags = [
  { label: 'Minimal Artefact', count: '2.3K designs' },
  { label: 'Deco Revival', count: '1.8K designs' },
  { label: 'Typographic Play', count: '3.1K designs' },
  { label: 'Botanical Muse', count: '1.5K designs' },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Fashion Writer, Mumbai',
    quote: 'The Kapda Co. redefines what bespoke can feel like online—luminous fabrics, impeccable fit, and a concierge experience that rivals couture houses.',
  },
  {
    name: 'Rahul Verma',
    role: 'Designer-in-Residence, Goa',
    quote: 'The curated marketplace celebrates designers. My pieces launch with full provenance, premium packaging, and real-time analytics.',
  },
  {
    name: 'Ananya Patel',
    role: 'Creative Director, Bengaluru',
    quote: 'From atelier collaborations to limited drops, the platform makes premium fashion accessible while preserving craftsmanship.',
  },
];

const Home = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [menProducts, setMenProducts] = useState([]);
  const [womenProducts, setWomenProducts] = useState([]);
  const [accessoriesProducts, setAccessoriesProducts] = useState([]);
  const [loadingMen, setLoadingMen] = useState(true);
  const [loadingWomen, setLoadingWomen] = useState(true);
  const [loadingAccessories, setLoadingAccessories] = useState(true);
  const [error, setError] = useState('');
  const heroRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroImageParallax = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1, 1.015]);

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Fetch latest products for each category - optimized with caching and parallel loading
  useEffect(() => {
    let ignore = false;
    
    const mapProduct = (p) => ({
      id: p._id,
      _id: p._id, // Include _id for compatibility
      name: p.title,
      title: p.title, // Include title for ProductDetail compatibility
      price: p.discountPrice || p.price,
      basePrice: p.price, // Include basePrice for ProductDetail
      discountPrice: p.discountPrice,
      originalPrice: p.discountPrice ? p.price : null,
      image: p.mainImage || p.images?.[0] || '',
      images: p.images || [], // Include full images array
      mainImage: p.mainImage,
      // Include variant-related fields for ProductDetail
      variants: p.variants || [],
      options: p.options || [],
      media: p.media || [],
      colors: p.colors || [],
      sizes: p.sizes || [],
      // Include other fields that ProductDetail might need
      description: p.description,
      category: p.category,
      brand: p.brand,
      inventory: p.inventory || {},
      badge: p.tags?.includes('signature') ? 'Signature' : p.tags?.includes('new') ? 'New Arrival' : p.tags?.includes('limited') ? 'Limited' : null,
      rating: p.rating || 4.5,
      reviewCount: Math.floor(Math.random() * 200) + 20,
    });

    const fetchAllProducts = async () => {
      try {
        // Always fetch fresh data from API to get the latest products
        // Backend sorts by createdAt: -1 (newest first) by default
        // Parallel fetch all categories at once
        const [menRes, womenRes, accessoriesRes] = await Promise.all([
          fetch('/api/public/products?category=men&limit=3'),
          fetch('/api/public/products?category=women&limit=3'),
          fetch('/api/public/products?category=accessories&limit=3'),
        ]);

        if (ignore) return;

        const [menData, womenData, accessoriesData] = await Promise.all([
          menRes.json(),
          womenRes.json(),
          accessoriesRes.json(),
        ]);

        if (ignore) return;

        // Get the latest 3 products from each category (already sorted by createdAt: -1 from backend)
        const menProducts = (menData.products || []).slice(0, 3).map(mapProduct);
        const womenProducts = (womenData.products || []).slice(0, 3).map(mapProduct);
        const accessoriesProducts = (accessoriesData.products || []).slice(0, 3).map(mapProduct);

        // Cache the results for faster subsequent loads
        const cacheKey = 'home-products';
        setCachedProducts(cacheKey, {
          men: menProducts,
          women: womenProducts,
          accessories: accessoriesProducts,
        });

        if (!ignore) {
          setMenProducts(menProducts);
          setWomenProducts(womenProducts);
          setAccessoriesProducts(accessoriesProducts);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        
        // Fallback to cache if API fails
        const cacheKey = 'home-products';
        const cached = getCachedProducts(cacheKey);
        if (cached && !ignore) {
          setMenProducts(cached.men || []);
          setWomenProducts(cached.women || []);
          setAccessoriesProducts(cached.accessories || []);
        } else if (!ignore) {
          setError('Failed to load products');
        }
      } finally {
        if (!ignore) {
          setLoadingMen(false);
          setLoadingWomen(false);
          setLoadingAccessories(false);
        }
      }
    };

    fetchAllProducts();
    
    return () => {
      ignore = true;
    };
  }, []);

  const heroLayers = useMemo(() => [
    'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.55), transparent 55%)',
    'radial-gradient(circle at 80% 0%, rgba(211, 167, 95, 0.35), transparent 50%)',
    'linear-gradient(135deg, rgba(21, 21, 21, 0.95), rgba(21, 21, 21, 0.55))',
  ], []);

  return (
    <>
      <SEO 
        title="Home"
        description="Discover premium customizable fashion and designer streetwear. Create unique designs with our atelier tool, explore curated collections, and shop from independent designers."
        keywords="customizable fashion, designer streetwear, custom clothing, fashion atelier, India fashion"
        jsonLd={[getOrganizationJsonLd(), getWebsiteJsonLd()]}
        canonical={`${import.meta.env.VITE_SITE_URL || 'https://thekapdaco.com'}/`}
      />
    <main className="kc-main-content">
      <section 
        ref={heroRef} 
        className="home-hero relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg,
            var(--kc-hero-gradient-start) 0%,
            var(--kc-hero-gradient-mid) 50%,
            var(--kc-hero-gradient-end) 100%)`,
        }}
      >
        {/* Subtle Grain Texture */}
        <div 
          className="absolute inset-0 opacity-[0.025] mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3CfeColorMatrix type="saturate" values="0"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="0.4"/%3E%3C/svg%3E')`,
            backgroundSize: '200px 200px',
          }}
        />

        {/* Soft Radial Gradients for Depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(211,167,95,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(180,160,140,0.06),transparent_70%)]" />

        <div className="home-container container relative z-10 w-full py-20 lg:py-32">
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-20 items-center min-h-[85vh]">
            
            {/* Premium Typography Section - Left */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: ANIMATION_DURATIONS.lg, ease: ANIMATION_EASE_OUT }}
              className="space-y-8 lg:space-y-12 text-center lg:text-left order-2 lg:order-1 no-overflow"
            >
              {/* Staggered Text Animation */}
              <div className="space-y-8">
                <motion.h1
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: ANIMATION_DURATIONS.lg, ease: ANIMATION_EASE_OUT, delay: 0.1 }}
                  className="font-serif text-[clamp(4rem,8vw,6.5rem)] font-light leading-[1.05] tracking-[0.02em]"
                  style={{
                    color: 'var(--kc-hero-text-dark)',
                    fontFamily: 'var(--kc-font-serif)',
                    letterSpacing: '0.02em',
                    fontWeight: 300,
                  }}
                >
                  <span className="block">Cinematic</span>
                  <span className="block font-normal mt-[-0.05em]">Couture</span>
                </motion.h1>

                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: ANIMATION_DURATIONS.lg, ease: ANIMATION_EASE_OUT, delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-px w-12" style={{ backgroundColor: 'var(--kc-hero-border-beige)' }} />
                  <span className="text-sm uppercase tracking-[0.25em] font-medium" style={{ color: 'var(--kc-hero-text-dark-muted)' }}>
                    By The Kapda Co.
                  </span>
                </motion.div>

                <motion.p
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1], delay: 0.3 }}
                  className="text-[clamp(1.125rem,1.8vw,1.375rem)] leading-[1.8] max-w-[580px] font-light"
                  style={{
                    color: 'var(--kc-text-on-light)',
                    letterSpacing: '0.01em',
                  }}
                >
                  Immerse in a designer-led marketplace where bespoke ateliers, limited capsules, and couture services converge. Discover curated collections crafted for the modern connoisseur.
                </motion.p>
              </div>

              {/* Premium CTA Buttons */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1], delay: 0.4 }}
                className="hero-cta-buttons flex flex-wrap items-center gap-4"
              >
                <KCButton
                  as={Link}
                  to="/shop"
                  variant="primary"
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                  className="group relative px-10 py-4 text-sm uppercase tracking-[0.2em] rounded-full shadow-[0_8px_32px_rgba(211,167,95,0.3)] hover:shadow-[0_12px_40px_rgba(211,167,95,0.4)]"
                >
                  Shop The Edit
                </KCButton>
                
                <KCButton
                  as={Link}
                  to="/designer/signup"
                  variant="secondary"
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                  className="px-10 py-4 text-sm uppercase tracking-[0.2em] rounded-full border-2 bg-white/30 backdrop-blur-md hover:bg-white/50 hover:shadow-[0_8px_24px_rgba(139,115,85,0.15)]"
                  style={{ 
                    borderColor: 'var(--kc-hero-border-beige)', 
                    color: 'var(--kc-hero-text-dark)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(139,115,85,0.6)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--kc-hero-border-beige)'}
                >
                  Become A Designer
                </KCButton>
              </motion.div>

              {/* Elegant Stats Row */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: ANIMATION_DURATIONS.lg, ease: ANIMATION_EASE_OUT, delay: 0.5 }}
                className="hero-stats flex flex-wrap items-center gap-10 lg:gap-16 pt-4"
              >
                {stats.map(({ label, value, icon: Icon }, index) => (
                  <motion.div
                    key={label}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: ANIMATION_DURATIONS.lg, ease: ANIMATION_EASE_OUT, delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-white/40 backdrop-blur-sm transition-all group-hover:bg-white/60 group-hover:shadow-lg" style={{ borderColor: 'var(--kc-hero-border-beige)', color: 'var(--kc-hero-text-dark-muted)', transitionDuration: 'var(--kc-duration-md)', transitionTimingFunction: 'var(--kc-ease)' }}>
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-3xl font-serif font-light leading-none" style={{ color: 'var(--kc-hero-text-dark)' }}>{value}</div>
                      <div className="text-xs uppercase tracking-[0.2em] mt-1.5 font-medium" style={{ color: 'var(--kc-hero-text-dark-muted)' }}>{label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Premium Magazine-Style Image Layout - Right */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: ANIMATION_DURATIONS.lg, ease: ANIMATION_EASE_OUT, delay: 0.2 }}
              style={{
                y: heroImageParallax,
                scale: heroImageScale,
              }}
              className="hero-images relative flex gap-3 lg:gap-4 h-[60vh] sm:h-[70vh] lg:h-[90vh] order-1 lg:order-2"
            >
              {/* Left Narrow Image */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1], delay: 0.4 }}
                className="relative flex-[0.35] lg:flex-[0.4] group overflow-hidden rounded-xl lg:rounded-2xl shadow-xl lg:shadow-2xl"
              >
                <img
                  src={model1}
                  alt="Model wearing black Kapda Co. t-shirt"
                  className="h-full w-full object-cover transition-transform ease-[var(--kc-ease)] group-hover:scale-[1.01]"
                  style={{ transitionDuration: 'var(--kc-duration-md)' }}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.08) 80%, rgba(0, 0, 0, 0.25) 100%)',
                  }}
                />
                <div className="absolute inset-[2px] rounded-xl lg:rounded-2xl border border-white/10 pointer-events-none" />
              </motion.div>

              {/* Center Large Image */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: ANIMATION_DURATIONS.lg, ease: ANIMATION_EASE_OUT, delay: 0.5 }}
                className="relative flex-1 group overflow-hidden rounded-xl lg:rounded-2xl shadow-xl lg:shadow-2xl"
              >
                <img
                  src={model2}
                  alt="Model wearing beige Kapda Co. hoodie"
                  className="h-full w-full object-cover transition-transform ease-[var(--kc-ease)] group-hover:scale-[1.01]"
                  style={{ transitionDuration: 'var(--kc-duration-md)' }}
                  loading="eager"
                  decoding="async"
                />
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.08) 80%, rgba(0, 0, 0, 0.25) 100%)',
                  }}
                />
                <div className="absolute inset-[2px] rounded-xl lg:rounded-2xl border border-white/10 pointer-events-none" />
              </motion.div>

              {/* Right Narrow Image */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: ANIMATION_DURATIONS.lg, ease: ANIMATION_EASE_OUT, delay: 0.6 }}
                className="relative flex-[0.35] lg:flex-[0.4] group overflow-hidden rounded-xl lg:rounded-2xl shadow-xl lg:shadow-2xl"
              >
                <img
                  src={model3}
                  alt="Model seated wearing beige Kapda Co. hoodie"
                  className="h-full w-full object-cover transition-transform ease-[var(--kc-ease)] group-hover:scale-[1.01]"
                  style={{ transitionDuration: 'var(--kc-duration-md)' }}
                  loading="eager"
                  decoding="async"
                />
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.08) 80%, rgba(0, 0, 0, 0.25) 100%)',
                  }}
                />
                <div className="absolute inset-[2px] rounded-xl lg:rounded-2xl border border-white/10 pointer-events-none" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Elegant Gradient Transition */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(245, 230, 211, 0.4), rgba(212, 196, 176, 0.6))',
          }}
        />
      </section>

      {/* Shop By Category Section */}
      <section className="kc-section premium-noise">
        <div className="kc-container">
          <div className="text-center space-y-4 mb-12" style={{ paddingTop: 'var(--kc-section-padding-sm)', paddingBottom: 'var(--kc-section-padding-sm)' }}>
            <p className="kc-pill bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Collections</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl text-[var(--kc-cream-100)] font-serif font-semibold tracking-tight">Shop By Category</h2>
            <p className="max-w-2xl mx-auto text-[var(--kc-cream-100)] opacity-80">
              Discover our curated collections, each crafted with precision and passion for the modern connoisseur.
            </p>
          </div>
          <div className="category-cards-grid grid gap-6 md:grid-cols-3 mb-[30px]">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: ANIMATION_DURATIONS.lg, delay: index * 0.1, ease: ANIMATION_EASE }}
                whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
                className="category-card group relative overflow-hidden rounded-2xl border border-[var(--kc-glass-border)] bg-[var(--kc-glass-01)] backdrop-blur-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all"
                style={{ transitionDuration: 'var(--kc-duration-md)' }}
              >
                <Link to={category.to} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <motion.img
                      src={category.image}
                      alt={category.title}
                      className="category-card-image h-full w-full object-cover transition-transform ease-[var(--kc-ease)] group-hover:scale-110"
                      style={{ transitionDuration: 'var(--kc-duration-lg)' }}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.7)] via-transparent to-transparent" />
                    <div className="category-card-content absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-serif font-semibold mb-2">{category.title}</h3>
                      <p className="text-sm opacity-90 mb-4">{category.summary}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium opacity-80">{category.metrics}</span>
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="shop-now-btn inline-flex items-center gap-2 px-4 py-2 rounded-[var(--kc-radius)] bg-[var(--kc-grad-gold)] text-[var(--kc-navy-900)] font-semibold text-sm touch-target"
                        >
                          Shop Now
                          <ArrowRight size={16} />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Men Collection Section */}
      <section className="kc-section premium-noise">
        <div className="kc-container space-y-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row" style={{ alignItems: 'flex-start' }}>
            <div className="flex-1">
              <p className="kc-pill bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Menswear</p>
              <h2 className="mt-4 text-3xl md:text-4xl text-[var(--kc-cream-100)] font-serif font-semibold tracking-tight">MEN</h2>
              <p className="mt-2 max-w-xl text-[var(--kc-cream-100)] opacity-80">
                Sharp tailoring, architectural silhouettes, elevated essentials crafted for the modern gentleman.
              </p>
            </div>
            <div className="flex items-center" style={{ marginTop: 'var(--kc-spacing-xs)' }}>
              <KCButton as={Link} to="/shop/men">View Collection</KCButton>
            </div>
          </div>
          {loadingMen ? (
            <GridSkeleton items={3} columns={3} renderItem={ProductCardSkeleton} />
          ) : menProducts.length > 0 ? (
            <div className="product-section-grid grid gap-6 md:grid-cols-3">
              {menProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--kc-cream-100)] opacity-70">No products available at the moment.</p>
          )}
        </div>
      </section>

      {/* Women Collection Section */}
      <section className="kc-section premium-noise">
        <div className="kc-container space-y-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row" style={{ alignItems: 'flex-start' }}>
            <div className="flex-1">
              <p className="kc-pill bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Womenswear</p>
              <h2 className="mt-4 text-3xl md:text-4xl text-[var(--kc-cream-100)] font-serif font-semibold tracking-tight">WOMEN</h2>
              <p className="mt-2 max-w-xl text-[var(--kc-cream-100)] opacity-80">
                Fluid draping, couture detailing, statement eveningwear designed for the contemporary woman.
              </p>
            </div>
            <div className="flex items-center" style={{ marginTop: 'var(--kc-spacing-xs)' }}>
              <KCButton as={Link} to="/shop/women">View Collection</KCButton>
            </div>
          </div>
          {loadingWomen ? (
            <GridSkeleton items={3} columns={3} renderItem={ProductCardSkeleton} />
          ) : womenProducts.length > 0 ? (
            <div className="product-section-grid grid gap-6 md:grid-cols-3">
              {womenProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--kc-cream-100)] opacity-70">No products available at the moment.</p>
          )}
        </div>
      </section>

      {/* Accessories Collection Section */}
      <section className="kc-section premium-noise">
        <div className="kc-container space-y-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row" style={{ alignItems: 'flex-start' }}>
            <div className="flex-1">
              <p className="kc-pill bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Accoutrements</p>
              <h2 className="mt-4 text-3xl md:text-4xl text-[var(--kc-cream-100)] font-serif font-semibold tracking-tight">ACCESSORIES</h2>
              <p className="mt-2 max-w-xl text-[var(--kc-cream-100)] opacity-80">
                Fine leather, sculptural jewellery, curated accessories edit to complete your signature look.
              </p>
            </div>
            <div className="flex items-center" style={{ marginTop: 'var(--kc-spacing-xs)' }}>
              <KCButton as={Link} to="/shop/accessories">View Collection</KCButton>
            </div>
          </div>
          {loadingAccessories ? (
            <GridSkeleton items={3} columns={3} renderItem={ProductCardSkeleton} />
          ) : accessoriesProducts.length > 0 ? (
            <div className="product-section-grid grid gap-6 md:grid-cols-3">
              {accessoriesProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--kc-cream-100)] opacity-70">No products available at the moment.</p>
          )}
        </div>
      </section>

      <section className="kc-section">
        <div className="kc-container services-grid grid gap-6 md:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
            <motion.div
              key={service.title}
              variants={fadeStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              custom={index}
            >
              <KCCard interactive muted className="h-full space-y-4 bg-[var(--kc-glass-01)] border border-[var(--kc-glass-border)] backdrop-blur-[10px]">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] border border-[var(--kc-glass-border)] bg-[var(--kc-glass-01)] text-[var(--kc-gold-200)]">
                  <Icon size={22} />
                </span>
                <h3 className="text-lg font-semibold text-[var(--kc-cream-100)]">{service.title}</h3>
                <p className="text-sm text-[var(--kc-cream-100)] opacity-70">{service.copy}</p>
              </KCCard>
            </motion.div>
          );})}
        </div>
      </section>

      {/* <section className="kc-section premium-noise">
        <div className="kc-container space-y-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="kc-pill bg-[var(--kc-card)]">Curation</p>
              <h2 className="mt-4 text-3xl md:text-4xl">Shop By House Codes</h2>
              <p className="mt-2 max-w-xl text-[var(--kc-ink-2)]">
                Immerse yourself in curated capsules designed by resident ateliers. Discover silhouettes crafted for distinct wardrobes.
              </p>
            </div>
            <KCButton as={Link} to="/shop" variant="secondary">Explore All</KCButton>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {categories.map((category, index) => (
              <motion.article
                key={category.title}
                variants={fadeStagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                custom={index}
                className="overflow-hidden rounded-[var(--kc-radius-lg)] border border-[var(--kc-border)] bg-[var(--kc-surface)] shadow-[var(--kc-shadow-sm)]"
              >
                <Link to={category.to} className="group block">
                  <div className="relative overflow-hidden">
                    <motion.img
                      src={category.image}
                      alt={category.title}
                      className="aspect-[4/5] w-full object-cover transition-transform ease-[var(--kc-ease)] group-hover:scale-105"
                      style={{ transitionDuration: 'var(--kc-duration-lg)' }}
                      loading="lazy"
                      decoding="async"
                    />
                    <motion.div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.45)] to-transparent" animate={{ opacity: 1 }} />
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-sm text-white">
                      <span className="font-medium">{category.metrics}</span>
                      <ArrowRight size={20} />
                    </div>
                  </div>
                  <div className="space-y-3 p-6">
                    <h3 className="text-xl font-semibold">{category.title}</h3>
                    <p className="text-sm text-[var(--kc-ink-2)]">{category.summary}</p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section> */}

      {/* Trending / Bestsellers Section */}
      <section className="kc-section premium-noise relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#213044] via-[#1c2b3e] to-transparent opacity-[0.07] pointer-events-none" />
        <div className="kc-container relative z-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center" style={{ paddingTop: 'var(--kc-section-padding-sm)', paddingBottom: 'var(--kc-gap-md)' }}>
            <div>
              <p className="kc-pill bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Curated</p>
              <h2 className="mt-4 text-3xl md:text-4xl text-[var(--kc-cream-100)] font-serif font-semibold tracking-tight">Trending Now</h2>
              <p className="mt-2 max-w-xl text-[var(--kc-cream-100)] opacity-80">
                Discover the most loved pieces, bestsellers, and trending designs handpicked by our curatorial team.
              </p>
            </div>
            <KCButton as={Link} to="/shop">View All</KCButton>
          </div>
          <div className="product-section-grid grid gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: ANIMATION_DURATIONS.md, delay: index * 0.1, ease: ANIMATION_EASE }}
                whileHover={{ y: -4 }}
              >
                <ProductCard {...product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Instagram Section */}
      <section className="kc-section premium-noise">
        <div className="kc-container space-y-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="kc-pill bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Community</p>
              <h2 className="mt-4 text-3xl md:text-4xl text-[var(--kc-cream-100)] font-serif">Follow @KapdaCo</h2>
              <p className="mt-2 max-w-xl text-[var(--kc-cream-100)] opacity-80">
                See how our community styles Kapda Co. pieces. Tag us for a chance to be featured.
              </p>
            </div>
            <KCButton variant="secondary" as="a" href="https://instagram.com/thekapdaco" target="_blank" rel="noreferrer">
              <Instagram size={18} className="mr-2" />
              Follow Us
            </KCButton>
          </div>
          <div className="mx-auto max-w-7xl px-6">
            <div className="instagram-grid grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[
                'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=400&fit=crop',
              ].map((imageUrl, item) => (
                <motion.div
                  key={item}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: ANIMATION_DURATIONS.sm, delay: item * 0.05, ease: ANIMATION_EASE }}
                  whileHover={{ scale: 1.05 }}
                  className="instagram-item group relative aspect-square overflow-hidden rounded-xl border border-[var(--kc-glass-border)] bg-[var(--kc-glass-01)] backdrop-blur-[10px]"
                >
                  <img 
                    src={imageUrl} 
                    alt={`Instagram post ${item + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    style={{ transitionDuration: 'var(--kc-duration-md)' }}
                    loading="lazy"
                  />
                  <div className="absolute inset-[1px] border border-white/20 rounded-xl pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{ transitionDuration: 'var(--kc-duration-md)', transitionTimingFunction: 'var(--kc-ease)' }} />
                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ transitionDuration: 'var(--kc-duration-md)', transitionTimingFunction: 'var(--kc-ease)' }}>
                    <Instagram size={20} className="text-white drop-shadow-lg" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="kc-section">
        <div className="kc-container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-4">
              <p className="kc-pill bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Heritage</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl text-[var(--kc-cream-100)] font-serif font-semibold tracking-tight">Why Choose Kapda Co.</h2>
              <p className="max-w-xl text-[var(--kc-cream-100)] opacity-80">
                We combine traditional craftsmanship with modern design, creating pieces that celebrate heritage while embracing contemporary style.
              </p>
            </div>
          </div>
          <div className="why-choose-grid grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-10">
            {[
              { icon: Award, title: 'Premium Quality Fabrics', desc: 'Sourced from the finest mills, ensuring durability and comfort' },
              { icon: MapPin, title: 'Made in India', desc: 'Proudly supporting local artisans and traditional craftsmanship' },
              { icon: Palette, title: 'Designer Marketplace', desc: 'Curated collections from independent designers and ateliers' },
              { icon: Sparkles, title: 'Customizable Studio', desc: 'Personalize your pieces with our bespoke customization service' },
              { icon: Leaf, title: 'Sustainable Packaging', desc: 'Eco-friendly packaging that reflects our commitment to the environment' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: ANIMATION_DURATIONS.lg, delay: index * 0.1, ease: ANIMATION_EASE }}
                  whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
                >
                  <KCCard interactive className="h-full space-y-4 bg-[var(--kc-glass-01)] border border-[var(--kc-glass-border)] backdrop-blur-[10px] p-5 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]" style={{ transitionDuration: 'var(--kc-duration-md)', transitionTimingFunction: 'var(--kc-ease)' }}>
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--kc-glass-border)] bg-[var(--kc-grad-gold)] text-[var(--kc-navy-900)]">
                      <Icon size={22} />
                    </span>
                    <h3 className="text-xl font-semibold text-[var(--kc-cream-100)] font-serif">{item.title}</h3>
                    <p className="text-sm text-[var(--kc-cream-100)] opacity-80 leading-relaxed">{item.desc}</p>
                  </KCCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="kc-section">
        <div className="kc-container space-y-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="kc-pill bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Insights</p>
              <h2 className="mt-4 text-3xl md:text-4xl text-[var(--kc-cream-100)] font-serif font-semibold tracking-tight">Trending Design Narratives</h2>
              <p className="mt-2 max-w-xl text-[var(--kc-cream-100)] opacity-80">
                Explore the motifs captivating our patrons this season and commission bespoke variations tailored to your palette.
              </p>
            </div>
          </div>
          <div className="trending-grid grid gap-4 md:grid-cols-4">
            {trendTags.map((trend, index) => (
              <KCCard key={trend.label} interactive className="flex h-full flex-col justify-between gap-6 bg-[var(--kc-glass-01)] border border-[var(--kc-glass-border)] backdrop-blur-[10px]">
                <div className="space-y-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--kc-radius)] border border-[var(--kc-glass-border)] bg-[var(--kc-glass-strong)] text-[var(--kc-gold-200)]">
                    <Sparkles size={18} />
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--kc-cream-100)]">{trend.label}</h3>
                </div>
                <p className="text-sm text-[var(--kc-cream-100)] opacity-70">{trend.count}</p>
              </KCCard>
            ))}
          </div>
        </div>
      </section>

      <section className="kc-section" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div className="kc-container space-y-10">
          <div className="text-center">
            <p className="kc-pill mx-auto bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Voices</p>
            <h2 className="mt-4 text-3xl md:text-4xl text-[var(--kc-cream-100)]">Collector Testimonials</h2>
          </div>
          <div className="testimonials-container relative mx-auto max-w-3xl rounded-[var(--kc-radius-lg)] border border-[var(--kc-glass-border)] bg-[var(--kc-glass-01)] backdrop-blur-[10px] p-10 shadow-[var(--kc-shadow-md)]">
            <Quote className="absolute -top-6 left-6 text-[var(--kc-gold-200)]" size={48} />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: ANIMATION_DURATIONS.md, ease: ANIMATION_EASE }}
                className="space-y-6 text-center"
              >
                <p className="text-lg leading-relaxed text-[var(--kc-cream-100)]">"{testimonials[activeTestimonial].quote}"</p>
                <div>
                  <p className="text-base font-semibold text-[var(--kc-cream-100)]">{testimonials[activeTestimonial].name}</p>
                  <p className="text-sm text-[var(--kc-cream-100)] opacity-70">{testimonials[activeTestimonial].role}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex justify-center gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`h-2 w-7 rounded-full transition-all ${index === activeTestimonial ? 'bg-[var(--kc-gold-200)]' : 'bg-[var(--kc-glass-border)]'}`}
                  aria-label={`Show testimonial ${index + 1}`}
                  aria-pressed={index === activeTestimonial}
                  onClick={() => setActiveTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="kc-section pb-24">
        <div className="kc-container commission-section overflow-hidden rounded-[var(--kc-radius-lg)] border border-[var(--kc-glass-border)] bg-[var(--kc-glass-01)] backdrop-blur-[10px] shadow-[var(--kc-shadow-md)]">
          <div className="commission-grid grid gap-10 p-10 md:grid-cols-[1.3fr_1fr] md:items-center">
            <div className="space-y-6">
              <p className="kc-pill bg-[var(--kc-glass-strong)] text-[var(--kc-cream-100)] border border-[var(--kc-glass-border)]">Commission</p>
              <h2 className="text-3xl md:text-4xl text-[var(--kc-cream-100)]">Ready To Express Your Signature?</h2>
              <p className="text-[var(--kc-cream-100)] opacity-80">
                Partner with resident designers for bespoke drops, or customise a capsule from the archive. Our concierge team coordinates fittings, fabric sourcing, and delivery timelines worldwide.
              </p>
              <div className="flex flex-wrap gap-4">
                <KCButton as={Link} to="/customize">Launch Studio</KCButton>
                <KCButton variant="secondary" as={Link} to="/designer/signup">Designer Residency</KCButton>
              </div>
            </div>
            <KCCard interactive muted className="space-y-4 text-sm bg-[var(--kc-glass-strong)] border border-[var(--kc-glass-border)]">
              <h3 className="text-lg font-semibold text-[var(--kc-cream-100)]">Concierge Services</h3>
              <ul className="space-y-3 text-[var(--kc-cream-100)] opacity-80">
                <li>• Global shipping with climate-controlled logistics</li>
                <li>• Atelier video consultations within 48 hours</li>
                <li>• Secure payments with gold-tier fraud protection</li>
                <li>• Archive access for returning patrons</li>
              </ul>
            </KCCard>
          </div>
        </div>
      </section>

      {/* Trust Signals Section - Above Footer */}
      <section className="kc-section pb-12">
        <div className="kc-container">
          <div className="trust-signals flex flex-wrap items-center justify-center" style={{ gap: 'var(--kc-gap-xl)' }}>
            {[
              { icon: Lock, title: 'Secure Checkout', desc: '256-bit SSL encryption' },
              { icon: Truck, title: 'Fast Shipping', desc: 'Express delivery' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '30-day policy' },
              { icon: Headphones, title: '24/7 Support', desc: 'Always available' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: ANIMATION_DURATIONS.sm, delay: index * 0.1, ease: ANIMATION_EASE }}
                  className="flex flex-col items-center text-center space-y-2"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--kc-glass-border)] bg-[var(--kc-glass-strong)] text-[var(--kc-gold-200)]" style={{ lineHeight: 1 }}>
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--kc-cream-100)] mb-1" style={{ fontSize: '12px', lineHeight: '1.5' }}>{item.title}</h3>
                    <p className="text-xs text-[var(--kc-cream-100)] opacity-70" style={{ fontSize: '12px', lineHeight: '1.5' }}>{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
    </>
  );
};

export default Home;