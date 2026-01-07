// controllers/designer.controller.js
import Product from "../models/Product.js";
import User from "../models/User.js";
import Commission from "../models/Commission.js";
import Order from "../models/Order.js";

// Get designer dashboard stats
export const myStats = async (req, res) => {
  try {
    const designerId = req.user.id;

    // Get product stats
    const productStats = await Product.aggregate([
      { $match: { createdBy: designerId } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          publishedProducts: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] }
          },
          pendingProducts: {
            $sum: { $cond: [{ $eq: ["$status", "pending_review"] }, 1, 0] }
          },
          draftProducts: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] }
          }
        }
      }
    ]);

    // Get commission stats
    const commissionStats = await Commission.aggregate([
      { $match: { designerId: designerId } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$commissionAmount" },
          paidEarnings: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$commissionAmount", 0]
            }
          },
          pendingEarnings: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$commissionAmount", 0]
            }
          },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Get monthly revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await Commission.aggregate([
      {
        $match: {
          designerId: designerId,
          status: { $in: ["approved", "paid"] },
          createdAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          revenueMtd: { $sum: "$commissionAmount" }
        }
      }
    ]);

    const productData = productStats[0] || {
      totalProducts: 0,
      publishedProducts: 0,
      pendingProducts: 0,
      draftProducts: 0
    };

    const commissionData = commissionStats[0] || {
      totalEarnings: 0,
      paidEarnings: 0,
      pendingEarnings: 0,
      totalOrders: 0
    };

    const monthlyData = monthlyStats[0] || { revenueMtd: 0 };

    res.json({
      ...productData,
      ...commissionData,
      revenueMtd: monthlyData.revenueMtd,
      totalOrders: commissionData.totalOrders,
      commissions: commissionData.pendingEarnings,
      balance: commissionData.paidEarnings,
      followerCount: 0, // TODO: Implement followers
      conversionRate: 0, // TODO: Calculate from analytics
      nextPayoutDate: null, // TODO: Calculate from payout schedule
      commissionPercent: 30 // Default commission rate
    });
  } catch (error) {
    console.error("Get designer stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// Get designer's products
export const listMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let filter = { createdBy: req.user.id };
    if (status !== 'all') {
      filter.status = status;
    }

    const products = await Product
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Product.countDocuments(filter);

    res.json({
      products: products,
      designs: products, // For backward compatibility
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + products.length < total
      }
    });
  } catch (error) {
    console.error("List designer products error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// Create/upload new product
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags = [],
      price,
      discountPrice,
      images = [],
      mainImage,
      variants = [],
      colors = [],
      sizes = [],
      material,
      status = "pending_review", // draft or pending_review
      commissionType = "percentage",
      commissionRate = 30,
      ...otherFields
    } = req.body;

    if (!title || !category || !price) {
      return res.status(400).json({
        message: "Missing required fields: title, category, price"
      });
    }

    // Ensure mainImage is set
    const primaryImage = mainImage || images[0];
    if (!primaryImage) {
      return res.status(400).json({
        message: "At least one image is required"
      });
    }

    // Create product with designer reference
    const product = await Product.create({
      title,
      description,
      category,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()),
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      createdBy: req.user.id,
      images: images.length > 0 ? images : [primaryImage],
      mainImage: primaryImage,
      variants: variants || [],
      colors: colors || [],
      sizes: sizes || [],
      material: material || "Cotton",
      status: status, // draft or pending_review
      isApproved: false, // Will be set to true when admin approves
      // Store commission settings in product (can be overridden per product)
      commissionType: commissionType,
      commissionRate: Number(commissionRate) || 30,
      ...otherFields
    });

    res.status(201).json({
      message: status === "draft" 
        ? "Product saved as draft" 
        : "Product submitted for review",
      product
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

// Update existing design
export const upsertDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let design;
    
    if (id) {
      // Update existing design
      design = await Design.findOne({ _id: id, designerId: req.user.id });
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      // If design was rejected, allow re-submission
      if (design.status === 'rejected') {
        updateData.status = 'pending';
        updateData.isPublic = false;
      }

      Object.assign(design, updateData);
      await design.save();
    } else {
      // Create new design (same as createProduct)
      return this.createProduct(req, res);
    }

    res.json({
      message: "Design updated successfully",
      design
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update design" });
  }
};

// Get designer's orders
export const listMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    // Find orders for products created by this designer
    let orderFilter = {};
    if (status !== 'all') {
      orderFilter.status = status;
    }

    const orders = await Order
      .find(orderFilter)
      .populate({
        path: 'productId',
        match: { createdBy: req.user.id },
        select: 'title mainImage price'
      })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out orders where product doesn't belong to designer
    const designerOrders = orders.filter(order => order.productId);

    const total = await Order.countDocuments(orderFilter);

    res.json({
      orders: designerOrders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + designerOrders.length < total
      }
    });
  } catch (error) {
    console.error("List designer orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// Mark order as shipped
export const markShipped = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify order belongs to designer's product
    const order = await Order.findById(id).populate('productId');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.productId.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }

    order.status = 'shipped';
    await order.save();

    res.json({
      message: "Order marked as shipped",
      order
    });
  } catch (error) {
    console.error("Mark shipped error:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
};

// Get earnings data
export const earnings = async (req, res) => {
  try {
    const designerId = req.user.id;

    // Calculate total earnings from commissions
    const earningsStats = await Commission.aggregate([
      { $match: { designerId: designerId } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [{ $in: ["$status", ["approved", "paid"]] }, "$commissionAmount", 0]
            }
          },
          paid: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$commissionAmount", 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$commissionAmount", 0]
            }
          },
          orders: { $sum: 1 }
        }
      }
    ]);

    const stats = earningsStats[0] || { total: 0, paid: 0, pending: 0, orders: 0 };

    // Get recent transactions
    const recentCommissions = await Commission
      .find({ designerId: designerId })
      .populate('orderId', 'status createdAt')
      .populate('productId', 'title mainImage')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('commissionAmount status createdAt orderId productId');

    res.json({
      total: stats.total,
      paid: stats.paid,
      pending: stats.pending,
      available: stats.paid, // Available for payout
      orders: stats.orders,
      recentTransactions: recentCommissions
    });
  } catch (error) {
    console.error("Get earnings error:", error);
    res.status(500).json({ message: "Failed to fetch earnings" });
  }
};