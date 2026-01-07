// Email service - SendGrid/Nodemailer integration
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

let transporter = null;

/**
 * Initialize email transporter based on environment variables
 */
const initializeEmailService = () => {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom = process.env.EMAIL_FROM || 'noreply@kapdaco.com';

  // Check if email service is configured
  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn('Email service not configured. Email sending will be disabled.');
    logger.warn('Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables to enable.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: smtpPort === '465', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    logger.info('Email service initialized', {
      host: smtpHost,
      port: smtpPort,
      from: emailFrom
    });
  } catch (error) {
    logger.error('Failed to initialize email service', { error: error.message });
    return null;
  }

  return transporter;
};

/**
 * Send email using configured transporter
 * @param {Object} options - Email options
 * @param {String|Array} options.to - Recipient email(s)
 * @param {String} options.subject - Email subject
 * @param {String} options.html - HTML email body
 * @param {String} options.text - Plain text email body (optional)
 * @param {Array} options.attachments - Email attachments (optional) [{filename, content, contentType}]
 */
export const sendEmail = async ({ to, subject, html, text, attachments }) => {
  const emailTransporter = initializeEmailService();
  
  if (!emailTransporter) {
    logger.warn('Email service not available. Skipping email send.', { to, subject });
    return { success: false, error: 'Email service not configured' };
  }

  const emailFrom = process.env.EMAIL_FROM || 'noreply@kapdaco.com';

  try {
    const mailOptions = {
      from: `"The Kapda Co." <${emailFrom}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/pdf'
      }));
    }

    const info = await emailTransporter.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: info.messageId,
      hasAttachments: attachments && attachments.length > 0
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send failed', {
      to,
      subject,
      error: error.message
    });

    return { success: false, error: error.message };
  }
};

/**
 * Email templates
 */

// Order confirmation email template
export const sendOrderConfirmation = async (order, user, invoiceBuffer = null, invoiceNumber = null) => {
  const orderId = order._id.toString().slice(-8);
  const itemsList = order.items?.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.quantity || 1}x ${item.productId?.title || 'Product'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${(item.price * (item.quantity || 1)).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('') || '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - The Kapda Co.</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Dear ${user.name || 'Valued Customer'},</p>
        
        <p>Thank you for your order with The Kapda Co. Your order has been confirmed and is being processed.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1a237e;">Order Details</h2>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Payment Status:</strong> ${order.paymentStatus || 'Pending'}</p>
          
          <h3 style="margin-top: 20px; color: #1a237e;">Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
            ${itemsList}
          </table>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #1a237e;">
            <p style="text-align: right; font-size: 18px; font-weight: bold;">
              Total: ₹${order.total?.toLocaleString('en-IN') || '0'}
            </p>
          </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1a237e;">Shipping Address</h3>
          <p>
            ${order.shippingAddress?.street || ''}<br>
            ${order.shippingAddress?.city || ''}${order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}<br>
            ${order.shippingAddress?.postalCode || ''}<br>
            ${order.shippingAddress?.country || 'India'}<br>
            Phone: ${order.shippingAddress?.phone || 'N/A'}
          </p>
        </div>
        
        <p>Your atelier concierge will reach out within 24 hours with production timelines and delivery coordination.</p>
        
        ${invoiceNumber ? `
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <p style="margin: 0; color: #2e7d32; font-weight: bold;">
            📄 Invoice ${invoiceNumber} is attached to this email.
          </p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #2e7d32;">
            Please download and save your invoice for your records.
          </p>
        </div>
        ` : ''}
        
        <p>You can track your order in your account dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" 
             style="display: inline-block; background: #1a237e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Orders
          </a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          If you have any questions, please contact our support team.
        </p>
        
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          Best regards,<br>
          <strong>The Kapda Co. Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  // Prepare attachments
  const attachments = [];
  if (invoiceBuffer && invoiceNumber) {
    attachments.push({
      filename: `Invoice-${invoiceNumber}.pdf`,
      content: invoiceBuffer,
      contentType: 'application/pdf'
    });
  }

  return sendEmail({
    to: user.email,
    subject: `Order Confirmation - Order #${orderId}${invoiceNumber ? ` (Invoice ${invoiceNumber})` : ''}`,
    html,
    attachments: attachments.length > 0 ? attachments : undefined
  });
};

// Password reset email template
export const sendPasswordReset = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - The Kapda Co.</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Dear ${user.name || 'User'},</p>
        
        <p>We received a request to reset your password for your Kapda Co. account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; background: #1a237e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
        
        <p><strong>This link will expire in 1 hour.</strong></p>
        
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Best regards,<br>
          <strong>The Kapda Co. Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request - The Kapda Co.',
    html
  });
};

// Designer application notification email
export const sendDesignerApplicationNotification = async (application, user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Designer Application Received - The Kapda Co.</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Application Received</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Dear ${user.name || 'Designer'},</p>
        
        <p>Thank you for applying to become a designer on The Kapda Co. marketplace!</p>
        
        <p>We have received your application and our team will review it within 3-5 business days.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Application Status:</strong> ${application.status || 'Under Review'}</p>
          <p><strong>Submitted:</strong> ${new Date(application.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
        
        <p>You will receive an email notification once your application has been reviewed.</p>
        
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Best regards,<br>
          <strong>The Kapda Co. Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Designer Application Received - The Kapda Co.',
    html
  });
};

// Welcome email template
export const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to The Kapda Co.</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to The Kapda Co.</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Dear ${user.name || 'Valued Customer'},</p>
        
        <p>Welcome to The Kapda Co.! We're thrilled to have you join our community of fashion enthusiasts.</p>
        
        <p>Start exploring our premium customizable fashion collection and discover unique designs from independent designers.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop" 
             style="display: inline-block; background: #1a237e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Start Shopping
          </a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Best regards,<br>
          <strong>The Kapda Co. Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to The Kapda Co.',
    html
  });
};

// Newsletter welcome email template
export const sendNewsletterWelcomeEmail = async ({ email, preferences = {} }) => {
  const unsubscribeUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/unsubscribe?email=${encodeURIComponent(email)}`;
  
  // Build preference summary
  const selectedPreferences = [];
  if (preferences.newCollections) selectedPreferences.push('New Editions');
  if (preferences.styleNotes) selectedPreferences.push('Style Notes');
  if (preferences.atelierUpdates) selectedPreferences.push('Atelier Diaries');
  if (preferences.invites) selectedPreferences.push('Private Invites');
  
  const preferencesText = selectedPreferences.length > 0 
    ? selectedPreferences.join(', ')
    : 'General updates';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to The Kapda Society</title>
    </head>
    <body style="font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.8; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f8f6;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); color: white; padding: 50px 40px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px; font-family: 'Georgia', serif;">
          The Kapda Society
        </h1>
        <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.9; letter-spacing: 1px; text-transform: uppercase;">
          Welcome to Our Community
        </p>
      </div>
      
      <div style="background: #ffffff; padding: 50px 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <p style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a;">
          Dear Valued Member,
        </p>
        
        <p style="margin: 0 0 25px 0; font-size: 16px; color: #333; line-height: 1.8;">
          We are delighted to welcome you to <strong style="color: #0f172a;">The Kapda Society</strong> – your exclusive gateway to the world of bespoke fashion, atelier craftsmanship, and curated designer collections.
        </p>

        <div style="background: linear-gradient(135deg, #fef3e2 0%, #fde68a 100%); padding: 30px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #d3a75f;">
          <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #92400e;">
            ✨ What You'll Receive
          </p>
          <p style="margin: 0; font-size: 15px; color: #78350f; line-height: 1.8;">
            <strong>Your Preferences:</strong> ${preferencesText}
          </p>
        </div>

        <div style="margin: 35px 0;">
          <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #0f172a; font-weight: 400; font-family: 'Georgia', serif;">
            What's Next?
          </h2>
          
          <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 10px 0; font-size: 17px; color: #1e293b; font-weight: 600;">
              📬 Weekly Dispatches
            </h3>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7;">
              Every week, you'll receive curated insights into atelier stories, behind-the-scenes glimpses of our designer residencies, and exclusive previews of upcoming collections.
            </p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 10px 0; font-size: 17px; color: #1e293b; font-weight: 600;">
              🎨 Exclusive Access
            </h3>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7;">
              Be the first to discover limited edition pieces, private sale events, and new arrivals from our curated selection of independent designers and brands.
            </p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 10px 0; font-size: 17px; color: #1e293b; font-weight: 600;">
              🏛️ Atelier Insights
            </h3>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7;">
              Learn about the artisans behind each piece, traditional craftsmanship techniques, and the stories that make each garment unique.
            </p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 10px 0; font-size: 17px; color: #1e293b; font-weight: 600;">
              🎭 Style Inspiration
            </h3>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7;">
              Get styling tips, trend forecasts, and inspiration from fashion experts and our community of style enthusiasts.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin: 40px 0 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop" 
             style="display: inline-block; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);">
            Explore Our Collections
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; margin-top: 40px;">
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #64748b; line-height: 1.7;">
            <strong style="color: #334155;">The Kapda Co.</strong> is more than a fashion brand – we're a community dedicated to preserving craftsmanship, supporting independent designers, and bringing you pieces that tell a story.
          </p>
          
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.7;">
            Each piece in our collection is crafted with meticulous attention to detail, using archival-grade materials and time-honored techniques passed down through generations of artisans.
          </p>

          <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.7;">
            We're thrilled to have you as part of our journey. If you have any questions or would like to connect with us, please don't hesitate to reach out.
          </p>
        </div>

        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
            With warm regards,<br>
            <strong style="color: #0f172a; font-size: 16px;">The Kapda Co. Team</strong>
          </p>
          <p style="margin: 20px 0 0 0; font-size: 12px; color: #94a3b8;">
            <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> | 
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/privacy" style="color: #64748b; text-decoration: underline;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to The Kapda Society ✨',
    html
  });
};

export default {
  sendEmail,
  sendOrderConfirmation,
  sendPasswordReset,
  sendDesignerApplicationNotification,
  sendWelcomeEmail,
  sendNewsletterWelcomeEmail,
};

