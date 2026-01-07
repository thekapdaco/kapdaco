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
        logger.info('Shiprocket authentication successful');
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
      },
      timeout: 30000 // 30 seconds timeout
    });
  }

  /**
   * Calculate shipping rates
   * @param {string} pickupPincode - Pickup location pincode
   * @param {string} deliveryPincode - Delivery pincode
   * @param {number} weight - Weight in kg
   * @param {number} codAmount - COD amount (0 for prepaid)
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
        response: error.response?.data,
        pickupPincode,
        deliveryPincode
      });
      throw new Error(`Rate calculation failed: ${error.message}`);
    }
  }

  /**
   * Create shipment/order
   * @param {Object} orderData - Order data for shipment creation
   */
  async createShipment(orderData) {
    try {
      const client = await this.getAuthenticatedClient();

      const shipmentPayload = {
        order_id: orderData.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: this.pickupLocationId,
        billing_customer_name: orderData.billingAddress?.fullName || orderData.shippingAddress?.fullName || 'Customer',
        billing_last_name: '',
        billing_address: orderData.billingAddress?.street || orderData.shippingAddress?.street || '',
        billing_address_2: orderData.billingAddress?.addressLine2 || '',
        billing_city: orderData.billingAddress?.city || orderData.shippingAddress?.city || '',
        billing_pincode: orderData.billingAddress?.postalCode || orderData.shippingAddress?.postalCode || '',
        billing_state: orderData.billingAddress?.state || orderData.shippingAddress?.state || '',
        billing_country: orderData.billingAddress?.country || orderData.shippingAddress?.country || 'India',
        billing_email: orderData.email || '',
        billing_phone: orderData.billingAddress?.phone || orderData.shippingAddress?.phone || '',
        shipping_is_billing: orderData.sameAsShipping !== false,
        shipping_customer_name: orderData.shippingAddress?.fullName || 'Customer',
        shipping_last_name: '',
        shipping_address: orderData.shippingAddress?.street || '',
        shipping_address_2: orderData.shippingAddress?.addressLine2 || '',
        shipping_city: orderData.shippingAddress?.city || '',
        shipping_pincode: orderData.shippingAddress?.postalCode || '',
        shipping_state: orderData.shippingAddress?.state || '',
        shipping_country: orderData.shippingAddress?.country || 'India',
        shipping_email: orderData.email || '',
        shipping_phone: orderData.shippingAddress?.phone || '',
        order_items: orderData.items.map(item => ({
          name: item.productName || 'Product',
          sku: item.sku || `SKU-${item.productId}`,
          units: item.quantity || 1,
          selling_price: item.price || 0
        })),
        payment_method: orderData.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        sub_total: orderData.subtotal || 0,
        length: orderData.dimensions?.length || 10, // in cm
        breadth: orderData.dimensions?.breadth || 10,
        height: orderData.dimensions?.height || 5,
        weight: orderData.weight || 0.5, // in kg
        order_type: 'Standard'
      };

      const response = await client.post('/orders/create/adhoc', shipmentPayload);

      logger.info('Shiprocket shipment created', {
        orderId: orderData.orderId,
        shipmentId: response.data?.shipment_id
      });

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
   * @param {number} shipmentId - Shiprocket shipment ID
   */
  async generateAWB(shipmentId) {
    try {
      const client = await this.getAuthenticatedClient();

      const response = await client.post('/orders/assign/awb', {
        shipment_id: shipmentId
      });

      logger.info('Shiprocket AWB generated', { shipmentId, awb: response.data });
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
   * @param {number|Array} shipmentIds - Shipment ID(s)
   */
  async requestPickup(shipmentIds) {
    try {
      const client = await this.getAuthenticatedClient();

      const response = await client.post('/orders/pickup', {
        shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds]
      });

      logger.info('Shiprocket pickup requested', { shipmentIds, response: response.data });
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
   * @param {string} awbCode - AWB tracking code
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
   * @param {string} awbCode - AWB code to cancel
   */
  async cancelShipment(awbCode) {
    try {
      const client = await this.getAuthenticatedClient();

      const response = await client.post('/orders/cancel/shipment/awbs', {
        awbs: [awbCode]
      });

      logger.info('Shiprocket shipment cancelled', { awbCode, response: response.data });
      return response.data;
    } catch (error) {
      logger.error('Shiprocket cancellation failed', {
        error: error.message,
        response: error.response?.data,
        awbCode
      });
      throw new Error(`Shipment cancellation failed: ${error.message}`);
    }
  }

  /**
   * Get shipment details
   * @param {number} shipmentId - Shiprocket shipment ID
   */
  async getShipmentDetails(shipmentId) {
    try {
      const client = await this.getAuthenticatedClient();

      const response = await client.get(`/orders/show/${shipmentId}`);

      return response.data;
    } catch (error) {
      logger.error('Shiprocket get shipment details failed', {
        error: error.message,
        response: error.response?.data,
        shipmentId
      });
      throw new Error(`Get shipment details failed: ${error.message}`);
    }
  }
}

export default new ShiprocketService();

