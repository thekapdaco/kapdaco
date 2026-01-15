// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// API base URL from environment
const resolveApiBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) return String(envBase).trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    const host = (window.location.hostname || '').toLowerCase();
    if (host === 'kapdaco.vercel.app' || host.endsWith('.vercel.app')) {
      return 'https://kapdaco.onrender.com';
    }
  }
  return '';
};

const API_BASE_URL = resolveApiBaseUrl();

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // DEPRECATED: Token is now in HTTP-only cookie
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app start
  // SECURITY: Validates authentication via HTTP-only cookie on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verify authentication via HTTP-only cookie
        // SECURITY: Always verify with server (never trust client-side only)
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include' // Include cookies in request
        });
        
        if (response.ok) {
          // Try to parse as JSON, but handle non-JSON responses
          let userData;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            userData = await response.json();
            
            // SECURITY CHECK: Ensure user is still active
            if (userData.isActive === false) {
              // User was deactivated, clear auth state
              setToken(null);
              setUser(null);
              setLoading(false);
              return;
            }
            
            // User is authenticated and active - set auth state
            setUser(userData);
            setToken(null); // Token is in cookie, not in state
          } else {
            // Non-JSON response, not authenticated
            setToken(null);
            setUser(null);
          }
        } else if (response.status === 401) {
          // Not authenticated - clear auth state
          setToken(null);
          setUser(null);
        } else {
          // Other error - clear auth state to be safe
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        // Only log in development
        if (import.meta.env.DEV) {
          console.error('Auth initialization error:', error);
        }
        // Network error or other issue - clear auth state to be safe
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signup = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify(userData)
      });

      // Handle rate limit errors (429) which return plain text
      if (response.status === 429) {
        const text = await response.text();
        throw new Error(text || 'Too many signup attempts. Please try again later.');
      }

      // Try to parse as JSON, but handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'Signup failed');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Token is stored in HTTP-only cookie, only store user data
      setUser(data.user);

      return data;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ email, password })
      });

      // Handle rate limit errors (429) which return plain text
      if (response.status === 429) {
        const text = await response.text();
        throw new Error(text || 'Too many login attempts. Please try again later.');
      }

      // Try to parse as JSON, but handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'Login failed');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Token is stored in HTTP-only cookie, only store user data
      setUser(data.user);

      return data;
    } catch (error) {
      throw error;
    }
  };

  // SECURITY: Logout clears all auth state and cart data
  const logout = async () => {
    try {
      // Call backend logout endpoint to clear server-side session/cart and cookie
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include' // Include cookies in request
      });
    } catch (error) {
      // Continue with logout even if API call fails
      // Only log in development
      if (import.meta.env.DEV) {
        console.error('Logout API error:', error);
      }
    } finally {
      // SECURITY: Always clear client-side auth state
      setUser(null);
      
      // Clear cart data from localStorage if it exists
      try {
        localStorage.removeItem('cart');
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    token: null, // DEPRECATED: Token is now in HTTP-only cookie. Kept for backward compatibility.
    loading,
    signup,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isDesigner: user?.role === 'designer',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};