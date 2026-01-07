import { Router } from 'express';
import { auth, isDesigner } from '../middleware/auth.js';
import { myStats, listMyProducts, createProduct, upsertDesign, listMyOrders, markShipped, earnings } from '../controllers/designer.controller.js';


const r = Router();
r.use(auth, isDesigner);


r.get('/stats', myStats);
r.get('/products', listMyProducts);
r.post('/products', createProduct);
r.post('/designs', upsertDesign);
r.get('/orders', listMyOrders);
r.patch('/orders/:id/ship', markShipped);
r.get('/earnings', earnings);


export default r;