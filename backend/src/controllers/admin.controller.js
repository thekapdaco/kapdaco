// controllers/admin.controller.js
import mongoose from "mongoose";
import User from "../models/User.js";
import DesignerApplication from "../models/DesignerApplication.js";
import Design from "../models/Design.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Commission from "../models/Commission.js";
import logger from "../utils/logger.js";

// User Management
export const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role = 'all', status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (role !== 'all') filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const users = await User
      .find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + users.length < total
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!['customer', 'designer', 'admin', 'brand'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User suspended successfully',
      user
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Failed to suspend user' });
  }
};

// Product/Design Management
export const listProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, approved = 'all', brandId } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (approved !== 'all') filter.isApproved = approved === 'true';
    if (brandId) filter.createdBy = brandId;

    const products = await Product
      .find(filter)
      .populate('createdBy', 'name email')
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
    console.error('List products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

export const approveProduct = async (req, res) => {
  try {
    const { productId, isApproved = true, adminNotes = '' } = req.body;
    
    const product = await Product.findById(productId).populate('createdBy', 'name email role');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = {
      isApproved: !!isApproved,
      adminNotes: adminNotes || product.adminNotes
    };
    
    // When approving, also set status to 'published' if it was pending_review
    if (isApproved) {
      updateData.status = 'published';
    } else {
      // When rejecting, set back to pending_review
      updateData.status = 'pending_review';
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    res.json({
      message: isApproved 
        ? 'Product approved and published successfully' 
        : 'Product rejected successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({ message: 'Failed to approve product' });
  }
};

// Reject a designer product
export const rejectProduct = async (req, res) => {
  try {
    const { productId, adminNotes = '' } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      {
        isApproved: false,
        status: 'pending_review', // Keep as pending_review so designer can resubmit
        adminNotes: adminNotes
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product rejected successfully',
      product
    });
  } catch (error) {
    console.error('Reject product error:', error);
    res.status(500).json({ message: 'Failed to reject product' });
  }
};

// Delete a product (admin can delete any product)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ 
      message: 'Product deleted successfully',
      productId: id
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

export const moderateDesign = async (req, res) => {
  try {
    const { designId, action, adminNotes = '' } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      adminNotes,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    };

    if (action === 'approve') {
      updateData.isPublic = true;
    }

    const design = await Design.findByIdAndUpdate(
      designId,
      updateData,
      { new: true }
    ).populate('designerId', 'name designerName email');

    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }

    res.json({
      message: `Design ${action}d successfully`,
      design
    });
  } catch (error) {
    console.error('Moderate design error:', error);
    res.status(500).json({ message: 'Failed to moderate design' });
  }
};

// List Designs for Admin Moderation
export const listDesigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', designerId } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status !== 'all') filter.status = status; // expected: 'pending' | 'approved' | 'rejected'
    if (designerId) filter.designerId = designerId;

    const designs = await Design
      .find(filter)
      .populate('designerId', 'name designerName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Design.countDocuments(filter);

    res.json({
      designs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + designs.length < total
      }
    });
  } catch (error) {
    console.error('List designs error:', error);
    res.status(500).json({ message: 'Failed to fetch designs' });
  }
};

// Order Management
export const listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', q = '', sort = 'newest' } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Search filter (order ID, tracking number)
    // For user search, we'll filter after populating
    if (q && q.trim()) {
      const searchQuery = q.trim();
      const searchOr = [
        { _id: { $regex: searchQuery, $options: 'i' } },
        { trackingNumber: { $regex: searchQuery, $options: 'i' } }
      ];
      
      // Try to find user IDs matching the search query
      try {
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        }).select('_id');
        
        if (matchingUsers.length > 0) {
          const userIds = matchingUsers.map(u => u._id);
          searchOr.push({ userId: { $in: userIds } });
        }
      } catch (err) {
        // If user search fails, continue with other filters
        logger.warn('User search in order list failed', { error: err.message });
      }
      
      filter.$or = searchOr;
    }

    // Build sort
    let sortOption = { createdAt: -1 }; // newest first (default)
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'total-asc') {
      sortOption = { total: 1 };
    } else if (sort === 'total-desc') {
      sortOption = { total: -1 };
    }

    // Fetch orders with populated user info
    const orders = await Order
      .find(filter)
      .populate('userId', 'name email')
      .populate('items.productId', 'title mainImage price')
      .populate('assignedDesigner', 'name designerName')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Transform orders to match frontend expectations
    const transformedOrders = orders.map(order => {
      const items = (order.items || []).map(item => {
        const product = item.productId;
        return {
          _id: item._id || item.productId?._id,
          productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
          title: product?.title || item.title || 'Product',
          name: product?.title || item.title || 'Product',
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
          mainImage: product?.mainImage || product?.images?.[0]
        };
      });

      return {
        ...order.toObject(),
        items,
        totals: {
          subtotal: order.total,
          total: order.total,
          cartDiscount: 0,
          shipping: 0,
          tax: 0
        }
      };
    });

    res.json({
      orders: transformedOrders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + orders.length < total,
        totalOrders: total
      }
    });
  } catch (error) {
    logger.error('List orders error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;

    // Add to status history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: status,
      changedAt: new Date(),
      changedBy: req.user.id,
      notes: notes || `${previousStatus} → ${status}`
    });

    // Update status
    order.status = status;

    // Set timestamps based on status
    if (status === 'shipped' && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
      
      // Approve pending commissions when order is delivered
      await Commission.updateMany(
        { orderId: order._id, status: 'pending' },
        { status: 'approved' }
      );
    }

    // If order is canceled/refunded, cancel commissions
    if (status === 'canceled' || status === 'refunded') {
      await Commission.updateMany(
        { orderId: order._id, status: { $in: ['pending', 'approved'] } },
        { status: 'cancelled' }
      );
    }

    await order.save();

    logger.info('Order status updated', { 
      orderId: id, 
      previousStatus, 
      newStatus: status,
      updatedBy: req.user.id 
    });

    // Populate before returning
    const populatedOrder = await Order.findById(id)
      .populate('userId', 'name email')
      .populate('items.productId', 'title mainImage price')
      .populate('assignedDesigner', 'name designerName');

    res.json({
      message: 'Order status updated successfully',
      order: populatedOrder
    });
  } catch (error) {
    logger.error('Update order status error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update order status' });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'title mainImage price description')
      .populate('assignedDesigner', 'name designerName email')
      .populate('statusHistory.changedBy', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    logger.error('Get order details error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch order details' });
  }
};

export const updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier, estimatedDelivery } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update tracking information
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

    // If tracking is added and order is not yet shipped, update status
    if (trackingNumber && order.status === 'processing') {
      order.status = 'shipped';
      order.shippedAt = new Date();
      
      // Add to status history
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        status: 'shipped',
        changedAt: new Date(),
        changedBy: req.user.id,
        notes: `Tracking added: ${trackingNumber}`
      });
    }

    await order.save();

    logger.info('Order tracking updated', { 
      orderId: id, 
      trackingNumber,
      carrier,
      updatedBy: req.user.id 
    });

    const populatedOrder = await Order.findById(id)
      .populate('userId', 'name email')
      .populate('items.productId', 'title mainImage price');

    res.json({
      message: 'Tracking information updated successfully',
      order: populatedOrder
    });
  } catch (error) {
    logger.error('Update tracking error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update tracking information' });
  }
};

// Dashboard Analytics
export const getDashboardStats = async (req, res) => {
  try {
    // Get various statistics
    const totalUsers = await User.countDocuments();
    const totalDesigners = await User.countDocuments({ role: 'designer' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    
    const totalDesigns = await Design.countDocuments();
    const pendingDesigns = await Design.countDocuments({ status: 'pending' });
    const approvedDesigns = await Design.countDocuments({ status: 'approved' });
    
    const pendingApplications = await DesignerApplication.countDocuments({ status: 'pending' });
    const totalApplications = await DesignerApplication.countDocuments();

    // Calculate growth (you could make this more sophisticated)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonth }
    });
    
    const newDesignsThisMonth = await Design.countDocuments({
      createdAt: { $gte: thisMonth }
    });

    res.json({
      users: {
        total: totalUsers,
        designers: totalDesigners,
        customers: totalCustomers,
        growth: newUsersThisMonth
      },
      designs: {
        total: totalDesigns,
        pending: pendingDesigns,
        approved: approvedDesigns,
        growth: newDesignsThisMonth
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications
      },
      revenue: {
        thisMonth: 0, // Placeholder - calculate from orders
        lastMonth: 0,
        growth: 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// System Settings
export const getSystemSettings = async (req, res) => {
  try {
    // Return system configuration
    res.json({
      commissionRate: 30,
      maxFileSize: 10,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      maintenanceMode: false,
      registrationOpen: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch system settings' });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // This would update system settings in database
    // For now, just return success
    res.json({
      message: 'System settings updated successfully',
      settings
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update system settings' });
  }
};