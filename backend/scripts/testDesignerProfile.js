// scripts/testDesignerProfile.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../api/.env') });

const testDesignerProfile = async () => {
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

    console.log(`👤 Designer: ${designer.name} (${designer._id})\n`);

    // Check products that should appear on profile
    const publishedProducts = await Product.find({
      createdBy: designer._id,
      status: 'published',
      isApproved: true
    });

    console.log(`📦 Published Products (should appear on profile): ${publishedProducts.length}`);
    publishedProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} - ${p.category} - ₹${p.price}`);
    });

    console.log(`\n📋 All Products Status:`);
    const allProducts = await Product.find({ createdBy: designer._id });
    const statusCounts = {
      published: allProducts.filter(p => p.status === 'published' && p.isApproved).length,
      pending: allProducts.filter(p => p.status === 'pending_review' && !p.isApproved).length,
      draft: allProducts.filter(p => p.status === 'draft' && !p.isApproved).length
    };
    console.log(`   Published: ${statusCounts.published}`);
    console.log(`   Pending: ${statusCounts.pending}`);
    console.log(`   Draft: ${statusCounts.draft}`);

    console.log(`\n🔗 Test URL:`);
    console.log(`   http://localhost:5173/designers/${designer._id}`);
    console.log(`   API: http://localhost:5000/api/public/designers/${designer._id}`);

    if (statusCounts.published === 0) {
      console.log(`\n⚠️  WARNING: No published products found!`);
      console.log(`   Products need to be approved by admin to appear on profile.`);
      console.log(`   Current published count: ${statusCounts.published}`);
      console.log(`   Pending products that need approval: ${statusCounts.pending}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
};

testDesignerProfile();

