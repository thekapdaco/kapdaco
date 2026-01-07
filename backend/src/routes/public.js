// routes/public.js - Updated to fetch from MongoDB Atlas
import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Design from '../models/Design.js';
import Product from '../models/Product.js';
import { transformProductForAPI } from '../utils/variantUtils.js';
import logger from '../utils/logger.js';
import * as newsletterController from '../controllers/newsletter.controller.js';

const router = Router();

// Get all approved designers for public listing
router.get('/designers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, specialty } = req.query;
    const skip = (page - 1) * limit;

    let filter = { 
      role: 'designer', 
      isActive: true 
    };

    // Add search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { designerName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const designers = await User
      .find(filter)
      .select('name designerName username bio city country instagram portfolioUrl totalSales rating reviewCount createdAt')
      .sort({ totalSales: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add computed stats for each designer
    const designersWithStats = await Promise.all(
      designers.map(async (designer) => {
        const stats = await Design.aggregate([
          { $match: { designerId: designer._id, status: 'approved' } },
          {
            $group: {
              _id: null,
              productCount: { $sum: 1 },
              totalViews: { $sum: '$views' }
            }
          }
        ]);

        // Get stats from Product model (new system)
        const productStats = await Product.aggregate([
          { $match: { createdBy: designer._id, status: 'published', isApproved: true } },
          {
            $group: {
              _id: null,
              productCount: { $sum: 1 }
            }
          }
        ]);

        const productData = productStats[0] || { productCount: 0 };
        const designData = stats[0] || { productCount: 0, totalViews: 0 };
        const designerStats = {
          productCount: productData.productCount + designData.productCount,
          totalViews: designData.totalViews
        };

        // Get designer's specialties from products and designs
        const productCategories = await Product.distinct('category', {
          createdBy: designer._id,
          status: 'published',
          isApproved: true
        });
        
        const designSpecialties = await Design.distinct('specialties', {
          designerId: designer._id,
          status: 'approved'
        });

        return {
          ...designer.toObject(),
          productCount: designerStats.productCount,
          followerCount: Math.floor(Math.random() * 1000) + 100, // Placeholder for now
          specialties: [...new Set([...productCategories, ...designSpecialties.flat()])],
          experience: getExperienceLevel(designer.createdAt)
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      designers: designersWithStats,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + designers.length < total
      }
    });
  } catch (error) {
    console.error('Failed to fetch designers:', error);
    res.status(500).json({ message: 'Failed to fetch designers' });
  }
});

// Helper function to determine experience level
function getExperienceLevel(joinedDate) {
  const monthsActive = Math.floor((new Date() - new Date(joinedDate)) / (1000 * 60 * 60 * 24 * 30));
  
  if (monthsActive < 12) return "Beginner (0-1 years)";
  if (monthsActive < 36) return "Intermediate (2-3 years)";
  if (monthsActive < 72) return "Advanced (4-6 years)";
  if (monthsActive < 120) return "Expert (7-10 years)";
  return "Master (10+ years)";
}

// Get specific designer profile
router.get('/designers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.header('Authorization');
    let isOwnProfile = false;
    let viewerId = null;

    // Check if user is viewing their own profile
    if (authHeader) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        viewerId = decoded.id;
        isOwnProfile = viewerId === id;
      } catch (e) {
        // Invalid token, treat as public view
      }
    }

    const designer = await User
      .findById(id)
      .select('name designerName username bio city country instagram behance dribbble website portfolioUrl totalSales rating reviewCount createdAt role isActive');

    if (!designer || designer.role !== 'designer' || !designer.isActive) {
      return res.status(404).json({ message: 'Designer not found' });
    }

    // Get designer's products
    // For public profile, show published AND pending_review products (pending shows designer is active)
    // Draft products are only visible to the designer themselves (handled in authenticated routes)
    const products = await Product
      .find({ 
        createdBy: id, 
        status: { $in: ['published', 'pending_review'] }, // Show published and pending
        // Don't filter by isApproved here - pending_review products might not be approved yet
      })
      .select('title description mainImage images category tags price discountPrice colors sizes material createdAt status isApproved')
      .sort({ createdAt: -1 })
      .limit(50);

    // Also get legacy Design model products for backward compatibility
    const legacyDesigns = await Design
      .find({ designerId: id, status: 'approved', isPublic: true })
      .select('title description imageUrl category tags basePrice views likes sales slug createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    // Combine and format products
    const productsFormatted = products.map(product => ({
      _id: product._id,
      title: product.title,
      description: product.description,
      imageUrl: product.mainImage || product.images?.[0],
      images: product.images || [product.mainImage],
      category: product.category,
      tags: product.tags || [],
      price: product.discountPrice || product.price,
      originalPrice: product.discountPrice ? product.price : null,
      basePrice: product.price,
      colors: product.colors || [],
      sizes: product.sizes || [],
      material: product.material,
      status: product.status || 'published', // Use actual status
      approved: product.isApproved || false, // Use actual approval status
      isApproved: product.isApproved || false,
      createdAt: product.createdAt
    }));

    // Format legacy designs
    const designsFormatted = legacyDesigns.map(design => ({
      ...design.toObject(),
      price: Math.round(design.basePrice * 1.43), // 30% commission + markup
      originalPrice: Math.round(design.basePrice * 1.43 * 1.4), // Show as if discounted
      rating: 4.5 + Math.random() * 0.4, // Mock rating for now
      reviews: Math.floor(Math.random() * 100) + 20 // Mock review count
    }));

    // Combine both
    const allDesigns = [...productsFormatted, ...designsFormatted];

    // Get product stats from Product model
    const productStats = await Product.aggregate([
      { $match: { createdBy: designer._id, status: 'published', isApproved: true } },
      {
        $group: {
          _id: null,
          totalDesigns: { $sum: 1 }
        }
      }
    ]);

    // Get legacy design stats
    const designStats = await Design.aggregate([
      { $match: { designerId: designer._id, status: 'approved' } },
      {
        $group: {
          _id: null,
          totalDesigns: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          totalSales: { $sum: '$sales' }
        }
      }
    ]);

    const productData = productStats[0] || { totalDesigns: 0 };
    const designData = designStats[0] || {
      totalDesigns: 0,
      totalViews: 0,
      totalLikes: 0,
      totalSales: 0
    };

    const stats = {
      totalDesigns: productData.totalDesigns + designData.totalDesigns,
      totalViews: designData.totalViews,
      totalLikes: designData.totalLikes,
      totalSales: designData.totalSales
    };

    // Get unique specialties from products (tags/category)
    const productCategories = await Product.distinct('category', {
      createdBy: designer._id,
      status: 'published',
      isApproved: true
    });

    // Get specialties from legacy designs
    const designSpecialties = await Design.distinct('specialties', {
      designerId: designer._id,
      status: 'approved'
    });

    const specialties = [...new Set([...productCategories, ...designSpecialties.flat()])];

    res.json({
      designer: {
        ...designer.toObject(),
        ...stats,
        specialties: specialties.flat(),
        experience: getExperienceLevel(designer.createdAt),
        designStyle: "Contemporary & Bold", // Can be added to User model later
        inspiration: "Life experiences and cultural diversity", // Can be added to User model later
        joinedDate: designer.createdAt,
        badges: generateBadges(stats), // Generate based on performance
        social: {
          instagram: designer.instagram,
          behance: designer.behance,
          dribbble: designer.dribbble,
          website: designer.website
        }
      },
      designs: allDesigns
    });
  } catch (error) {
    console.error('Failed to fetch designer profile:', error);
    res.status(500).json({ message: 'Failed to fetch designer profile' });
  }
});

// Helper function to generate badges based on performance
function generateBadges(stats) {
  const badges = [];
  
  if (stats.totalSales > 1000) badges.push("Top Seller");
  if (stats.totalDesigns > 20) badges.push("Prolific Creator");
  if (stats.totalViews > 5000) badges.push("Popular Designer");
  if (stats.totalLikes > 300) badges.push("Community Favorite");
  
  // Default badges for newer designers
  if (badges.length === 0) {
    badges.push("Rising Star", "Quality Creator");
  }
  
  return badges;
}

// Get all approved designs (public product catalog)
router.get('/designs', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, designerId } = req.query;
    const skip = (page - 1) * limit;

    let filter = { 
      status: 'approved', 
      isPublic: true 
    };

    if (category && category !== 'all') filter.category = category;
    if (designerId) filter.designerId = designerId;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const designs = await Design
      .find(filter)
      .populate('designerId', 'name designerName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add pricing markup for frontend display
    const designsWithPricing = designs.map(design => ({
      ...design.toObject(),
      price: Math.round(design.basePrice * 1.43),
      originalPrice: Math.round(design.basePrice * 1.43 * 1.4),
      rating: 4.5 + Math.random() * 0.4,
      reviews: Math.floor(Math.random() * 100) + 20
    }));

    const total = await Design.countDocuments(filter);

    res.json({
      designs: designsWithPricing,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + designs.length < total
      }
    });
  } catch (error) {
    console.error('Failed to fetch designs:', error);
    res.status(500).json({ message: 'Failed to fetch designs' });
  }
});

// Get categories with counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await Design.aggregate([
      { $match: { status: 'approved', isPublic: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Get a single approved product by ID (seller product)
// Returns structured product data with options, variants, and media
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { color } = req.query; // Optional: filter by color
    
    // Validate ObjectId to avoid cast errors
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    
    const product = await Product
      .findOne({ 
        _id: id, 
        isApproved: true,
        status: 'published'
      })
      .populate('createdBy', 'name designerName')
      .populate('variants.optionValueIds') // Populate option values
      .select('-__v');
      
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not approved' });
    }

    // Transform to new structured format
    try {
      const structuredProduct = await transformProductForAPI(product, true);
      
      // If color query parameter provided, filter media
      if (color) {
        const colorOptionValue = structuredProduct.options
          .find(opt => opt.name === 'Color')
          ?.values.find(val => val.id === color || val.value.toLowerCase() === color.toLowerCase());
        
        if (colorOptionValue) {
          const { getMediaForColor } = await import('../utils/variantUtils.js');
          structuredProduct.media = await getMediaForColor(product._id, colorOptionValue.id);
        }
      }

      // Add brand information
      if (product.createdBy) {
        structuredProduct.brand = {
          id: product.createdBy._id.toString(),
          name: product.createdBy.designerName || product.createdBy.name || 'Kapda Atelier'
        };
      }

      res.json({ product: structuredProduct });
    } catch (transformError) {
      logger.error('Error transforming product for API', {
        productId: id,
        error: transformError.message
      });
      
      // Fallback to legacy format if transformation fails
      res.json({ product });
    }
  } catch (error) {
    logger.error('Failed to fetch product by id', {
      productId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Public approved products listing (seller products)
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const skip = (page - 1) * limit;

    // Only show approved and published products
    const filter = { 
      isApproved: true,
      status: 'published'
    };

    // Handle category/gender filter
    let categoryFilter = null;
    if (category && category !== 'all') {
      let normalizedCat = String(category).toLowerCase().trim();
      // Normalize plural forms to singular (mens -> men, womens -> women)
      if (normalizedCat === 'mens') normalizedCat = 'men';
      if (normalizedCat === 'womens') normalizedCat = 'women';

      // If the requested category is actually a gender selection,
      // map it to the gender field instead of category
      if (normalizedCat === 'men' || normalizedCat === 'women') {
        categoryFilter = { gender: normalizedCat };
      } else {
        // Support querying both singular and plural forms for backwards compatibility
        const categoryValues = [normalizedCat];
        
        // Add plural form check if querying singular (e.g., accessory variants)
        if (normalizedCat === 'accessory') {
          categoryValues.push('accessories');
        } else if (normalizedCat === 'accessories') {
          categoryValues.push('accessory');
        }

        // Store category filter separately to combine properly
        categoryFilter = { category: { $in: categoryValues } };
      }
    }

    // Handle search filter
    let searchFilter = null;
    if (search) {
      searchFilter = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      };
    }

    // Combine filters properly
    if (categoryFilter && searchFilter) {
      // Both category/gender and search - use $and
      filter.$and = [categoryFilter, searchFilter];
    } else if (categoryFilter) {
      // Only category/gender - merge directly
      Object.assign(filter, categoryFilter);
    } else if (searchFilter) {
      // Only search
      filter.$or = searchFilter.$or;
    }

    const products = await Product
      .find(filter)
      .populate('createdBy', 'name')
      .select('-__v') // Exclude version key
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + products.length < total
      }
    });
  } catch (error) {
    logger.error('Failed to fetch products', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      requestId: req.requestId || 'unknown'
    });
    console.error('Failed to fetch products:', error);
    res.status(500).json({ 
      message: 'Failed to fetch products',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Newsletter subscription routes
router.post('/newsletter/subscribe', newsletterController.subscribe);
router.post('/newsletter/unsubscribe', newsletterController.unsubscribe);
router.get('/newsletter/status', newsletterController.getSubscriptionStatus);

export default router;