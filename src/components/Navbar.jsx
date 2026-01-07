import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Menu,
  X,
  ShoppingBag,
  UserRound,
  LogOut,
  Settings,
  ShieldCheck,
  Truck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { LoadingSpinner } from './ui';
import { cn } from '../lib/cn';
import { trapFocus, handleEscapeKey } from '../lib/accessibility';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/customize', label: 'Customize' },
  { path: '/designers', label: 'Designers' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('[aria-controls="kc-mobile-nav"]')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation and focus trap for profile dropdown
  useEffect(() => {
    if (!profileOpen) return;

    const dropdownElement = profileRef.current?.querySelector('[role="menu"]');
    const previousActiveElement = document.activeElement;

    // Trap focus in dropdown
    const cleanupFocus = trapFocus(dropdownElement, previousActiveElement);

    // Handle Escape key
    const cleanupEscape = handleEscapeKey(() => {
      setProfileOpen(false);
      // Return focus to profile button
      const profileButton = profileRef.current?.querySelector('button[aria-haspopup="menu"]');
      profileButton?.focus();
    });

    return () => {
      cleanupFocus?.();
      cleanupEscape?.();
    };
  }, [profileOpen]);

  // Keyboard navigation and focus trap for mobile menu
  useEffect(() => {
    if (!menuOpen) return;

    const menuElement = mobileMenuRef.current;
    const previousActiveElement = document.activeElement;

    // Trap focus in mobile menu
    const cleanupFocus = trapFocus(menuElement, previousActiveElement);

    // Handle Escape key
    const cleanupEscape = handleEscapeKey(() => {
      setMenuOpen(false);
      // Return focus to hamburger button
      const hamburgerButton = document.querySelector('[aria-controls="kc-mobile-nav"]');
      hamburgerButton?.focus();
    });

    return () => {
      cleanupFocus?.();
      cleanupEscape?.();
    };
  }, [menuOpen]);

  // Close dropdowns on route change
  useEffect(() => {
    setProfileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Close profile dropdown when mobile menu opens
  useEffect(() => {
    if (menuOpen) {
      setProfileOpen(false);
    }
  }, [menuOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll with 120px threshold
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY >= 120);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setProfileOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const roleLink = user?.role === 'admin'
    ? '/admin/dashboard'
    : user?.role === 'brand'
      ? '/brand'
      : user?.role === 'designer'
        ? '/designer/dashboard'
        : '/';

  const cartCount = cart.items?.reduce((total, item) => total + (item.quantity || 1), 0) ?? 0;
  const isActive = (path) => location.pathname === path;

  // Calculate total header height for spacer
  const desktopNavHeight = isScrolled ? 68 : 88;
  const mobileNavHeight = isScrolled ? 62 : 68;

  return (
    <>
      {/* Main Navbar */}
      <header 
        className="fixed inset-x-0 top-0 z-[9999]"
      >
      <motion.nav
        initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
            'w-full transition-all duration-500 ease-out',
          isScrolled
              ? 'h-[68px] lg:h-[68px]'
              : 'h-[68px] lg:h-[88px]'
        )}
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
          background: isScrolled 
              ? 'linear-gradient(180deg, rgba(10, 37, 64, 0.98) 0%, rgba(10, 37, 64, 0.95) 100%)'
              : 'linear-gradient(180deg, rgba(10, 37, 64, 0.98) 0%, rgba(10, 37, 64, 0.96) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: isScrolled
              ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
              : '0 4px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="kc-container h-full">
            <div className="flex items-center justify-between h-full px-4 sm:px-5 lg:px-8">
              {/* Mobile: Hamburger | Desktop: Logo */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Mobile Hamburger */}
                <motion.button
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.93 }}
                  transition={{ duration: 0.2 }}
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="lg:hidden flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-white/30 hover:border-[#C7A36C] transition-all duration-300 cursor-pointer"
                  aria-expanded={menuOpen}
                  aria-controls="kc-mobile-nav"
                  aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
                  <AnimatePresence mode="wait">
                    {menuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X size={18} strokeWidth={2} className="text-[#F5EDE2]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu size={18} strokeWidth={2} className="text-[#F5EDE2]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Logo */}
          <Link 
            to="/" 
                  className="flex items-center gap-2 group"
            aria-label="The Kapda Co home"
          >
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <span 
                      className="text-[10px] sm:text-xs uppercase tracking-[0.5em] font-medium block leading-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245, 237, 226, 0.9), rgba(199, 163, 108, 0.8))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      The
                    </span>
                    <span 
                      className="text-xl sm:text-2xl lg:text-[27px] font-serif font-semibold tracking-tight block leading-tight"
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        color: '#F5EDE2',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      Kapda Co.
                    </span>
                    {/* Subtle glow on hover */}
                    <motion.span
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: 'radial-gradient(circle at center, rgba(199, 163, 108, 0.2), transparent 70%)',
                        filter: 'blur(8px)',
                        pointerEvents: 'none',
                      }}
                    />
                  </motion.div>
          </Link> 
              </div>

              {/* Desktop Navigation - Center */}
              <nav className="hidden lg:flex items-center gap-10 xl:gap-12" aria-label="Main navigation">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
              <Link 
                to={link.path} 
                className={cn(
                        'relative px-3 py-2.5 text-[15px] font-semibold uppercase tracking-[0.05em] transition-all duration-300 cursor-pointer',
                        isActive(link.path)
                          ? 'text-white'
                          : 'text-white/90 hover:text-white'
                )}
                style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textShadow: isActive(link.path) ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
                }}
              >
                {link.label}
                      {isActive(link.path) && (
                        <motion.span
                          layoutId="activeIndicator"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                          initial={false}
                          style={{ 
                            width: '32px',
                            background: 'linear-gradient(90deg, transparent, #C7A36C, transparent)',
                            boxShadow: '0 0 8px rgba(199, 163, 108, 0.6)',
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      {!isActive(link.path) && (
                        <motion.span
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                          initial={{ width: 0, opacity: 0 }}
                          whileHover={{ width: '32px', opacity: 1 }}
                          transition={{ duration: 0.3, ease: 'ease-out' }}
                  style={{
                            background: 'linear-gradient(90deg, transparent, #C7A36C, transparent)',
                            boxShadow: '0 0 6px rgba(199, 163, 108, 0.4)',
                  }}
                />
                      )}
              </Link>
                  </motion.div>
            ))}
                
                {/* Role-based links */}
            {user?.role === 'designer' && (
                  <Link
                    to="/designer/dashboard"
                    className={cn(
                      'relative px-3 py-2.5 text-[15px] font-semibold uppercase tracking-[0.05em] transition-all duration-300 cursor-pointer',
                      isActive('/designer/dashboard')
                        ? 'text-white'
                        : 'text-white/90 hover:text-white'
                    )}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textShadow: isActive('/designer/dashboard') ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
                    }}
                  >
                Designer
                    {isActive('/designer/dashboard') && (
                      <span 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                        style={{
                          width: '32px',
                          background: 'linear-gradient(90deg, transparent, #C7A36C, transparent)',
                          boxShadow: '0 0 8px rgba(199, 163, 108, 0.6)',
                        }}
                      />
                    )}
              </Link>
            )}
            {user?.role === 'brand' && (
                  <Link
                    to="/brand"
                    className={cn(
                      'relative px-3 py-2.5 text-[15px] font-semibold uppercase tracking-[0.05em] transition-all duration-300 cursor-pointer',
                      isActive('/brand')
                        ? 'text-white'
                        : 'text-white/90 hover:text-white'
                    )}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textShadow: isActive('/brand') ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
                    }}
                  >
                Brand
                    {isActive('/brand') && (
                      <span 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                        style={{
                          width: '32px',
                          background: 'linear-gradient(90deg, transparent, #C7A36C, transparent)',
                          boxShadow: '0 0 8px rgba(199, 163, 108, 0.6)',
                        }}
                      />
                    )}
              </Link>
            )}
            {user?.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={cn(
                      'relative px-3 py-2.5 text-[15px] font-semibold uppercase tracking-[0.05em] transition-all duration-300 cursor-pointer',
                      isActive('/admin/dashboard')
                        ? 'text-white'
                        : 'text-white/90 hover:text-white'
                    )}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textShadow: isActive('/admin/dashboard') ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
                    }}
                  >
                Admin
                    {isActive('/admin/dashboard') && (
                      <span 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                        style={{
                          width: '32px',
                          background: 'linear-gradient(90deg, transparent, #C7A36C, transparent)',
                          boxShadow: '0 0 8px rgba(199, 163, 108, 0.6)',
                        }}
                      />
                    )}
              </Link>
            )}
              </nav>

              {/* Right Actions - Icons */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Cart */}
                <motion.div
                  whileHover={shouldReduceMotion ? {} : { scale: 1.08, y: -2 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.93 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
            <Link 
              to="/cart" 
                    className="relative flex items-center justify-center w-[44px] h-[44px] rounded-full border-[1.5px] border-white/30 hover:border-[#C7A36C] transition-all duration-300 cursor-pointer group"
              style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
              aria-label={`View cart${cartCount ? ` with ${cartCount} items` : ''}`}
            >
                    <ShoppingBag 
                      size={19} 
                      strokeWidth={2} 
                      className="text-white group-hover:text-[#C7A36C] transition-colors duration-300"
                      style={{
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                      }}
                    />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C7A36C] text-[11px] font-bold text-[#0A2540] shadow-lg"
                        style={{
                          boxShadow: '0 2px 8px rgba(199, 163, 108, 0.5), 0 0 0 2px rgba(10, 37, 64, 0.1)',
                        }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </Link>
                </motion.div>

                {/* Profile Button - Hidden on mobile, shown on desktop */}
                <div className="relative hidden lg:block" ref={profileRef}>
                  <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.08, y: -2 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.93 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setProfileOpen(!profileOpen);
                      } else if (e.key === 'ArrowDown' && !profileOpen) {
                        e.preventDefault();
                        setProfileOpen(true);
                      }
                    }}
                className={cn(
                      'flex items-center justify-center w-[44px] h-[44px] rounded-full border-[1.5px] transition-all duration-300 cursor-pointer group focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2',
                      profileOpen
                        ? 'border-[#C7A36C] bg-white/15'
                        : 'border-white/30 hover:border-[#C7A36C]'
                )}
                style={{ 
                      backgroundColor: profileOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: profileOpen 
                        ? '0 4px 12px rgba(199, 163, 108, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                        : '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label={user ? `User menu for ${user.name || user.email}` : 'User menu'}
              >
                    <UserRound 
                      size={19} 
                      strokeWidth={2} 
                      className={cn(
                        'transition-colors duration-300',
                        profileOpen ? 'text-[#C7A36C]' : 'text-white group-hover:text-[#C7A36C]'
                      )}
                      style={{
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                      }}
                    />
                  </motion.button>

              {/* Desktop Profile Dropdown */}
              <AnimatePresence>
                {profileOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                          className="hidden lg:block fixed inset-0 z-[90]"
                      onClick={() => setProfileOpen(false)}
                      aria-hidden="true"
                    />
                    <motion.div
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          className="hidden lg:block absolute right-0 top-full min-w-[320px] w-auto rounded-2xl z-[100]"
                      role="menu"
                      style={{
                            marginTop: '0.75rem',
                            transformOrigin: 'top right',
                            maxWidth: 'calc(100vw - 2rem)',
                            background: 'linear-gradient(180deg, rgba(10, 37, 64, 0.98) 0%, rgba(10, 37, 64, 0.96) 100%)',
                            backdropFilter: 'blur(24px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 4px 16px rgba(199, 163, 108, 0.1)',
                          }}
                        >
                          {/* Arrow Indicator - Points upward to button */}
                          <div 
                            className="absolute -top-2 right-5 w-4 h-4"
                            style={{
                              transform: 'rotate(45deg)',
                              zIndex: 101,
                              background: 'linear-gradient(180deg, rgba(10, 37, 64, 0.98) 0%, rgba(10, 37, 64, 0.96) 100%)',
                              borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                              borderTop: '1px solid rgba(255, 255, 255, 0.25)',
                      }}
                            aria-hidden="true"
                          />
                          <div className="overflow-hidden rounded-2xl">
                        {!user ? (
                            <div className="p-4">
                              <ProfileMenuItem
                                href="/login"
                                icon={<UserRound size={18} strokeWidth={2} />}
                                label="Customer Login"
                                onSelect={() => setProfileOpen(false)}
                              />
                              <ProfileMenuItem
                                href="/designer/login"
                                icon={<ShieldCheck size={18} strokeWidth={2} />}
                                label="Designer Login"
                                onSelect={() => setProfileOpen(false)}
                              />
                              <ProfileMenuItem
                                href="/brand/login"
                                icon={<Truck size={18} strokeWidth={2} />}
                                label="Brand Login"
                                onSelect={() => setProfileOpen(false)}
                              />
                              <div className="h-px bg-white/15 my-3 mx-2" />
                              <ProfileMenuItem
                              href="/admin/login" 
                                icon={<Settings size={18} strokeWidth={2} />}
                              label="Admin Console" 
                              onSelect={() => setProfileOpen(false)}
                              isAdmin
                            />
                          </div>
                        ) : (
                            <div className="p-4">
                              {/* User Name Heading */}
                              {user?.name && (
                                <div 
                                  className="px-4 py-3 mb-2 border-b border-white/15"
                                  style={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                                  }}
                                >
                                  <p 
                                    className="text-white font-semibold text-base truncate"
                                    style={{
                                      fontWeight: 600,
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                    }}
                                    title={user.name}
                                  >
                                    {user.name}
                                  </p>
                                </div>
                              )}
                              <ProfileMenuItem
                                href={roleLink}
                                icon={<UserRound size={18} strokeWidth={2} />}
                                label="Dashboard"
                                onSelect={() => setProfileOpen(false)}
                              />
                              <ProfileMenuItem
                                href="/settings"
                                icon={<Settings size={18} strokeWidth={2} />}
                                label="Settings"
                                onSelect={() => setProfileOpen(false)}
                              />
                              <div 
                                className="h-px my-3 mx-2"
                                style={{
                                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                                }}
                              />
                            <button
                              type="button"
                              onClick={handleLogout}
                              disabled={isLoggingOut}
                                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-white hover:bg-white/15 hover:text-red-300 active:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
                              style={{
                                  fontWeight: 600,
                                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                              }}
                            >
                              {isLoggingOut ? (
                                <>
                                  <LoadingSpinner size={16} />
                                    <span style={{ fontWeight: 600 }}>Logging out...</span>
                                </>
                              ) : (
                                <>
                                    <LogOut 
                                      size={18} 
                                      strokeWidth={2} 
                                      className="text-white group-hover:text-red-300 transition-colors duration-300"
                                      style={{
                                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                                      }}
                                    />
                                    <span style={{ fontWeight: 600 }}>Logout</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
              </div>
          </div>
        </div>
      </motion.nav>
      </header>

      {/* Layout Spacer - Below Header */}
      <div 
        className="w-full navbar-spacer"
        style={{
          height: `${isScrolled ? 68 : 88}px`,
        }}
        aria-hidden="true"
      />

      {/* Mobile Menu - Slide from Right */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              ref={mobileMenuRef}
              id="kc-mobile-nav"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, duration: 0.32 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-[76%] max-w-sm z-[100] overflow-y-auto"
              style={{
                background: 'linear-gradient(180deg, rgba(10, 37, 64, 0.98) 0%, rgba(10, 37, 64, 0.95) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: '-8px 0 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div 
                  className="flex items-center justify-between p-7"
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <span 
                    className="text-xl font-semibold"
                    style={{
                      color: '#F5EDE2',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      fontFamily: 'Playfair Display, serif',
                    }}
                  >
                    Menu
                  </span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-white/15 transition-all duration-300 cursor-pointer"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                    aria-label="Close menu"
                  >
                    <X size={20} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                  </button>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex-1 px-7 py-10 space-y-7" aria-label="Mobile navigation">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.path}
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Link
                      to={link.path}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          'flex items-center justify-between text-[20px] font-semibold transition-all duration-300 cursor-pointer py-2 px-3 rounded-xl',
                          isActive(link.path) 
                            ? 'text-[#C7A36C] bg-white/10' 
                            : 'text-white hover:text-[#C7A36C] hover:bg-white/5'
                        )}
                      style={{
                          fontWeight: 600,
                          textShadow: isActive(link.path) ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
                        }}
                      >
                        <span>{link.label}</span>
                        <ChevronRight 
                          size={18} 
                          className={cn(
                            'transition-colors duration-300',
                            isActive(link.path) ? 'text-[#C7A36C]' : 'text-white/40'
                          )}
                        />
                      </Link>
                    </motion.div>
                  ))}

                  {/* Role-based mobile links */}
                  {user?.role === 'designer' && (
                    <Link
                      to="/designer/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between text-[20px] font-semibold text-white hover:text-[#C7A36C] transition-colors cursor-pointer"
                      style={{ fontWeight: 600 }}
                    >
                      <span>Designer</span>
                      <ChevronRight size={18} className="text-white/40" />
                    </Link>
                  )}
                  {user?.role === 'brand' && (
                    <Link
                      to="/brand"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between text-[20px] font-semibold text-white hover:text-[#C7A36C] transition-colors cursor-pointer"
                      style={{ fontWeight: 600 }}
                    >
                      <span>Brand</span>
                      <ChevronRight size={18} className="text-white/40" />
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between text-[20px] font-semibold text-white hover:text-[#C7A36C] transition-colors cursor-pointer"
                      style={{ fontWeight: 600 }}
                    >
                      <span>Admin</span>
                      <ChevronRight size={18} className="text-white/40" />
                    </Link>
                  )}
                </nav>

                {/* Mobile Profile Section */}
                <div className="p-7 border-t border-white/12 space-y-3">
                  {!user ? (
                    <>
                      <ProfileMenuItem
                        href="/login"
                        icon={<UserRound size={18} />}
                        label="Customer Login"
                        onSelect={() => setMenuOpen(false)}
                        isMobile
                      />
                      <ProfileMenuItem
                        href="/designer/login"
                        icon={<ShieldCheck size={18} />}
                        label="Designer Login"
                        onSelect={() => setMenuOpen(false)}
                        isMobile
                      />
                      <ProfileMenuItem
                        href="/brand/login"
                        icon={<Truck size={18} />}
                        label="Brand Login"
                        onSelect={() => setMenuOpen(false)}
                        isMobile
                      />
                      <div 
                        className="h-px my-3"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                        }}
                      />
                      <ProfileMenuItem
                        href="/admin/login"
                        icon={<Settings size={18} />}
                        label="Admin Console"
                        onSelect={() => setMenuOpen(false)}
                        isAdmin
                        isMobile
                      />
                    </>
                  ) : (
                    <>
                      {/* User Name Heading - Mobile */}
                      {user?.name && (
                        <div 
                          className="px-4 py-3 mb-2 border-b border-white/15"
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                          }}
                        >
                          <p 
                            className="text-white font-semibold text-base truncate"
                            style={{
                              fontWeight: 600,
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                            }}
                            title={user.name}
                          >
                            {user.name}
                          </p>
                        </div>
                      )}
                      <ProfileMenuItem
                        href={roleLink}
                        icon={<UserRound size={18} />}
                        label="Dashboard"
                        onSelect={() => setMenuOpen(false)}
                        isMobile
                      />
                      <ProfileMenuItem
                        href="/settings"
                        icon={<Settings size={18} />}
                        label="Settings"
                        onSelect={() => setMenuOpen(false)}
                        isMobile
                      />
                      <div 
                        className="h-px my-3"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                        }}
                      />
                  <button
                    type="button"
                    onClick={() => {
                          handleLogout();
                      setMenuOpen(false);
                        }}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-base font-semibold text-white hover:bg-white/10 active:bg-white/15 transition-colors duration-240 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        style={{ fontWeight: 600 }}
                      >
                        {isLoggingOut ? (
                          <>
                            <LoadingSpinner size={18} />
                            <span>Logging out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut size={18} />
                            <span>Logout</span>
                          </>
                        )}
                  </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Profile Menu Item Component
const ProfileMenuItem = ({ href, icon, label, onSelect, isAdmin = false, isMobile = false }) => {
  return (
  <Link
    to={href}
      onClick={onSelect}
    className={cn(
        'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer group',
        isMobile && 'text-base',
        isAdmin
          ? 'bg-[#C7A36C]/20 text-[#C7A36C] border border-[#C7A36C]/40 hover:bg-[#C7A36C]/30 hover:border-[#C7A36C]/60'
          : 'text-white hover:bg-white/12 hover:text-[#C7A36C] active:bg-white/15'
    )}
    style={{
        fontWeight: 600,
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    }}
    role="menuitem"
  >
    <span className={cn(
        'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 group-hover:scale-110',
        isMobile && 'w-10 h-10',
        isAdmin
          ? 'bg-[#C7A36C]/30 border border-[#C7A36C]/50 text-[#C7A36C]'
          : 'bg-white/15 border border-white/25 text-white group-hover:border-[#C7A36C]/50 group-hover:text-[#C7A36C]'
      )}
      style={{
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
      >
      {icon}
    </span>
      <span 
        className="flex-1 font-semibold transition-colors duration-300"
        style={{
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </span>
  </Link>
);
};

export default Navbar;
