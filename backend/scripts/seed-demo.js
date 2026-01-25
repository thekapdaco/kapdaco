#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';

import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import OptionType from '../src/models/OptionType.js';
import OptionValue from '../src/models/OptionValue.js';
import ProductMedia from '../src/models/ProductMedia.js';
import Design from '../src/models/Design.js';
import Review from '../src/models/Review.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');

if (!confirmed) {
  console.log('⚠️  This script is destructive. Re-run with --confirm to proceed.');
  process.exit(1);
}

const requireEnv = (key) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

const slugify = (value) => {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const uploadCache = new Map();
const uploadImage = async (absPath, folder) => {
  const key = `${folder}:${absPath}`;
  if (uploadCache.has(key)) return uploadCache.get(key);

  const baseName = path.parse(absPath).name;
  const result = await cloudinary.uploader.upload(absPath, {
    folder,
    public_id: baseName,
    overwrite: true,
    resource_type: 'image'
  });

  uploadCache.set(key, result.secure_url);
  return result.secure_url;
};

const upsertUserWithPassword = async ({ name, email, role, username, designerName }) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const update = {
    name,
    email: email.toLowerCase().trim(),
    password: passwordHash,
    role,
    isActive: true
  };

  if (role === 'designer') {
    update.username = username || slugify(email.split('@')[0]);
    update.designerName = designerName || name;
    update.bio = 'Designer at Kapdaco';
    update.city = 'Mumbai';
    update.country = 'India';
  }

  if (role === 'seller') {
    update.sellerProfile = {
      accountType: 'business',
      businessName: 'Kapdaco',
      brandName: 'Kapdaco'
    };
  }

  return User.findOneAndUpdate(
    { email: update.email },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const seedProductLegacy = async ({
  createdBy,
  title,
  description,
  category,
  gender,
  price,
  colors,
  sizes,
  imagesByColor,
  tags = [],
  status = 'published',
  isApproved = true,
  stockPerVariant = 25
}) => {
  const productImagesByColor = {};
  const allImages = [];

  for (const [color, images] of Object.entries(imagesByColor || {})) {
    productImagesByColor[color] = images;
    allImages.push(...images);
  }

  const uniqueImages = Array.from(new Set(allImages)).filter(Boolean);
  const mainImage = uniqueImages[0] || null;

  const variants = [];
  if (Array.isArray(colors) && colors.length > 0 && Array.isArray(sizes) && sizes.length > 0) {
    for (const color of colors) {
      for (const size of sizes) {
        variants.push({
          color,
          size,
          stock: stockPerVariant,
          images: productImagesByColor[color] || uniqueImages,
          sku: `${slugify(title).slice(0, 12)}-${slugify(color).slice(0, 6)}-${size}`,
          isDefault: variants.length === 0
        });
      }
    }
  }

  const productStock = variants.length > 0
    ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : stockPerVariant;

  const product = await Product.create({
    title,
    description,
    category,
    gender,
    tags,
    price,
    createdBy,
    images: uniqueImages,
    mainImage,
    imagesByColor: productImagesByColor,
    colors: colors || [],
    sizes: sizes || [],
    variants,
    stock: productStock,
    status,
    isApproved,
    material: 'Cotton',
    slug: `${slugify(title)}-${Date.now()}`
  });

  return product;
};

const seedDesign = async ({ designerId, title, imageUrl, category, basePrice }) => {
  return Design.create({
    designerId,
    title,
    description: 'Exclusive design by Kapdaco designer',
    imageUrl,
    category,
    basePrice,
    status: 'approved',
    isPublic: true,
    slug: `${slugify(title)}-${Date.now()}`
  });
};

const main = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kapda-co';
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected');
  try {
    if (process.env.CLOUDINARY_URL) {
      const u = new URL(process.env.CLOUDINARY_URL);
      cloudinary.config({
        cloud_name: u.hostname,
        api_key: decodeURIComponent(u.username),
        api_secret: decodeURIComponent(u.password),
        secure: true
      });
    } else {
      requireEnv('CLOUDINARY_CLOUD_NAME');
      requireEnv('CLOUDINARY_API_KEY');
      requireEnv('CLOUDINARY_API_SECRET');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    }

    try {
      await cloudinary.api.ping();
    } catch (e) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '(from CLOUDINARY_URL)';
      const cloudinaryMessage =
        e?.error?.message ||
        e?.message ||
        (typeof e === 'string' ? e : null) ||
        'Unknown Cloudinary error';
      throw new Error(
        `Cloudinary auth failed. ${cloudinaryMessage}. Check CLOUDINARY_CLOUD_NAME (case-sensitive) and API credentials. Current cloud name: ${cloudName}`
      );
    }

    const wipeUsers = args.includes('--wipe-users');
    const wipeOrders = args.includes('--wipe-orders');
    const wipeCarts = args.includes('--wipe-carts');
    const wipeReviews = args.includes('--wipe-reviews');

    console.log('🗑️  Deleting existing catalog data...');
    await Promise.all([
      ProductMedia.deleteMany({}),
      OptionValue.deleteMany({}),
      OptionType.deleteMany({}),
      Product.deleteMany({}),
      Design.deleteMany({}),
      ...(wipeReviews ? [Review.deleteMany({})] : []),
      ...(wipeCarts ? [Cart.deleteMany({})] : []),
      ...(wipeOrders ? [Order.deleteMany({})] : []),
      ...(wipeUsers ? [User.deleteMany({})] : [])
    ]);

    console.log('👤 Seeding users...');
    const admin = await upsertUserWithPassword({ name: 'Admin', email: 'admin@kapdaco.com', role: 'admin' });
    const seller = await upsertUserWithPassword({ name: 'Seller', email: 'seller@kapdaco.com', role: 'seller' });
    const customer = await upsertUserWithPassword({ name: 'Customer', email: 'customer@kapdaco.com', role: 'customer' });

  const designerEmails = [
    'rohan@kapdaco.com',
    'priya@kapdaco.com',
    'arjun@kapdaco.com',
    'sneha@kapdaco.com',
    'vikram@kapdaco.com'
  ];
  const designerNames = ['Rohan', 'Priya', 'Arjun', 'Sneha', 'Vikram'];

  const designers = [];
  for (let i = 0; i < designerEmails.length; i++) {
    designers.push(await upsertUserWithPassword({
      name: designerNames[i],
      email: designerEmails[i],
      role: 'designer',
      username: slugify(designerNames[i])
    }));
  }

  const seedImageDir = path.join(__dirname, '../../public/images/products');
  const img = (name) => path.join(seedImageDir, name);
  const folder = 'kapdaco/seed/products';
  const designFolder = 'kapdaco/seed/designs';

  const uploaded = {
    blackTee: await uploadImage(img('black-Tshirt.png'), folder),
    blackTeeBack: await uploadImage(img('BlackBack-Tshirt.png'), folder),
    whiteTee: await uploadImage(img('White-TShirt.png'), folder),
    whiteTeeBack: await uploadImage(img('WhiteBack-Tshirt.png'), folder),
    blueTee: await uploadImage(img('blue-TShirt.png'), folder),
    blueTeeBack: await uploadImage(img('BlueBack-Tshirt.png'), folder),
    redTee: await uploadImage(img('red-Tshirt.png'), folder),
    redTeeBack: await uploadImage(img('RedBack-Tshirt.png'), folder),
    greyTee: await uploadImage(img('grey-Tshirt.png'), folder),
    greyTeeBack: await uploadImage(img('GrayBack-Tshirt.png'), folder),
    blackHoodie: await uploadImage(img('Black-Hoodie.png'), folder),
    blackHoodieBack: await uploadImage(img('BlackBack-Hoodie.png'), folder),
    whiteHoodie: await uploadImage(img('white-Hoodie.png'), folder),
    navyHoodie: await uploadImage(img('Navy-Hoodie.png'), folder),
    redHoodie: await uploadImage(img('red-Hoodie.png'), folder),
    tote: await uploadImage(img('tote.png'), folder),
    blackTote: await uploadImage(img('blacktote.png'), folder),
    capBlack: await uploadImage(img('BlackCap.png'), folder),
    capWhite: await uploadImage(img('WhiteCap.png'), folder),
    mug: await uploadImage(img('WhiteMug.png'), folder),
    design1: await uploadImage(img('BlackBack-Tshirt.png'), designFolder),
    design2: await uploadImage(img('BlueBack-Hoodie.png'), designFolder)
  };

  const sizes = ['S', 'M', 'L', 'XL'];

  console.log('📦 Seeding products (men/women/accessories)...');
  await seedProductLegacy({
    createdBy: seller._id,
    title: 'Classic Tee',
    description: 'Everyday essential t-shirt.',
    category: 't-shirts',
    gender: 'men',
    price: 799,
    colors: ['Black', 'White', 'Blue', 'Red'],
    sizes,
    imagesByColor: {
      Black: [uploaded.blackTee, uploaded.blackTeeBack],
      White: [uploaded.whiteTee, uploaded.whiteTeeBack],
      Blue: [uploaded.blueTee, uploaded.blueTeeBack],
      Red: [uploaded.redTee, uploaded.redTeeBack],
    },
    tags: ['men', 't-shirt']
  });

  await seedProductLegacy({
    createdBy: seller._id,
    title: 'Minimal Tee',
    description: 'Clean, minimal tee for everyday wear.',
    category: 't-shirts',
    gender: 'men',
    price: 749,
    colors: ['Grey', 'Black'],
    sizes,
    imagesByColor: {
      Grey: [uploaded.greyTee, uploaded.greyTeeBack],
      Black: [uploaded.blackTee, uploaded.blackTeeBack]
    },
    tags: ['men', 't-shirt', 'minimal']
  });

  await seedProductLegacy({
    createdBy: seller._id,
    title: 'Everyday Graphic Tee',
    description: 'Lightweight graphic tee for streetwear fits.',
    category: 't-shirts',
    gender: 'men',
    price: 899,
    colors: ['White', 'Blue'],
    sizes,
    imagesByColor: {
      White: [uploaded.whiteTee, uploaded.whiteTeeBack],
      Blue: [uploaded.blueTee, uploaded.blueTeeBack]
    },
    tags: ['men', 't-shirt', 'streetwear']
  });

  await seedProductLegacy({
    createdBy: seller._id,
    title: 'Street Hoodie',
    description: 'Soft hoodie for all-day comfort.',
    category: 'hoodies',
    gender: 'men',
    price: 1599,
    colors: ['Black', 'White', 'Navy', 'Red'],
    sizes,
    imagesByColor: {
      Black: [uploaded.blackHoodie, uploaded.blackHoodieBack],
      White: [uploaded.whiteHoodie],
      Navy: [uploaded.navyHoodie],
      Red: [uploaded.redHoodie],
    },
    tags: ['men', 'hoodie']
  });

  await seedProductLegacy({
    createdBy: seller._id,
    title: "Women's Classic Tee",
    description: 'Comfort fit tee for women.',
    category: 't-shirts',
    gender: 'women',
    price: 799,
    colors: ['White', 'Red', 'Grey'],
    sizes,
    imagesByColor: {
      White: [uploaded.whiteTee, uploaded.whiteTeeBack],
      Red: [uploaded.redTee, uploaded.redTeeBack],
      Grey: [uploaded.greyTee, uploaded.greyTeeBack],
    },
    tags: ['women', 't-shirt']
  });

  await seedProductLegacy({
    createdBy: seller._id,
    title: "Women's Oversized Tee",
    description: 'Oversized silhouette, soft feel.',
    category: 't-shirts',
    gender: 'women',
    price: 899,
    colors: ['White', 'Black'],
    sizes,
    imagesByColor: {
      White: [uploaded.whiteTee, uploaded.whiteTeeBack],
      Black: [uploaded.blackTee, uploaded.blackTeeBack]
    },
    tags: ['women', 't-shirt', 'oversized']
  });

  await seedProductLegacy({
    createdBy: seller._id,
    title: "Women's Cozy Hoodie",
    description: 'A cozy hoodie made for everyday layering.',
    category: 'hoodies',
    gender: 'women',
    price: 1699,
    colors: ['White', 'Red'],
    sizes,
    imagesByColor: {
      White: [uploaded.whiteHoodie],
      Red: [uploaded.redHoodie]
    },
    tags: ['women', 'hoodie']
  });

  await seedProductLegacy({
    createdBy: seller._id,
    title: 'Everyday Tote',
    description: 'Carry your essentials in style.',
    category: 'accessories',
    gender: 'unisex',
    price: 499,
    colors: ['Natural', 'Black'],
    sizes: [],
    imagesByColor: {
      Natural: [uploaded.tote],
      Black: [uploaded.blackTote]
    },
    tags: ['accessories', 'tote']
  });

  await seedProductLegacy({
    createdBy: seller._id,
    title: 'Signature Cap',
    description: 'Adjustable cap.',
    category: 'accessories',
    gender: 'unisex',
    price: 399,
    colors: ['Black', 'White'],
    sizes: [],
    imagesByColor: {
      Black: [uploaded.capBlack],
      White: [uploaded.capWhite]
    },
    tags: ['accessories', 'cap']
  });

  await seedProductLegacy({
    createdBy: seller._id,
    title: 'Kapdaco Mug',
    description: 'Minimal white mug.',
    category: 'accessories',
    gender: 'unisex',
    price: 349,
    colors: ['White'],
    sizes: [],
    imagesByColor: {
      White: [uploaded.mug]
    },
    tags: ['accessories', 'mug']
  });

  console.log('🎨 Seeding designers: products + designs...');
  for (const d of designers) {
    await seedProductLegacy({
      createdBy: d._id,
      title: `${d.name} Designer Tee`,
      description: 'Limited designer drop.',
      category: 't-shirts',
      gender: 'unisex',
      price: 999,
      colors: ['Black', 'White'],
      sizes,
      imagesByColor: {
        Black: [uploaded.blackTee, uploaded.blackTeeBack],
        White: [uploaded.whiteTee, uploaded.whiteTeeBack]
      },
      tags: ['designer', slugify(d.name)]
    });

    await seedDesign({
      designerId: d._id,
      title: `${d.name} Graphic Design`,
      imageUrl: uploaded.design1,
      category: 't-shirt',
      basePrice: 299
    });
  }

    console.log('✅ Seed complete');
    console.log('Login password for all seeded users: Password123!');
    console.log(`Admin: ${admin.email}`);
    console.log(`Seller: ${seller.email}`);
    console.log(`Customer: ${customer.email}`);
    console.log(`Designers: ${designerEmails.join(', ')}`);
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
