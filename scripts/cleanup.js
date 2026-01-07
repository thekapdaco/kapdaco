#!/usr/bin/env node
/**
 * Database Cleanup Script
 * 
 * Removes all data from collections (use with caution!)
 * 
 * Usage: node scripts/cleanup.js [--confirm]
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = (await import('../backend/src/models/User.js')).default;
const Product = (await import('../backend/src/models/Product.js')).default;
const Order = (await import('../backend/src/models/Order.js')).default;
const Review = (await import('../backend/src/models/Review.js')).default;
const Cart = (await import('../backend/src/models/Cart.js')).default;
const Design = (await import('../backend/src/models/Design.js')).default;
const DesignerApplication = (await import('../backend/src/models/DesignerApplication.js')).default;

const cleanupDatabase = async (confirmed = false) => {
  if (!confirmed) {
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('   Run with --confirm flag to proceed.');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kapda-co';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Deleting all data...');

    const results = {
      users: await User.deleteMany({}),
      products: await Product.deleteMany({}),
      orders: await Order.deleteMany({}),
      reviews: await Review.deleteMany({}),
      carts: await Cart.deleteMany({}),
      designs: await Design.deleteMany({}),
      applications: await DesignerApplication.deleteMany({}),
    };

    console.log('\n✅ Cleanup complete!');
    console.log('\n📊 Deleted:');
    Object.entries(results).forEach(([collection, result]) => {
      console.log(`   ${collection}: ${result.deletedCount} documents`);
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');

cleanupDatabase(confirmed)
  .then(() => {
    console.log('\n✨ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

