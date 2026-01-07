// Test email service (Nodemailer)
// Run: node scripts/test-email.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail, sendWelcomeEmail } from '../src/services/email.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../api/.env') });

console.log('\n🧪 Testing Email Service (Nodemailer)...\n');

// Check configuration
console.log('📋 Configuration Check:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM;

if (!smtpHost) {
  console.error('❌ SMTP_HOST is not set in .env file');
  console.log('   Location: backend/api/.env');
  console.log('   Expected format: SMTP_HOST=smtp.sendgrid.net');
  console.log('\n💡 Setup Guide:');
  console.log('   1. Sign up at SendGrid: https://signup.sendgrid.com/');
  console.log('   2. Create API key in SendGrid Dashboard');
  console.log('   3. Verify sender email');
  console.log('   4. Add credentials to backend/api/.env');
  process.exit(1);
} else {
  console.log('✅ SMTP_HOST is set');
  console.log(`   Value: ${smtpHost}`);
}

if (!smtpPort) {
  console.warn('⚠️  SMTP_PORT is not set, using default: 587');
} else {
  console.log('✅ SMTP_PORT is set');
  console.log(`   Value: ${smtpPort}`);
}

if (!smtpUser) {
  console.error('❌ SMTP_USER is not set in .env file');
  console.log('   Location: backend/api/.env');
  console.log('   Expected format: SMTP_USER=apikey (for SendGrid)');
  process.exit(1);
} else {
  console.log('✅ SMTP_USER is set');
  console.log(`   Value: ${smtpUser.substring(0, 8)}...`);
}

if (!smtpPass) {
  console.error('❌ SMTP_PASS is not set in .env file');
  console.log('   Location: backend/api/.env');
  console.log('   Expected format: SMTP_PASS=SG.xxxxxxxxxxxxx (SendGrid API Key)');
  process.exit(1);
} else {
  console.log('✅ SMTP_PASS is set');
  console.log(`   Value: ${smtpPass.substring(0, 8)}...`);
}

if (!emailFrom) {
  console.warn('⚠️  EMAIL_FROM is not set, using default: noreply@kapdaco.com');
} else {
  console.log('✅ EMAIL_FROM is set');
  console.log(`   Value: ${emailFrom}`);
}

// Get test email from command line or use default
const testEmail = process.argv[2] || process.env.TEST_EMAIL || 'your-email@example.com';

if (testEmail === 'your-email@example.com') {
  console.log('\n💡 Usage: node scripts/test-email.js your-email@example.com');
  console.log('   Or set TEST_EMAIL in .env file\n');
}

console.log('\n📧 Test Email Configuration:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   To: ${testEmail}`);
console.log(`   From: ${emailFrom || 'noreply@kapdaco.com'}`);

console.log('\n🧪 Testing Email Sending:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Test 1: Simple email
console.log('📨 Test 1: Sending simple test email...');

const testHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Test Email - The Kapda Co.</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 28px;">✅ Email Service Test</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
      <p>Hello,</p>
      
      <p>This is a test email from The Kapda Co. email service!</p>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Email Service:</strong> Nodemailer</p>
        <p><strong>SMTP Host:</strong> ${smtpHost}</p>
        <p><strong>Test Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
      </div>
      
      <p>If you received this email, your email service is working correctly! 🎉</p>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Best regards,<br>
        <strong>The Kapda Co. Team</strong>
      </p>
    </div>
  </body>
  </html>
`;

try {
  const result = await sendEmail({
    to: testEmail,
    subject: '✅ Test Email - The Kapda Co. Email Service',
    html: testHtml,
  });

  if (result.success) {
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Check your inbox: ${testEmail}`);
    console.log('\n📬 Email should arrive within 1-2 minutes.');
    console.log('   (Check spam folder if not in inbox)');
  } else {
    console.error('❌ Failed to send test email');
    console.error(`   Error: ${result.error}`);
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Email Test Failed!');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`   Error: ${error.message}`);
  
  if (error.message.includes('Invalid login')) {
    console.error('\n💡 Possible Issues:');
    console.error('   - Invalid SMTP credentials (check SMTP_USER and SMTP_PASS)');
    console.error('   - API key is incorrect (for SendGrid: check API key)');
    console.error('   - Account is suspended or restricted');
  } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
    console.error('\n💡 Possible Issues:');
    console.error('   - SMTP_HOST is incorrect');
    console.error('   - SMTP_PORT is wrong');
    console.error('   - Network/firewall blocking connection');
  } else if (error.message.includes('550') || error.message.includes('553')) {
    console.error('\n💡 Possible Issues:');
    console.error('   - Sender email not verified');
    console.error('   - EMAIL_FROM is not verified in SendGrid');
    console.error('   - Need to verify sender email in email service dashboard');
  }
  
  console.error('\n📋 Troubleshooting:');
  console.error('   1. Verify credentials in backend/api/.env');
  console.error('   2. Check SendGrid dashboard for API key status');
  console.error('   3. Verify sender email in SendGrid (Settings → Sender Authentication)');
  console.error('   4. Check if email service account is active');
  
  process.exit(1);
}

// Test 2: Welcome email template (optional)
if (process.argv[3] === '--template') {
  console.log('\n📨 Test 2: Sending welcome email template...');
  
  try {
    const mockUser = {
      name: 'Test User',
      email: testEmail,
    };
    
    const welcomeResult = await sendWelcomeEmail(mockUser);
    
    if (welcomeResult.success) {
      console.log('✅ Welcome email template sent successfully!');
      console.log(`   Message ID: ${welcomeResult.messageId}`);
    } else {
      console.error('❌ Failed to send welcome email template');
      console.error(`   Error: ${welcomeResult.error}`);
    }
  } catch (error) {
    console.error('❌ Welcome email template test failed');
    console.error(`   Error: ${error.message}`);
  }
}

console.log('\n✅ Email Service Test Complete! 🎉');
console.log('\n📝 Next Steps:');
console.log('   1. Check your email inbox (and spam folder)');
console.log('   2. Verify email formatting and content');
console.log('   3. Test other email templates in your app');
console.log('\n💡 To test welcome email template:');
console.log('   node scripts/test-email.js your-email@example.com --template');

