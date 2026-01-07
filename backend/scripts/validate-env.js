#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * 
 * Validates that all required environment variables are set
 * and meet security requirements.
 * 
 * Usage: node scripts/validate-env.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLIENT_URL',
];

const recommended = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

let errors = [];
let warnings = [];

// Check required variables
required.forEach(key => {
  if (!process.env[key]) {
    errors.push(`Missing required: ${key}`);
  }
});

// Check JWT_SECRET strength
if (process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    warnings.push('JWT_SECRET is using default value - change it!');
  }
}

// Check recommended variables
recommended.forEach(key => {
  if (!process.env[key]) {
    warnings.push(`Missing recommended: ${key}`);
  }
});

// Check MONGODB_URI format
if (process.env.MONGODB_URI) {
  if (!process.env.MONGODB_URI.startsWith('mongodb://') && 
      !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }
}

// Output results
if (errors.length > 0) {
  console.error('\n❌ Validation failed:');
  errors.forEach(error => console.error(`   ${error}`));
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('\n⚠️  Warnings:');
  warnings.forEach(warning => console.warn(`   ${warning}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ All environment variables are valid!');
}

process.exit(0);

