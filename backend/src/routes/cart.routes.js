import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getCart, addToCart, updateItem, removeItem, clearCart, validateCart } from "../controllers/cart.controller.js";

const r = Router();
r.use(auth);
r.get("/", getCart);
r.post("/add", addToCart);
r.post("/validate", validateCart);
r.patch("/item/:itemId", updateItem);
r.delete("/item/:itemId", removeItem);
r.delete("/clear", clearCart);

export default r;
