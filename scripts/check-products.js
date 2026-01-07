#!/usr/bin/env node
/**
 * Check Products in Database
 * 
 * This script checks if products exist in the database and their status
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

// Import Product model
const Product = (await import('../backend/src/models/Product.js')).default;

const checkProducts = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kapda-co';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Count all products
    const totalProducts = await Product.countDocuments({});
    console.log(`📦 Total products in database: ${totalProducts}\n`);

    if (totalProducts === 0) {
      console.log('❌ No products found in database!');
      console.log('   Run the seed script: npm run seed (from backend directory)');
      await mongoose.disconnect();
      return;
    }

    // Count by status
    const published = await Product.countDocuments({ status: 'published' });
    const approved = await Product.countDocuments({ isApproved: true });
    const publishedAndApproved = await Product.countDocuments({ 
      status: 'published', 
      isApproved: true 
    });

    console.log('📊 Product Status Breakdown:');
    console.log(`   Published: ${published}`);
    console.log(`   Approved: ${approved}`);
    console.log(`   Published & Approved: ${publishedAndApproved}\n`);

    // Count by category
    const byCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] }
          },
          published: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('📂 Products by Category:');
    byCategory.forEach(cat => {
      console.log(`   ${cat._id || 'No category'}: ${cat.count} total (${cat.approved} approved, ${cat.published} published)`);
    });
    console.log('');

    // Show products that are NOT visible (not approved or not published)
    const notVisible = await Product.find({
      $or: [
        { isApproved: false },
        { status: { $ne: 'published' } }
      ]
    }).select('title category isApproved status').limit(10);

    if (notVisible.length > 0) {
      console.log('⚠️  Products NOT visible on website:');
      notVisible.forEach(product => {
        console.log(`   - ${product.title} (${product.category})`);
        console.log(`     Approved: ${product.isApproved}, Status: ${product.status}`);
      });
      console.log('');
    }

    // Show sample of visible products
    const visibleProducts = await Product.find({
      isApproved: true,
      status: 'published'
    })
    .select('title category price stock')
    .limit(5)
    .sort({ createdAt: -1 });

    if (visibleProducts.length > 0) {
      console.log('✅ Sample of visible products:');
      visibleProducts.forEach(product => {
        console.log(`   - ${product.title} (${product.category}) - ₹${product.price}`);
      });
      console.log('');
    } else {
      console.log('❌ No products are visible on the website!');
      console.log('   Products need: isApproved: true AND status: "published"');
      console.log('');
    }

    // Check if products match API query
    const menProducts = await Product.countDocuments({
      category: { $in: ['men', 'mens'] },
      isApproved: true,
      status: 'published'
    });
    const womenProducts = await Product.countDocuments({
      category: { $in: ['women', 'womens'] },
      isApproved: true,
      status: 'published'
    });
    const accessoriesProducts = await Product.countDocuments({
      category: 'accessories',
      isApproved: true,
      status: 'published'
    });

    console.log('🌐 Products visible via API:');
    console.log(`   Men's: ${menProducts}`);
    console.log(`   Women's: ${womenProducts}`);
    console.log(`   Accessories: ${accessoriesProducts}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

checkProducts();

