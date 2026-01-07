// Test script for automatic invoice generation and email
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import { generateInvoicePDF, generateInvoiceNumber } from '../src/services/invoice.service.js';
import { sendOrderConfirmation } from '../src/services/email.service.js';
import logger from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../api/.env') });

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapdaco';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const testInvoiceGeneration = async () => {
  console.log('\n🧪 Testing Invoice Generation & Email...\n');

  try {
    // 1. Find or create a test user
    console.log('1️⃣ Finding test user...');
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('   Creating test user...');
      testUser = await User.create({
        name: 'Test Customer',
        email: 'test@example.com',
        password: 'testpassword123',
        role: 'customer',
        phone: '+91 9876543210'
      });
      console.log(`   ✅ Created test user: ${testUser.email}`);
    } else {
      console.log(`   ✅ Found test user: ${testUser.email}`);
    }

    // 2. Find or create a test product
    console.log('\n2️⃣ Finding test product...');
    let testProduct = await Product.findOne({ title: 'Test Product for Invoice' });
    
    if (!testProduct) {
      // Find any existing product or create one
      const existingProduct = await Product.findOne({ isApproved: true, status: 'published' });
      if (existingProduct) {
        testProduct = existingProduct;
        console.log(`   ✅ Using existing product: ${testProduct.title}`);
      } else {
        console.log('   ⚠️  No approved products found. Creating test product...');
        // Create a simple test product
        const adminUser = await User.findOne({ role: 'admin' }) || testUser;
        testProduct = await Product.create({
          title: 'Test Product for Invoice',
          description: 'Test product for invoice generation',
          price: 999,
          discountPrice: 799,
          category: 't-shirts',
          createdBy: adminUser._id,
          isApproved: true,
          status: 'published',
          stock: 10,
          mainImage: 'https://via.placeholder.com/400'
        });
        console.log(`   ✅ Created test product: ${testProduct.title}`);
      }
    } else {
      console.log(`   ✅ Found test product: ${testProduct.title}`);
    }

    // 3. Create a test order
    console.log('\n3️⃣ Creating test order...');
    const orderData = {
      userId: testUser._id,
      items: [{
        productId: testProduct._id,
        quantity: 2,
        price: testProduct.discountPrice || testProduct.price,
        size: 'M',
        color: 'Black'
      }],
      total: (testProduct.discountPrice || testProduct.price) * 2,
      shippingAddress: {
        street: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        phone: '+91 9876543210'
      },
      paymentStatus: 'paid',
      paymentMethod: 'Online',
      paymentId: 'test_payment_12345',
      status: 'processing'
    };

    const testOrder = await Order.create(orderData);
    console.log(`   ✅ Created test order: ${testOrder._id}`);

    // 4. Generate invoice number
    console.log('\n4️⃣ Generating invoice number...');
    const invoiceNumber = generateInvoiceNumber(testOrder);
    testOrder.invoiceNumber = invoiceNumber;
    testOrder.invoiceGeneratedAt = new Date();
    await testOrder.save();
    console.log(`   ✅ Invoice number: ${invoiceNumber}`);

    // 5. Populate order for invoice generation
    console.log('\n5️⃣ Populating order data...');
    const populatedOrder = await Order.findById(testOrder._id)
      .populate('items.productId', 'title mainImage price')
      .populate('userId', 'name email phone');
    console.log(`   ✅ Order populated with ${populatedOrder.items.length} item(s)`);

    // 6. Generate invoice PDF
    console.log('\n6️⃣ Generating invoice PDF...');
    let invoiceBuffer;
    try {
      invoiceBuffer = await generateInvoicePDF(populatedOrder, testUser);
      console.log(`   ✅ Invoice PDF generated successfully (${(invoiceBuffer.length / 1024).toFixed(2)} KB)`);
    } catch (pdfError) {
      console.error('   ❌ Invoice PDF generation failed:', pdfError.message);
      throw pdfError;
    }

    // 7. Send email with invoice attachment
    console.log('\n7️⃣ Sending order confirmation email with invoice...');
    console.log(`   📧 Sending to: ${testUser.email}`);
    
    try {
      const emailResult = await sendOrderConfirmation(populatedOrder, testUser, invoiceBuffer, invoiceNumber);
      
      if (emailResult.success) {
        console.log('   ✅ Email sent successfully!');
        console.log(`   📧 Message ID: ${emailResult.messageId}`);
        console.log(`   📎 Invoice attached: Invoice-${invoiceNumber}.pdf`);
      } else {
        console.error('   ❌ Email sending failed:', emailResult.error);
      }
    } catch (emailError) {
      console.error('   ❌ Email error:', emailError.message);
      console.log('\n   ⚠️  Note: Email service might not be configured.');
      console.log('   Check SMTP settings in .env file:');
      console.log('   - SMTP_HOST');
      console.log('   - SMTP_USER');
      console.log('   - SMTP_PASS');
    }

    // 8. Summary
    console.log('\n📋 Test Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Order ID: ${testOrder._id}`);
    console.log(`✅ Invoice Number: ${invoiceNumber}`);
    console.log(`✅ Customer: ${testUser.name} (${testUser.email})`);
    console.log(`✅ Product: ${testProduct.title}`);
    console.log(`✅ Order Total: ₹${testOrder.total}`);
    console.log(`✅ Invoice PDF Size: ${(invoiceBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`✅ Email Status: ${emailResult?.success ? 'Sent ✅' : 'Failed ❌'}`);
    console.log('═══════════════════════════════════════\n');

    // 9. Cleanup (optional - comment out to keep test data)
    console.log('🧹 Cleaning up test order...');
    const cleanup = process.argv.includes('--keep') ? false : true;
    
    if (cleanup) {
      await Order.findByIdAndDelete(testOrder._id);
      console.log('   ✅ Test order deleted');
    } else {
      console.log('   ℹ️  Test order kept (use --keep flag to prevent cleanup)');
    }

    console.log('\n✅ Test completed successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Run test
(async () => {
  await connectDB();
  await testInvoiceGeneration();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
})();

