import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, SlidersHorizontal, Package } from "lucide-react";
import ProductCard from "../../components/ProductCard";
import api from "../../lib/api";
import "../../styles/accessories-collection.css";

const Accessories = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api('/api/public/products?category=accessories');
        setItems((data.products || []).map(p => ({ 
          id: p._id, 
          name: p.title, 
          price: p.price, 
          image: p.mainImage || p.images?.[0] || '',
          type: p.subcategory || 'other',
          variants: p.variants || [],
          colors: p.colors || []
        })));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Get unique filter options from items
  const filterOptions = useMemo(() => {
    const types = new Set(items.map(item => item.type).filter(Boolean));
    return Array.from(types).sort();
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    let result = [...items];
    
    // Filter
    if (filter !== "all") {
      result = result.filter(item => 
        item.type?.toLowerCase() === filter.toLowerCase()
      );
    }
    
    // Sort
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [items, filter, sortBy]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <div className="accessories-collection-page">
      {/* Hero Section */}
      <motion.section 
        className="collection-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="kc-container">
          <div className="hero-content">
            <motion.h1 
              className="collection-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Accessories Collection
            </motion.h1>
            <motion.p 
              className="collection-subtitle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Complete your look with our curated selection of essentials
            </motion.p>
            <motion.div 
              className="hero-decoration"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </motion.section>

      {/* Filter & Sort Bar */}
      <motion.div 
        className="kc-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="filter-sort-bar premium-noise">
          <div className="filter-section">
            <div className="filter-header">
              <Filter size={18} className="filter-icon" />
              <label className="filter-label">Filter by Category</label>
            </div>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
                aria-pressed={filter === 'all'}
              >
                <span>All</span>
                <span className="filter-count">{items.length}</span>
              </button>
              {filterOptions.map(option => {
                const count = items.filter(item => 
                  item.type?.toLowerCase() === option.toLowerCase()
                ).length;
                return (
                  <button
                    key={option}
                    className={`filter-btn ${filter === option.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setFilter(option.toLowerCase())}
                    aria-pressed={filter === option.toLowerCase()}
                  >
                    <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                    <span className="filter-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sort-section">
            <div className="sort-header">
              <SlidersHorizontal size={18} className="sort-icon" />
              <label className="sort-label" htmlFor="sort-select">Sort by</label>
            </div>
            <div className="sort-wrapper">
              <select 
                id="sort-select"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Products Section */}
      <div className="container resp-no-overflow">
        <div className="products-container">
          {loading && (
            <motion.div 
              className="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="loading-spinner"></div>
              <p className="loading-text">Curating your collection...</p>
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              className="error-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="error-icon">⚠</div>
              <p className="error-text">{error}</p>
              <button 
                className="retry-btn kc-btn" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </motion.div>
          )}
          
          <AnimatePresence mode="wait">
            {!loading && !error && filteredAndSorted.length === 0 && (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="empty-icon">📦</div>
                <p className="empty-text">No products found</p>
                <p className="empty-subtext">Try adjusting your filters</p>
                <button 
                  className="reset-filters-btn kc-btn-secondary"
                  onClick={() => {
                    setFilter('all');
                    setSortBy('featured');
                  }}
                >
                  Reset Filters
                </button>
              </motion.div>
            )}

            {!loading && !error && filteredAndSorted.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={containerVariants}
              >
                <motion.div 
                  className="products-count"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Package size={18} className="count-icon" />
                  <span className="count-number">{filteredAndSorted.length}</span> 
                  <span className="count-text">
                    {filteredAndSorted.length === 1 ? 'product' : 'products'} available
                  </span>
                </motion.div>
                <motion.div 
                  className="product-grid"
                  variants={containerVariants}
                >
                  <AnimatePresence>
                    {filteredAndSorted.map((prod, index) => (
                      <motion.div
                        key={prod.id}
                        variants={itemVariants}
                        layout
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ProductCard {...prod} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Accessories;