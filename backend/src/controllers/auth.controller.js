import User from "../models/User.js";
import { signToken } from "../utils/token.js";

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already used" });

  const allowedRoles = ["customer", "designer", "seller"];
  const safeRole = allowedRoles.includes(role) ? role : "customer";
  const user = await User.create({ name, email, password, role: safeRole });
  const token = signToken({ id: user._id, role: user.role, name: user.name });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.suspended) return res.status(403).json({ message: "Account suspended" });
  const ok = await user.compare(password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user._id, role: user.role, name: user.name });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

// NEW: return fresh user using token (for persistent session on page reload)
export const me = async (req, res) => {
  const u = await User.findById(req.user.id);
  if (!u) return res.status(404).json({ message: "User not found" });
  res.json({ user: { id: u._id, name: u.name, email: u.email, role: u.role } });
};
