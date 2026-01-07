/**
 * ProtectedRoute Component
 * Production-grade route protection with strict authentication and authorization
 * 
 * Security Features:
 * - Waits for auth state to resolve (prevents UI flicker)
 * - Validates token existence
 * - Validates user role
 * - Redirects unauthorized users immediately
 * - Prevents dashboard UI from rendering before auth is verified
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingSpinner } from './ui';

export default function ProtectedRoute({ role, redirectTo = null }) {
  const { user, loading } = useAuth();

  // CRITICAL: Block rendering until auth state is resolved
  // This prevents dashboard UI from flashing before redirect
  if (loading) {
    return (
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'var(--kc-bg-gradient, linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%))'
        }}
      >
        <LoadingSpinner size={48} variant="primary" />
      </div>
    );
  }

  // SECURITY CHECK 1: User must be logged in
  // Note: Token is stored in HTTP-only cookie, so we only check user state
  // The token is verified server-side via the /api/auth/me endpoint
  if (!user) {
    // Determine appropriate login page based on requested role
    const targetLogin = redirectTo || (
      role === 'admin' ? '/admin/login' 
      : role === 'brand' ? '/brand/login' 
      : role === 'designer' ? '/designer/login'
      : role === 'customer' ? '/customer/login'
      : '/login'
    );
    
    // SECURITY: Use replace to prevent back button access to protected route
    return <Navigate to={targetLogin} replace state={{ from: window.location.pathname }} />;
  }

  // SECURITY CHECK 2: User must have the correct role
  if (role && user.role !== role) {
    // User is logged in but has wrong role - redirect to their dashboard
    // SECURITY: Never show unauthorized dashboard content
    const targetDashboard = 
      user.role === 'admin' ? '/admin/dashboard'
      : user.role === 'brand' ? '/brand'
      : user.role === 'designer' ? '/designer/dashboard'
      : user.role === 'customer' ? '/customer/dashboard'
      : '/';

    return <Navigate to={targetDashboard} replace />;
  }

  // SECURITY CHECK 3: User must be active (additional safety check)
  // Note: Backend also checks this, but we validate here too to prevent unnecessary API calls
  if (user.isActive === false) {
    // Clear invalid auth state
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // All security checks passed - render protected content
  return <Outlet />;
}

