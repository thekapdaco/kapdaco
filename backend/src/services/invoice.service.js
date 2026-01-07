// Invoice generation service using PDFKit
import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';

/**
 * Generate invoice PDF for an order
 * @param {Object} order - Order document (populated with userId and items.productId)
 * @param {Object} user - User document (customer)
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateInvoicePDF = async (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Company Information
      const companyName = process.env.COMPANY_NAME || 'The Kapda Co.';
      const companyAddress = process.env.COMPANY_ADDRESS || 'Your Company Address, City, State, PIN';
      const companyPhone = process.env.COMPANY_PHONE || '+91 XXXX XXXXXX';
      const companyEmail = process.env.COMPANY_EMAIL || 'support@kapdaco.com';
      const companyGST = process.env.COMPANY_GST || 'GSTIN: XX-XXXXX-XXXXX-X';
      const companyPAN = process.env.COMPANY_PAN || 'PAN: XXXXX1234X';

      // Invoice Details
      const invoiceNumber = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
      const invoiceDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : new Date().toLocaleDateString('en-IN');

      // Customer Information
      const customerName = user?.name || 'Customer';
      const customerEmail = user?.email || '';
      const shippingAddress = order.shippingAddress || {};
      const customerAddress = [
        shippingAddress.street || '',
        shippingAddress.city || '',
        shippingAddress.state || '',
        shippingAddress.postalCode || '',
        shippingAddress.country || 'India'
      ].filter(Boolean).join(', ');

      // Header
      doc.fontSize(24)
         .fillColor('#1a1a2e')
         .text(companyName, 50, 50, { align: 'left' });

      doc.fontSize(10)
         .fillColor('#666666')
         .text('INVOICE', 450, 50, { align: 'right' });

      // Company details
      doc.fontSize(9)
         .fillColor('#333333')
         .text(companyAddress, 50, 80, { align: 'left', width: 200 })
         .text(`Phone: ${companyPhone}`, 50, { continued: false })
         .text(`Email: ${companyEmail}`, 50, { continued: false })
         .text(companyGST, 50, { continued: false })
         .text(companyPAN, 50, { continued: false });

      // Invoice number and date (right aligned)
      doc.fontSize(9)
         .fillColor('#333333')
         .text(`Invoice #: ${invoiceNumber}`, 350, 80, { align: 'right', width: 200 })
         .text(`Invoice Date: ${invoiceDate}`, 350, { continued: false })
         .text(`Order #: ${order._id.toString().slice(-6).toUpperCase()}`, 350, { continued: false });

      // Bill To section
      const billToY = 160;
      doc.fontSize(11)
         .fillColor('#1a1a2e')
         .font('Helvetica-Bold')
         .text('Bill To:', 50, billToY);

      doc.fontSize(9)
         .fillColor('#333333')
         .font('Helvetica')
         .text(customerName, 50, billToY + 20)
         .text(customerEmail, 50, { continued: false });

      if (customerAddress) {
        doc.text(customerAddress, 50, { continued: false });
      }

      if (shippingAddress.phone) {
        doc.text(`Phone: ${shippingAddress.phone}`, 50, { continued: false });
      }

      // Items table header
      const tableTop = billToY + 80;
      doc.fontSize(10)
         .fillColor('#1a1a2e')
         .font('Helvetica-Bold')
         .text('Item', 50, tableTop)
         .text('Qty', 350, tableTop)
         .text('Price', 400, tableTop)
         .text('Total', 470, tableTop, { align: 'right' });

      // Draw table header line
      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .strokeColor('#cccccc')
         .lineWidth(0.5)
         .stroke();

      // Items
      let currentY = tableTop + 30;
      const items = order.items && order.items.length > 0 
        ? order.items 
        : (order.productId ? [{ productId: order.productId, quantity: order.quantity || 1, price: order.priceAtPurchase || order.total }] : []);

      items.forEach((item, index) => {
        if (currentY > 650) {
          // New page if needed
          doc.addPage();
          currentY = 50;
        }

        const productTitle = typeof item.productId === 'object' && item.productId.title
          ? item.productId.title
          : 'Product';
        
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const itemTotal = quantity * price;

        // Item name (with size/color if available)
        let itemName = productTitle;
        if (item.size || item.color) {
          const details = [item.size, item.color].filter(Boolean).join(', ');
          itemName += ` (${details})`;
        }

        doc.fontSize(9)
           .fillColor('#333333')
           .font('Helvetica')
           .text(itemName, 50, currentY, { width: 280, ellipsis: true });

        doc.text(String(quantity), 350, currentY);
        doc.text(`₹${price.toLocaleString('en-IN')}`, 400, currentY);
        doc.text(`₹${itemTotal.toLocaleString('en-IN')}`, 470, currentY, { align: 'right' });

        currentY += 25;
      });

      // Totals section
      const totalsY = Math.max(currentY + 20, 600);
      
      // Draw line before totals
      doc.moveTo(350, totalsY - 10)
         .lineTo(550, totalsY - 10)
         .strokeColor('#cccccc')
         .lineWidth(0.5)
         .stroke();

      const subtotal = order.total || 0;
      const tax = 0; // GST/Tax if applicable
      const shipping = 0; // Shipping charges if separate
      const total = subtotal + tax + shipping;

      doc.fontSize(10)
         .fillColor('#333333')
         .font('Helvetica')
         .text('Subtotal:', 400, totalsY, { align: 'right', width: 100 })
         .text(`₹${subtotal.toLocaleString('en-IN')}`, 500, totalsY, { align: 'right' });

      if (tax > 0) {
        doc.text('Tax (GST):', 400, totalsY + 20, { align: 'right', width: 100 })
           .text(`₹${tax.toLocaleString('en-IN')}`, 500, totalsY + 20, { align: 'right' });
      }

      if (shipping > 0) {
        doc.text('Shipping:', 400, totalsY + (tax > 0 ? 40 : 20), { align: 'right', width: 100 })
           .text(`₹${shipping.toLocaleString('en-IN')}`, 500, totalsY + (tax > 0 ? 40 : 20), { align: 'right' });
      }

      // Total (bold)
      const totalY = totalsY + (tax > 0 ? 50 : shipping > 0 ? 40 : 20);
      doc.fontSize(12)
         .fillColor('#1a1a2e')
         .font('Helvetica-Bold')
         .text('Total:', 400, totalY, { align: 'right', width: 100 })
         .text(`₹${total.toLocaleString('en-IN')}`, 500, totalY, { align: 'right' });

      // Payment information
      const paymentY = totalY + 40;
      doc.fontSize(9)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Payment Information:', 50, paymentY)
         .text(`Payment Status: ${order.paymentStatus || 'pending'}`, 50, paymentY + 15)
         .text(`Payment Method: ${order.paymentMethod || 'Online'}`, 50, paymentY + 30);

      if (order.paymentId) {
        doc.text(`Payment ID: ${order.paymentId}`, 50, paymentY + 45);
      }

      // Order status
      doc.text(`Order Status: ${order.status || 'pending'}`, 50, paymentY + 60);

      // Footer
      const footerY = 750;
      doc.fontSize(8)
         .fillColor('#999999')
         .text(`Thank you for your business!`, 50, footerY, { align: 'center', width: 500 })
         .text(`For any queries, contact us at ${companyEmail}`, 50, footerY + 15, { align: 'center', width: 500 })
         .text(`This is a computer-generated invoice and does not require a signature.`, 50, footerY + 30, { align: 'center', width: 500 });

      // Page numbers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#999999')
           .text(`Page ${i + 1} of ${pages.count}`, 50, 800, { align: 'center', width: 500 });
      }

      doc.end();
    } catch (error) {
      logger.error('Invoice generation error', {
        error: error.message,
        stack: error.stack,
        orderId: order._id
      });
      reject(error);
    }
  });
};

/**
 * Generate invoice number from order
 * @param {Object} order - Order document
 * @returns {String} Invoice number
 */
export const generateInvoiceNumber = (order) => {
  const orderId = order._id.toString();
  const date = new Date(order.createdAt || Date.now());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `INV-${year}${month}-${orderId.slice(-8).toUpperCase()}`;
};

