// scripts/checkDesignerProducts.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../api/.env') });

const checkDesignerProducts = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapdaco';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find designer
    const designer = await User.findOne({ role: 'designer', email: 'designer@example.com' });
    if (!designer) {
      console.error('❌ Designer not found');
      process.exit(1);
    }

    console.log('👤 Designer:');
    console.log(`   ID: ${designer._id}`);
    console.log(`   Email: ${designer.email}`);
    console.log(`   Name: ${designer.name}\n`);

    // Check all products
    const allProducts = await Product.find({ createdBy: designer._id });
    console.log(`📦 Total Products: ${allProducts.length}\n`);

    // Check published products (should show on profile)
    const publishedProducts = await Product.find({ 
      createdBy: designer._id,
      status: 'published',
      isApproved: true
    });
    console.log(`✅ Published & Approved Products: ${publishedProducts.length}`);
    publishedProducts.forEach(p => {
      console.log(`   - ${p.title} (${p.category})`);
    });

    // Check pending products
    const pendingProducts = await Product.find({ 
      createdBy: designer._id,
      status: 'pending_review'
    });
    console.log(`\n⏳ Pending Review: ${pendingProducts.length}`);
    pendingProducts.forEach(p => {
      console.log(`   - ${p.title} (${p.category})`);
    });

    // Check draft products
    const draftProducts = await Product.find({ 
      createdBy: designer._id,
      status: 'draft'
    });
    console.log(`\n📝 Draft Products: ${draftProducts.length}`);
    draftProducts.forEach(p => {
      console.log(`   - ${p.title} (${p.category})`);
    });

    console.log(`\n💡 To see products on designer profile:`);
    console.log(`   1. Products must have status: 'published'`);
    console.log(`   2. Products must have isApproved: true`);
    console.log(`   3. Currently ${publishedProducts.length} products will show on profile`);
    if (pendingProducts.length > 0) {
      console.log(`   4. Approve ${pendingProducts.length} pending products as admin to make them visible`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkDesignerProducts();

