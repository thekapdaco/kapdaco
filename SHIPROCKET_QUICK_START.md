# Shiprocket Integration - Quick Start Checklist

## ✅ Step-by-Step Implementation

### Phase 1: Setup (15 minutes)

1. **Create Shiprocket Account**
   - [ ] Sign up at https://www.shiprocket.in/
   - [ ] Complete business profile
   - [ ] Add pickup location (warehouse address)
   - [ ] Note your pickup location ID

2. **Get API Credentials**
   - [ ] Go to Settings → API → API Credentials
   - [ ] Copy Email and API Key
   - [ ] Add to `backend/.env`:
     ```env
     SHIPROCKET_EMAIL=your-email@example.com
     SHIPROCKET_API_KEY=your-api-key
     SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external
     SHIPROCKET_PICKUP_LOCATION_ID=your-pickup-location-id
     ```

3. **Install Dependencies**
   ```bash
   cd backend
   npm install axios
   ```

### Phase 2: Backend Integration (30 minutes)

4. **Service File Created** ✅
   - File: `backend/src/services/shiprocket.service.js`
   - Already created with all methods

5. **Update Order Model**
   - [ ] Add to `backend/src/models/Order.js`:
     ```javascript
     shiprocketShipmentId: String,
     shiprocketOrderId: String,
     shiprocketAWB: String,
     ```

6. **Create Routes File**
   - [ ] Create `backend/src/routes/shiprocket.routes.js`
   - [ ] Copy code from `SHIPROCKET_INTEGRATION_GUIDE.md` (Step 4.3)

7. **Register Routes**
   - [ ] Add to `backend/server.js`:
     ```javascript
     import shiprocketRoutes from './src/routes/shiprocket.routes.js';
     app.use('/api/shiprocket', shiprocketRoutes);
     ```

8. **Update Order Controller**
   - [ ] Add Shiprocket integration to `createOrder` function
   - [ ] See `SHIPROCKET_INTEGRATION_GUIDE.md` (Step 4.2) for code

### Phase 3: Testing (20 minutes)

9. **Test Authentication**
   ```bash
   # Test via API or Postman
   POST /api/shiprocket/rates
   {
     "pickupPincode": "400001",
     "deliveryPincode": "110001",
     "weight": 0.5,
     "codAmount": 0
   }
   ```

10. **Test Shipment Creation**
    - [ ] Create a test order
    - [ ] Verify shipment is created in Shiprocket dashboard
    - [ ] Check order has `shiprocketShipmentId`

### Phase 4: Frontend (Optional - 30 minutes)

11. **Add Shipping Rate Calculator**
    - [ ] Update `src/pages/Checkout.jsx` to fetch real rates
    - [ ] Show rates based on delivery pincode

12. **Add Tracking Page**
    - [ ] Create `src/pages/TrackOrder.jsx`
    - [ ] Add route in `src/App.jsx`

### Phase 5: Webhook Setup (10 minutes)

13. **Configure Webhook**
    - [ ] Go to Shiprocket Dashboard → Settings → Webhooks
    - [ ] Add URL: `https://your-domain.com/api/shiprocket/webhook`
    - [ ] Enable: Shipment Status Updates

### Phase 6: Production (5 minutes)

14. **Production Checklist**
    - [ ] Add production credentials to `.env`
    - [ ] Test webhook is accessible
    - [ ] Monitor logs for errors
    - [ ] Set up error alerts

---

## 🚀 Quick Test Commands

### Test Rate Calculation
```bash
curl -X POST http://localhost:5000/api/shiprocket/rates \
  -H "Content-Type: application/json" \
  -d '{
    "pickupPincode": "400001",
    "deliveryPincode": "110001",
    "weight": 0.5,
    "codAmount": 0
  }'
```

### Test Tracking
```bash
curl http://localhost:5000/api/shiprocket/track/AWB_CODE_HERE
```

---

## 📝 Important Notes

1. **Pickup Location**: Must be configured in Shiprocket dashboard first
2. **Pincode Validation**: Ensure pincodes are valid Indian pincodes
3. **Weight Calculation**: Implement function to calculate order weight from products
4. **Dimensions**: Default dimensions are set, but should be calculated from products
5. **Error Handling**: Shiprocket errors won't fail order creation (logged only)

---

## 🔗 Files to Create/Modify

### New Files:
- ✅ `backend/src/services/shiprocket.service.js` (Created)
- [ ] `backend/src/routes/shiprocket.routes.js` (Create from guide)

### Files to Modify:
- [ ] `backend/src/models/Order.js` (Add Shiprocket fields)
- [ ] `backend/src/controllers/order.controller.js` (Add shipment creation)
- [ ] `backend/server.js` (Register routes)
- [ ] `backend/.env` (Add credentials)
- [ ] `src/pages/Checkout.jsx` (Optional - real-time rates)

---

## 📚 Full Documentation

See `SHIPROCKET_INTEGRATION_GUIDE.md` for complete implementation details.

---

## 🆘 Troubleshooting

**Authentication fails?**
- Check email and API key in `.env`
- Verify credentials in Shiprocket dashboard

**Rate calculation fails?**
- Verify pincodes are valid (6-digit Indian pincodes)
- Check weight is in kg (not grams)

**Shipment creation fails?**
- Verify all required fields are provided
- Check pickup location ID is correct
- Ensure address fields are not empty

**Webhook not working?**
- Verify URL is publicly accessible
- Check SSL certificate is valid
- Test webhook endpoint manually

---

**Estimated Total Time: 1.5 - 2 hours**

