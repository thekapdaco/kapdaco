// routes/admin.routes.js
import { Router } from "express";
import { auth, isAdmin } from "../middleware/auth.js";
import { 
  getAllApplications, 
  approveApplication, 
  rejectApplication 
} from "../controllers/designerApp.controller.js";
import {
  listUsers,
  updateRole,
  suspendUser,
  // list sellers will reuse listUsers with role=seller, but we add a convenience route
  listProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
  listDesigns,
  moderateDesign,
  listOrders,
  updateOrderStatus,
  getOrderDetails,
  updateTracking,
  getDashboardStats,
  getSystemSettings,
  updateSystemSettings
} from "../controllers/admin.controller.js";

const router = Router();

// Apply admin authentication to all routes
router.use(auth, isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// User Management
router.get('/users', listUsers);
router.patch('/users/role', updateRole);
router.patch('/users/suspend', suspendUser);
// Convenience: list only sellers
router.get('/sellers', (req, res, next) => {
  req.query.role = 'seller';
  return listUsers(req, res, next);
});

// Designer Application Management
router.get('/applications', getAllApplications);
router.patch('/applications/approve', approveApplication);
router.patch('/applications/reject', rejectApplication);

// Product/Design Management
router.get('/products', listProducts);
router.patch('/products/approve', approveProduct);
router.patch('/products/reject', rejectProduct);
router.delete('/products/:id', deleteProduct);
router.get('/designs', listDesigns);
router.patch('/designs/moderate', moderateDesign);

// Order Management
router.get('/orders', listOrders);
router.get('/orders/:id', getOrderDetails);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:id/tracking', updateTracking);

// System Settings
router.get('/settings', getSystemSettings);
router.patch('/settings', updateSystemSettings);

export default router;