// Test Razorpay integration
// Run: node scripts/test-razorpay.js

import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../api/.env') });

console.log('\n🧪 Testing Razorpay Integration...\n');

// Check if keys are configured
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('📋 Configuration Check:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (!keyId) {
  console.error('❌ RAZORPAY_KEY_ID is not set in .env file');
  console.log('   Location: backend/api/.env');
  console.log('   Expected format: RAZORPAY_KEY_ID=rzp_test_...');
  process.exit(1);
} else {
  console.log('✅ RAZORPAY_KEY_ID is set');
  console.log(`   Value: ${keyId.substring(0, 15)}...`);
}

if (!keySecret) {
  console.error('❌ RAZORPAY_KEY_SECRET is not set in .env file');
  console.log('   Location: backend/api/.env');
  console.log('   Expected format: RAZORPAY_KEY_SECRET=...');
  process.exit(1);
} else {
  console.log('✅ RAZORPAY_KEY_SECRET is set');
  console.log(`   Value: ${keySecret.substring(0, 8)}...`);
}

console.log('\n🔧 Testing Razorpay Initialization:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  console.log('✅ Razorpay instance created successfully');
  console.log(`   Key ID: ${keyId}`);
  console.log(`   Mode: ${keyId.startsWith('rzp_test_') ? 'TEST' : 'LIVE'}`);

  // Test: Create a small test order (1 INR)
  console.log('\n🧪 Testing Order Creation:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const testOrder = await razorpay.orders.create({
    amount: 100, // 1 INR in paise
    currency: 'INR',
    receipt: `test_${Date.now()}`,
    notes: {
      test: 'true',
      description: 'Razorpay integration test'
    }
  });

  console.log('✅ Test order created successfully!');
  console.log(`   Order ID: ${testOrder.id}`);
  console.log(`   Amount: ₹${testOrder.amount / 100} ${testOrder.currency}`);
  console.log(`   Status: ${testOrder.status}`);
  console.log(`   Receipt: ${testOrder.receipt}`);

  console.log('\n✅ Razorpay Integration is WORKING! 🎉');
  console.log('\n📝 Next Steps:');
  console.log('   1. Restart your backend server: npm run dev');
  console.log('   2. Test payment flow in checkout page');
  console.log('   3. Use test card: 4111 1111 1111 1111');

} catch (error) {
  console.error('\n❌ Razorpay Test Failed!');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (error.error) {
    console.error(`   Error Code: ${error.error.code || 'UNKNOWN'}`);
    console.error(`   Error Description: ${error.error.description || error.message}`);
    
    if (error.error.code === 'BAD_REQUEST_ERROR') {
      console.error('\n💡 Possible Issues:');
      console.error('   - Invalid API keys (check key_id and key_secret)');
      console.error('   - Keys don\'t match (test key with live secret or vice versa)');
      console.error('   - Keys are revoked or expired');
    } else if (error.error.code === 'UNAUTHORIZED_ERROR') {
      console.error('\n💡 Possible Issues:');
      console.error('   - Invalid API key credentials');
      console.error('   - Key secret is incorrect');
    }
  } else {
    console.error(`   Error: ${error.message}`);
  }
  
  console.error('\n📋 Troubleshooting:');
  console.error('   1. Verify keys in backend/api/.env');
  console.error('   2. Make sure keys are from same Razorpay account');
  console.error('   3. Check if keys are test keys (rzp_test_...) or live keys');
  console.error('   4. Regenerate keys in Razorpay Dashboard if needed');
  
  process.exit(1);
}

