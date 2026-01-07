import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.js';
import User from '../models/User.js';


const run = async () => {
await connectDB();
const email = process.env.ADMIN_EMAIL || 'admin@kapdaco.com';
const password = process.env.ADMIN_PASSWORD || 'Admin@123';
const name = 'Super Admin';
const exists = await User.findOne({ email });
if (exists) {
console.log('Admin already exists:', email);
process.exit(0);
}
await User.create({ name, email, password, role: 'admin' });
console.log('✅ Admin created:', email);
process.exit(0);
};
run();