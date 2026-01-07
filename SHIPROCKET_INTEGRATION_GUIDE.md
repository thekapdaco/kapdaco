# Shiprocket Integration Guide for Kapda Co.

## Overview
This guide provides step-by-step instructions to integrate Shiprocket shipping API into your e-commerce platform for automated shipping, tracking, and delivery management.

---

## Step 1: Shiprocket Account Setup

### 1.1 Create Shiprocket Account
1. Go to [https://www.shiprocket.in/](https://www.shiprocket.in/)
2. Sign up for an account (choose "Seller" account type)
3. Complete your profile:
   - Business details
   - Pickup address (your warehouse/fulfillment center)
   - Bank account details (for payouts)
   - GST details (if applicable)

### 1.2 Get API Credentials
1. Log in to Shiprocket Dashboard
2. Go to **Settings** → **API** → **API Credentials**
3. Copy your:
   - **Email** (your Shiprocket login email)
   - **API Key** (generate if not available)
4. Save these credentials securely (we'll add them to `.env`)

### 1.3 Configure Pickup Location
1. Go to **Settings** → **Pickup Locations**
2. Add your warehouse/pickup address
3. Note the **pickup_location_id** (you'll need this)

---

## Step 2: Environment Variables Setup

Add these to your `backend/.env` file:

```env
# Shiprocket API Configuration
SHIPROCKET_EMAIL=your-email@example.com
SHIPROCKET_API_KEY=your-api-key-here
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_PICKUP_LOCATION_ID=your-pickup-location-id

# Optional: Webhook secret for tracking updates
SHIPROCKET_WEBHOOK_SECRET=your-webhook-secret
```

---

## Step 3: Install Required Packages

```bash
cd backend
npm install axios
```

---

## Step 4: Backend Implementation

### 4.1 Create Shiprocket Service

Create `backend/src/services/shiprocket.service.js`:

```javascript
import axios from 'axios';
import logger from '../utils/logger.js';

class ShiprocketService {
  constructor() {
    this.baseURL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    this.email = process.env.SHIPROCKET_EMAIL;
    this.apiKey = process.env.SHIPROCKET_API_KEY;
    this.pickupLocationId = process.env.SHIPROCKET_PICKUP_LOCATION_ID;
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate and get access token
   */
  async authenticate() {
    try {
      // Check if token is still valid
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.token;
      }

      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: this.email,
        password: this.apiKey
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        // Token expires in 24 hours, set expiry to 23 hours for safety
        this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
        return this.token;
      }

      throw new Error('Failed to authenticate with Shiprocket');
    } catch (error) {
      logger.error('Shiprocket authentication failed', {
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Shiprocket authentication failed: ${error.message}`);
    }
  }

  /**
   * Get authenticated axios instance
   */
  async getAuthenticatedClient() {
    const token = await this.authenticate();
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Calculate shipping rates
   */
  async calculateShipping(pickupPincode, deliveryPincode, weight, codAmount = 0) {
    try {
      const client = await this.getAuthenticatedClient();
      
      const response = await client.post('/courier/serviceability/rates', {
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight: weight, // in kg
        cod_amount: codAmount
      });

      return response.data;
    } catch (error) {
      logger.error('Shiprocket rate calculation failed', {
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Rate calculation failed: ${error.message}`);
    }
  }

  /**
   * Create shipment/order
   */
  async createShipment(orderData) {
    try {
      const client = await this.getAuthenticatedClient();

      const shipmentPayload = {
        order_id: orderData.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: this.pickupLocationId,
        billing_customer_name: orderData.billingAddress.fullName || orderData.shippingAddress.fullName,
        billing_last_name: '',
        billing_address: orderData.billingAddress.street,
        billing_address_2: orderData.billingAddress.addressLine2 || '',
        billing_city: orderData.billingAddress.city,
        billing_pincode: orderData.billingAddress.postalCode,
        billing_state: orderData.billingAddress.state,
        billing_country: orderData.billingAddress.country || 'India',
        billing_email: orderData.email,
        billing_phone: orderData.billingAddress.phone || orderData.shippingAddress.phone,
        shipping_is_billing: orderData.sameAsShipping,
        shipping_customer_name: orderData.shippingAddress.fullName,
        shipping_last_name: '',
        shipping_address: orderData.shippingAddress.street,
        shipping_address_2: orderData.shippingAddress.addressLine2 || '',
        shipping_city: orderData.shippingAddress.city,
        shipping_pincode: orderData.shippingAddress.postalCode,
        shipping_state: orderData.shippingAddress.state,
        shipping_country: orderData.shippingAddress.country || 'India',
        shipping_email: orderData.email,
        shipping_phone: orderData.shippingAddress.phone,
        order_items: orderData.items.map(item => ({
          name: item.productName,
          sku: item.sku || `SKU-${item.productId}`,
          units: item.quantity,
          selling_price: item.price
        })),
        payment_method: orderData.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        sub_total: orderData.subtotal,
        length: orderData.dimensions?.length || 10, // in cm
        breadth: orderData.dimensions?.breadth || 10,
        height: orderData.dimensions?.height || 5,
        weight: orderData.weight || 0.5, // in kg
        order_type: 'Standard'
      };

      const response = await client.post('/orders/create/adhoc', shipmentPayload);

      return response.data;
    } catch (error) {
      logger.error('Shiprocket shipment creation failed', {
        error: error.message,
        response: error.response?.data,
        orderId: orderData.orderId
      });
      throw new Error(`Shipment creation failed: ${error.message}`);
    }
  }

  /**
   * Generate AWB (Airway Bill) for shipment
   */
  async generateAWB(shipmentId) {
    try {
      const client = await this.getAuthenticatedClient();

      const response = await client.post('/orders/assign/awb', {
        shipment_id: shipmentId
      });

      return response.data;
    } catch (error) {
      logger.error('Shiprocket AWB generation failed', {
        error: error.message,
        response: error.response?.data,
        shipmentId
      });
      throw new Error(`AWB generation failed: ${error.message}`);
    }
  }

  /**
   * Request pickup for shipment
   */
  async requestPickup(shipmentIds) {
    try {
      const client = await this.getAuthenticatedClient();

      const response = await client.post('/orders/pickup', {
        shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds]
      });

      return response.data;
    } catch (error) {
      logger.error('Shiprocket pickup request failed', {
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Pickup request failed: ${error.message}`);
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(awbCode) {
    try {
      const client = await this.getAuthenticatedClient();

      const response = await client.get(`/courier/track/shipment/${awbCode}`);

      return response.data;
    } catch (error) {
      logger.error('Shiprocket tracking failed', {
        error: error.message,
        response: error.response?.data,
        awbCode
      });
      throw new Error(`Tracking failed: ${error.message}`);
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(shipmentId) {
    try {
      const client = await this.getAuthenticatedClient();

      const response = await client.post('/orders/cancel/shipment/awbs', {
        awbs: [shipmentId]
      });

      return response.data;
    } catch (error) {
      logger.error('Shiprocket cancellation failed', {
        error: error.message,
        response: error.response?.data,
        shipmentId
      });
      throw new Error(`Shipment cancellation failed: ${error.message}`);
    }
  }
}

export default new ShiprocketService();
```

### 4.2 Update Order Controller

Add Shiprocket integration to `backend/src/controllers/order.controller.js`:

```javascript
import shiprocketService from '../services/shiprocket.service.js';

// In your createOrder function, after order is created:
async function createOrder(req, res) {
  try {
    // ... existing order creation code ...
    
    // After order is successfully created and payment is confirmed:
    if (order.paymentStatus === 'paid') {
      try {
        // Prepare order data for Shiprocket
        const shiprocketData = {
          orderId: order._id.toString(),
          email: user.email,
          billingAddress: order.billingAddress,
          shippingAddress: order.shippingAddress,
          sameAsShipping: order.sameAsShipping,
          items: order.items.map(item => ({
            productId: item.productId,
            productName: product.title, // Fetch from product
            sku: variant?.sku || `SKU-${item.productId}`,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal: order.total,
          paymentMethod: order.paymentMethod,
          weight: calculateOrderWeight(order.items), // Implement this
          dimensions: calculateOrderDimensions(order.items) // Implement this
        };

        // Create shipment in Shiprocket
        const shipment = await shiprocketService.createShipment(shiprocketData);
        
        // Update order with Shiprocket data
        order.shiprocketShipmentId = shipment.shipment_id;
        order.shiprocketOrderId = shipment.order_id;
        await order.save();

        // Generate AWB (optional - can be done later)
        // const awb = await shiprocketService.generateAWB(shipment.shipment_id);
        
      } catch (shiprocketError) {
        // Log error but don't fail the order creation
        logger.error('Shiprocket integration failed', {
          orderId: order._id,
          error: shiprocketError.message
        });
      }
    }

    res.status(201).json({ order });
  } catch (error) {
    // ... error handling ...
  }
}
```

### 4.3 Create Shiprocket Routes

Create `backend/src/routes/shiprocket.routes.js`:

```javascript
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { isAdmin } from '../middleware/auth.js';
import shiprocketService from '../services/shiprocket.service.js';
import Order from '../models/Order.js';

const router = Router();

// Calculate shipping rates (public endpoint)
router.post('/rates', async (req, res) => {
  try {
    const { pickupPincode, deliveryPincode, weight, codAmount } = req.body;

    if (!pickupPincode || !deliveryPincode || !weight) {
      return res.status(400).json({ 
        message: 'pickupPincode, deliveryPincode, and weight are required' 
      });
    }

    const rates = await shiprocketService.calculateShipping(
      pickupPincode,
      deliveryPincode,
      weight,
      codAmount || 0
    );

    res.json({ rates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create shipment for order (admin/brand only)
router.post('/orders/:orderId/ship', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('items.productId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'brand') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create shipment
    const shipment = await shiprocketService.createShipment({
      orderId: order._id.toString(),
      email: req.user.email,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      sameAsShipping: order.sameAsShipping,
      items: order.items,
      subtotal: order.total,
      paymentMethod: order.paymentMethod,
      weight: 0.5, // Calculate from products
      dimensions: { length: 10, breadth: 10, height: 5 }
    });

    // Update order
    order.shiprocketShipmentId = shipment.shipment_id;
    order.shiprocketOrderId = shipment.order_id;
    await order.save();

    res.json({ shipment, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate AWB for shipment
router.post('/shipments/:shipmentId/awb', auth, isAdmin, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const awb = await shiprocketService.generateAWB(shipmentId);
    res.json({ awb });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request pickup
router.post('/shipments/:shipmentId/pickup', auth, isAdmin, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const result = await shiprocketService.requestPickup(shipmentId);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Track shipment
router.get('/track/:awbCode', async (req, res) => {
  try {
    const { awbCode } = req.params;
    const tracking = await shiprocketService.trackShipment(awbCode);
    res.json({ tracking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel shipment
router.post('/shipments/:shipmentId/cancel', auth, isAdmin, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const result = await shiprocketService.cancelShipment(shipmentId);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Webhook endpoint for Shiprocket tracking updates
router.post('/webhook', async (req, res) => {
  try {
    const { status, awb_code, shipment_id } = req.body;

    // Find order by shipment ID
    const order = await Order.findOne({ shiprocketShipmentId: shipment_id });

    if (order) {
      // Update order status based on Shiprocket status
      const statusMap = {
        'NEW': 'processing',
        'READY_TO_SHIP': 'processing',
        'PICKED_UP': 'shipped',
        'IN_TRANSIT': 'shipped',
        'OUT_FOR_DELIVERY': 'shipped',
        'DELIVERED': 'delivered',
        'CANCELLED': 'canceled'
      };

      if (statusMap[status]) {
        order.status = statusMap[status];
        order.trackingNumber = awb_code;
        if (status === 'DELIVERED') {
          order.deliveredAt = new Date();
        }
        await order.save();
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

### 4.4 Update Order Model

Add Shiprocket fields to `backend/src/models/Order.js`:

```javascript
// Add to OrderSchema:
shiprocketShipmentId: String,
shiprocketOrderId: String,
shiprocketAWB: String, // Airway Bill Number
```

### 4.5 Register Routes

Add to `backend/server.js`:

```javascript
import shiprocketRoutes from './src/routes/shiprocket.routes.js';

// ... existing code ...

app.use('/api/shiprocket', shiprocketRoutes);
```

---

## Step 5: Frontend Integration

### 5.1 Update Checkout to Show Shipping Rates

In `src/pages/Checkout.jsx`, add function to fetch shipping rates:

```javascript
const fetchShippingRates = async (pincode) => {
  try {
    const response = await api.post('/api/shiprocket/rates', {
      pickupPincode: '400001', // Your warehouse pincode
      deliveryPincode: pincode,
      weight: calculateCartWeight(cart.items), // Implement this
      codAmount: form.paymentMethod === 'cod' ? finalTotal : 0
    });
    
    // Update delivery options with real rates
    setDeliveryOptions(response.data.rates);
  } catch (error) {
    console.error('Failed to fetch shipping rates:', error);
  }
};
```

### 5.2 Add Tracking Page

Create `src/pages/TrackOrder.jsx`:

```javascript
import React, { useState } from 'react';
import { api } from '../lib/api';
import { KCInput, KCButton } from '../components/ui';

const TrackOrder = () => {
  const [awbCode, setAwbCode] = useState('');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.get(`/api/shiprocket/track/${awbCode}`);
      setTracking(response.data.tracking);
    } catch (error) {
      alert('Tracking failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Track Your Order</h1>
      <form onSubmit={handleTrack} className="mb-8">
        <KCInput
          value={awbCode}
          onChange={(e) => setAwbCode(e.target.value)}
          placeholder="Enter AWB Code"
          required
        />
        <KCButton type="submit" disabled={loading}>
          {loading ? 'Tracking...' : 'Track'}
        </KCButton>
      </form>
      
      {tracking && (
        <div className="tracking-details">
          {/* Display tracking information */}
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
```

---

## Step 6: Testing

1. **Test Authentication**: Verify API credentials work
2. **Test Rate Calculation**: Check shipping rates for different pincodes
3. **Test Shipment Creation**: Create a test order and verify shipment creation
4. **Test Tracking**: Track a shipment using AWB code
5. **Test Webhook**: Configure webhook URL in Shiprocket dashboard and test updates

---

## Step 7: Shiprocket Dashboard Configuration

1. **Configure Webhook URL**:
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-domain.com/api/shiprocket/webhook`
   - Enable events: Shipment Status Updates

2. **Set Pickup Schedule**:
   - Configure when Shiprocket should pick up orders
   - Set default pickup time

3. **Configure Courier Partners**:
   - Enable/disable courier services
   - Set preferences for different regions

---

## Step 8: Production Checklist

- [ ] Add Shiprocket credentials to production `.env`
- [ ] Test webhook endpoint is accessible
- [ ] Configure pickup location in Shiprocket dashboard
- [ ] Set up automated AWB generation (optional)
- [ ] Test end-to-end order flow
- [ ] Monitor logs for any errors
- [ ] Set up error alerts

---

## Additional Resources

- [Shiprocket API Documentation](https://apidocs.shiprocket.in/)
- [Shiprocket Dashboard](https://app.shiprocket.in/)
- [Support](https://support.shiprocket.in/)

---

## Troubleshooting

### Common Issues:

1. **Authentication Failed**: Check email and API key in `.env`
2. **Rate Calculation Fails**: Verify pincodes are valid
3. **Shipment Creation Fails**: Check all required fields are provided
4. **Webhook Not Working**: Verify URL is accessible and SSL is valid

---

**Note**: This is a comprehensive guide. Start with Step 1-4 for basic integration, then add frontend features and webhooks as needed.

