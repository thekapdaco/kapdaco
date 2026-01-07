import React, { useEffect, Suspense, lazy } from "react";  
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants } from "./lib/motionVariants";
import { LoadingSpinner } from "./components/ui";

// Eager load critical pages
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Cart from "./pages/Cart";

// Lazy load heavy pages for code splitting
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Customize = lazy(() => import("./pages/customize/Customize"));
const Checkout = lazy(() => import("./pages/Checkout"));
const DesignerProfile = lazy(() => import("./pages/designers/DesignerProfile"));
const DesignerList = lazy(() => import("./pages/designers/DesignerList"));
const DesignerDashboard = lazy(() => import("./pages/designers/DesignerDashboard"));
const DesignerNewProduct = lazy(() => import("./pages/designers/NewProduct"));
const DesignerSignup = lazy(() => import("./pages/designers/DesignerSignup"));
const DesignerLogin = lazy(() => import("./pages/designers/DesignerLogin"));

// Admin pages (lazy load)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const Users = lazy(() => import("./pages/admin/Users"));
const Brands = lazy(() => import("./pages/admin/Brands"));
const Products = lazy(() => import("./pages/admin/Products"));
const Designs = lazy(() => import("./pages/admin/Designs"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Applications = lazy(() => import("./pages/admin/Applications"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));

// Brand pages (lazy load)
const BrandDashboard = lazy(() => import("./pages/brand/Dashboard"));
const BrandProducts = lazy(() => import("./pages/brand/Products"));
const BrandNewProduct = lazy(() => import("./pages/brand/NewProduct"));
const BrandLogin = lazy(() => import("./pages/brand/BrandLogin"));
const BrandSignup = lazy(() => import("./pages/brand/BrandSignup"));

// Category pages (lazy load)
const Men = lazy(() => import("./pages/categories/Men"));
const Women = lazy(() => import("./pages/categories/Women"));
const Accessories = lazy(() => import("./pages/categories/Accessories"));

// Other pages (lazy load)
import PrivateRoute from "./components/PrivateRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import OrderHistory from "./pages/OrderHistory";
import Addresses from "./pages/Addresses";
import CustomerLogin from "./pages/Customer/customerlogin";
import CustomerDashboard from "./pages/Customer/CustomerDashboard";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import ReturnRefundPolicy from "./pages/legal/ReturnRefundPolicy";
import OrderTracking from "./pages/OrderTracking";
import Contact from "./pages/support/Contact";
import FAQ from "./pages/support/FAQ";
import SizeGuide from "./pages/support/SizeGuide";
import Shipping from "./pages/support/Shipping";
import About from "./pages/company/About";
import Careers from "./pages/company/Careers";
import Sustainability from "./pages/company/Sustainability";
import Press from "./pages/company/Press";
import Artisans from "./pages/company/Artisans";
import PremiumThemeShowcase from "./pages/design/PremiumThemeShowcase";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { trackPageView } from "./lib/analytics";
import { ToastProvider } from "./components/Toast";

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div 
    className="flex items-center justify-center min-h-[60vh]"
    style={{ 
      background: 'var(--kc-bg-gradient)',
      paddingTop: 'var(--nav-height, 110px)'
    }}
  >
    <LoadingSpinner size={48} color="var(--kc-gold-200)" />
  </div>
);

function App() {
  const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
      try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch { window.scrollTo(0,0); }
      // Track page view on route change
      trackPageView(pathname, document.title);
    }, [pathname]);
    return null;
  };
  
  const AppContent = () => {
    const location = useLocation();
    const isCustomizePage = location.pathname.startsWith('/customize');
    
    return (
      <>
        <ScrollToTop />
        {!isCustomizePage && <Navbar />}
        <div className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route 
                  path="/product/:id" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ProductDetail />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/customize" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Customize />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/customize/:id" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Customize />
                    </Suspense>
                  } 
                />
                {/* Admin routes - Protected with role-based access control */}
                <Route element={<ProtectedRoute role="admin" />}> 
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminDashboard />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Users />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/admin/brands" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Brands />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/admin/products" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Products />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/admin/designs" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Designs />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/admin/orders" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Orders />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/admin/applications" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Applications />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/admin/settings" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminSettings />
                      </Suspense>
                    } 
                  />
                </Route>
                <Route path="/cart" element={<Cart />} />
                <Route 
                  path="/checkout" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Checkout />
                    </Suspense>
                  } 
                />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/addresses" element={<Addresses />} />
                <Route path="/login" element={<CustomerLogin />} />
                <Route path="/customer/login" element={<CustomerLogin />} />
                <Route path="/signup" element={<Signup />} />
                {/* Customer routes - Protected with role-based access control */}
                <Route element={<ProtectedRoute role="customer" />}>
                  <Route 
                    path="/customer/dashboard" 
                    element={<CustomerDashboard />} 
                  />
                </Route>
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route 
                  path="/admin/login" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminLogin />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/brand/login" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <BrandLogin />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/brand/signup" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <BrandSignup />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/shop/men" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Men />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/shop/women" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Women />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/shop/accessories" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Accessories />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/designers" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <DesignerList />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/designers/:id" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <DesignerProfile />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/designer/signup" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <DesignerSignup />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/designer/login" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <DesignerLogin />
                    </Suspense>
                  } 
                />
                {/* Designer routes - Protected with role-based access control */}
                <Route element={<ProtectedRoute role="designer" />}>
                  <Route 
                    path="/designer/dashboard" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <DesignerDashboard />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/designer/products/new" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <DesignerNewProduct />
                      </Suspense>
                    } 
                  />
                </Route>
                {/* Brand routes - Protected with role-based access control */}
                <Route element={<ProtectedRoute role="brand" />}> 
                  <Route 
                    path="/brand" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <BrandDashboard />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/brand/profile" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <BrandDashboard />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/brand/products" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <BrandProducts />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/brand/products/new" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <BrandNewProduct />
                      </Suspense>
                    } 
                  />
                </Route>
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/returns" element={<ReturnRefundPolicy />} />
                <Route path="/track-order" element={<OrderTracking />} />
                {/* Support pages */}
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/size-guide" element={<SizeGuide />} />
                <Route path="/shipping" element={<Shipping />} />
                {/* Company pages */}
                <Route path="/about" element={<About />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/sustainability" element={<Sustainability />} />
                <Route path="/press" element={<Press />} />
                <Route path="/blog" element={<Artisans />} />
                <Route path="/design-system" element={<PremiumThemeShowcase />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
          {!isCustomizePage && <Footer />}
        </>
    );
  };
  
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

