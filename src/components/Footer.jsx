import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../lib/animationConstants';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { KCButton, KCInput } from './ui';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import '../styles/footer-responsive.css';

const socialLinks = [
  { href: 'https://facebook.com/thekapdaco', label: 'Facebook', icon: Facebook },
  { href: 'https://instagram.com/thekapdaco', label: 'Instagram', icon: Instagram },
  { href: 'https://twitter.com/thekapdaco', label: 'Twitter', icon: Twitter },
  { href: 'https://youtube.com/thekapdaco', label: 'YouTube', icon: Youtube },
  { href: 'mailto:hello@thekapdaco.com', label: 'Email', icon: Mail },
];

const footerLinks = {
  Shop: [
    { label: 'All Products', to: '/shop' },
    { label: "Men's Collection", to: '/shop/men' },
    { label: "Women's Collection", to: '/shop/women' },
    { label: 'Accessories', to: '/shop/accessories' },
    { label: 'Limited Editions', to: '/shop/sale' },
  ],
  Services: [
    { label: 'Custom Atelier', to: '/customize' },
    { label: 'Designer Portal', to: '/designer' },
    { label: 'Personal Styling', to: '/styling' },
    { label: 'Alterations', to: '/alterations' },
    { label: 'Workshops', to: '/workshops' },
  ],
  Support: [
    { label: 'Contact', to: '/contact' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Size Guide', to: '/size-guide' },
    { label: 'Shipping', to: '/shipping' },
    { label: 'Returns & Refunds', to: '/returns' },
    { label: 'Track Order', to: '/track-order' },
  ],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Careers', to: '/careers' },
    { label: 'Sustainability', to: '/sustainability' },
    { label: 'Press', to: '/press' },
    { label: 'Artisans', to: '/blog' },
  ],
};

const paymentMethods = ['Visa', 'Mastercard', 'Amex', 'PayPal', 'UPI'];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [openAccordions, setOpenAccordions] = useState({});
  const { token, user } = useAuth();
  const [preferences, setPreferences] = useState({
    newCollections: true,
    styleNotes: true,
    atelierUpdates: true,
    invites: false,
  });

  const toggleAccordion = (title) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    setError('');
    setIsLoading(true);
    try {
      const response = await api('/api/public/newsletter/subscribe', {
        method: 'POST',
        token: token,
        body: {
          email: email.trim(),
          preferences: {
            newCollections: preferences.newCollections,
            styleNotes: preferences.styleNotes,
            atelierUpdates: preferences.atelierUpdates,
            invites: preferences.invites,
          },
          source: 'website',
        },
      });

      if (response.success) {
        setIsSubscribed(true);
        setEmail('');
        // Reset preferences to defaults
        setPreferences({
          newCollections: true,
          styleNotes: true,
          atelierUpdates: true,
          invites: false,
        });
        setTimeout(() => setIsSubscribed(false), 5200);
      } else {
        setError(response.message || 'Failed to subscribe. Please try again.');
      }
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setError(err.message || 'Failed to subscribe to newsletter. Please try again.');
      // Still show success message if email was already subscribed
      if (err.message && err.message.toLowerCase().includes('already subscribed')) {
        setIsSubscribed(true);
        setEmail('');
        setTimeout(() => setIsSubscribed(false), 5200);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const shouldReduceMotion = useReducedMotion();

  return (
    <footer className="footer-container premium-noise relative mt-20 text-[var(--kc-cream)]" style={{ background: 'radial-gradient(circle at top, var(--kc-navy-900), transparent 60%), linear-gradient(180deg, var(--kc-surface-dark), var(--kc-navy-900))' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'var(--kc-noise)' }} aria-hidden="true" />
      <div className="kc-container relative py-14">
        {/* Top Tier: Brand Story & Newsletter */}
        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? {} : "visible"}
          viewport={{ once: true, margin: '-80px' }}
          className="footer-top-section grid lg:grid-cols-[1.1fr_1.9fr] pb-12"
          style={{ gap: 'var(--kc-gap-xl)' }}
        >
          <motion.div variants={fadeUp} className="footer-brand space-y-5">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.5em] font-medium" style={{ letterSpacing: '0.5em', color: 'var(--kc-cream)', opacity: 0.5 }}>
                The Kapda Co.
              </p>
              <h2 className="text-[clamp(2.2rem,3.2vw,3.4rem)] font-serif leading-[1.1] tracking-[-0.02em] font-light" style={{ color: 'var(--kc-cream)' }}>
                Crafted Heritage.<br />Modern Silhouettes.
              </h2>
              <p className="max-w-md text-[15px] leading-[1.7] font-light readable-text" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--kc-cream)', opacity: 0.7 }}>
                A designer-led marketplace celebrating couture craftsmanship and bespoke expressions. Discover curation, collaborate with ateliers, and bring your narrative to life.
              </p>
            </div>

            {/* Global Presence */}
            <div className="footer-global-presence space-y-2.5 pt-1">
              <p className="text-[11px] uppercase tracking-[0.3em] font-medium mb-2" style={{ color: 'var(--kc-cream)', opacity: 0.4 }}>
                Global Ateliers
              </p>
              <div className="space-y-2 text-[14px] font-light" style={{ color: 'var(--kc-cream)', opacity: 0.65 }}>
                <div className="flex items-center gap-3">
                  <MapPin size={14} strokeWidth={1.5} className="flex-shrink-0" style={{ color: 'var(--kc-cream)', opacity: 0.4 }} />
                  <span>Mumbai • London • Dubai</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={14} strokeWidth={1.5} className="flex-shrink-0" style={{ color: 'var(--kc-cream)', opacity: 0.4 }} />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={14} strokeWidth={1.5} className="flex-shrink-0" style={{ color: 'var(--kc-cream)', opacity: 0.4 }} />
                  <span>hello@thekapdaco.com</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="footer-social-links flex flex-wrap items-center gap-2 pt-1">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  variants={fadeUp}
                  custom={0.6}
                  whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.05 }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300"
                  style={{
                    borderColor: 'var(--kc-cream)',
                    borderOpacity: 0.12,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--kc-cream)',
                    opacity: 0.6
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderOpacity = '0.3';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderOpacity = '0.12';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.opacity = '0.6';
                  }}
                  aria-label={label}
                >
                  <Icon size={16} strokeWidth={1.5} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <div className="footer-newsletter space-y-8">
            {/* Newsletter */}
            <motion.div variants={fadeUp} className="kc-card kc-surface-muted border-white/8 bg-white/6 backdrop-blur-sm">
              <div className="space-y-3 mb-4">
                <h3 className="text-xl font-serif font-light tracking-tight" style={{ color: 'var(--kc-cream)' }}>
                  The Kapda Society
                </h3>
                <p className="text-[14px] font-light leading-relaxed" style={{ color: 'var(--kc-cream)', opacity: 0.65 }}>
                  Weekly dispatches on atelier stories, designer residencies, and private previews.
                </p>
              </div>

              {!isSubscribed ? (
                <form className="space-y-4" onSubmit={handleNewsletterSubmit}>
                  <div className="space-y-2">
                    <KCInput
                      type="email"
                      placeholder="name@email.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError('');
                      }}
                      required
                      className="bg-white/10 border-white/15 text-white placeholder:text-white/40"
                    />
                    {error && (
                      <p className="text-sm" style={{ color: '#fca5a5' }}>
                        {error}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ['newCollections', 'New Editions'],
                      ['styleNotes', 'Style Notes'],
                      ['atelierUpdates', 'Atelier Diaries'],
                      ['invites', 'Private Invites'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 rounded-[var(--kc-radius)] border border-white/15 bg-white/8 px-3 py-2.5 text-xs font-light text-white/80 hover:bg-white/12 transition-colors">
                        <input
                          type="checkbox"
                          checked={preferences[key]}
                          onChange={() => togglePreference(key)}
                          className="h-3.5 w-3.5 rounded border-white/30 bg-white/10 text-[var(--kc-gold-200)] accent-[var(--kc-gold-200)]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <KCButton type="submit" className="w-full bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-medium" disabled={isLoading}>
                    {isLoading ? 'Enrolling…' : 'Join the Society'}
                  </KCButton>
                  <p className="text-[11px] text-white/45 font-light leading-relaxed">
                    By subscribing you agree to receive curated communication. View our privacy commitments.
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[var(--kc-radius)] border border-white/20 bg-white/10 p-6 text-center"
                >
                  <p className="font-medium text-white/95 mb-1">Welcome to The Kapda Society</p>
                  <p className="text-sm text-white/60 font-light">Expect a couture note in your inbox shortly.</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Divider Line */}
        <div 
          className="w-full h-px mb-10"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(211, 167, 95, 0.15) 20%, rgba(211, 167, 95, 0.15) 80%, transparent)',
          }}
        />

        {/* Middle Tier: Navigation Links */}
        <motion.div 
          variants={fadeUp}
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? {} : "visible"}
          viewport={{ once: true, margin: '-60px' }}
          className="footer-links-accordion grid gap-8 md:grid-cols-2 xl:grid-cols-4 pb-12"
        >
          {Object.entries(footerLinks).map(([title, links], columnIndex) => {
            const isOpen = openAccordions[title];
            return (
              <div key={title} className="footer-accordion-item" data-open={isOpen}>
                <button
                  type="button"
                  className="footer-accordion-header"
                  onClick={() => toggleAccordion(title)}
                  aria-expanded={isOpen}
                  aria-controls={`footer-accordion-${title}`}
                >
                  <h4 className="footer-accordion-title text-[13px] uppercase tracking-[0.25em] font-medium" style={{ color: 'var(--kc-cream)', opacity: 0.7 }}>
                    {title}
                  </h4>
                  <ChevronDown size={16} className="footer-accordion-icon" />
                </button>
                <div
                  id={`footer-accordion-${title}`}
                  className="footer-accordion-content"
                  aria-hidden={!isOpen}
                >
                  <ul className="footer-accordion-links">
                    {links.map((link, linkIndex) => (
                      <motion.li
                        key={link.to}
                        variants={fadeUp}
                        custom={columnIndex + linkIndex * 0.08}
                      >
                        <Link
                          to={link.to}
                          className="inline-block text-[14px] font-light transition-colors duration-300 hover:opacity-100"
                          style={{ 
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            color: 'var(--kc-cream)',
                            opacity: 0.65
                          }}
                        >
                          {link.label}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Divider Line */}
        <div 
          className="w-full h-px mb-8"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(211, 167, 95, 0.15) 20%, rgba(211, 167, 95, 0.15) 80%, transparent)',
          }}
        />

        {/* Bottom Tier: Legal, Payments, Copyright */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: ANIMATION_DURATIONS.md, ease: ANIMATION_EASE }}
          className="footer-bottom flex flex-col gap-5 text-sm md:flex-row md:items-start md:justify-between"
        >
          <div className="space-y-3">
            <p className="footer-copyright text-[13px] font-light leading-relaxed" style={{ color: 'var(--kc-cream)', opacity: 0.6 }}>
              © {new Date().getFullYear()} The Kapda Co.<br />
              <span style={{ opacity: 0.5 }}>Crafted globally, rooted in heritage.</span>
            </p>
            <div className="footer-legal-links flex flex-wrap gap-x-6 gap-y-2" style={{ lineHeight: '1.8' }}>
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/terms">Terms & Conditions</FooterLink>
              <FooterLink to="/returns">Return & Refund Policy</FooterLink>
              <FooterLink to="/shipping">Shipping Policy</FooterLink>
              <FooterLink to="/cookies">Cookies</FooterLink>
              <FooterLink to="/accessibility">Accessibility</FooterLink>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <p className="text-[11px] uppercase tracking-[0.3em] font-medium" style={{ color: 'var(--kc-cream)', opacity: 0.4 }}>
              Secure Payments
            </p>
            <div className="footer-payments flex flex-wrap gap-2 justify-end">
              {paymentMethods.map((method) => (
                <span
                  key={method}
                  className="footer-payment-item rounded-full border px-3 py-1.5 text-[11px] font-light"
                  style={{
                    borderColor: 'var(--kc-cream)',
                    borderOpacity: 0.1,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--kc-cream)',
                    opacity: 0.55
                  }}
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, children }) => (
  <Link 
    to={to} 
    className="text-[12px] font-light transition-colors duration-300 hover:opacity-100"
    style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'var(--kc-cream)',
      opacity: 0.6
    }}
  >
    {children}
  </Link>
);

export default Footer;