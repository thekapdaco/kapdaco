# MongoDB Atlas IP Whitelisting Guide

## Quick Fix: Whitelist Your IP in MongoDB Atlas

### Step 1: Get Your Current IP Address
Run this command in PowerShell:
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

Or visit: https://www.whatismyip.com/

### Step 2: Whitelist IP in MongoDB Atlas

1. **Go to MongoDB Atlas Dashboard**
   - Visit: https://cloud.mongodb.com/
   - Log in to your account

2. **Navigate to Network Access**
   - Click on your project
   - In the left sidebar, click **"Network Access"** (under Security)

3. **Add IP Address**
   - Click **"Add IP Address"** button
   - Choose one of these options:
     - **Option A (Recommended for Development)**: Click **"Allow Access from Anywhere"**
       - This adds `0.0.0.0/0` to whitelist
       - ⚠️ Less secure, but convenient for development
     - **Option B (More Secure)**: Enter your current IP address
       - Click **"Add Current IP Address"** or manually enter it
       - Click **"Confirm"**

4. **Wait for Changes to Apply**
   - Changes usually take 1-2 minutes to propagate
   - The status will show as "Active" when ready

### Step 3: Run Seed Script Again
```bash
npm run seed:complete
```

## Alternative: Use Local MongoDB

If you prefer to use local MongoDB for seeding:

### Option 1: Using Docker
```bash
# Start MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Run seed with local flag
npm run seed:complete:local
```

### Option 2: Install MongoDB Locally
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Run: `npm run seed:complete:local`

### Option 3: Set Environment Variable
Add to `backend/api/.env`:
```
USE_LOCAL_MONGODB=true
```

Then run:
```bash
npm run seed:complete
```

## Troubleshooting

### Still Getting Connection Errors?

1. **Check MongoDB Atlas Status**
   - Ensure your cluster is running (not paused)
   - Check cluster status in Atlas dashboard

2. **Verify Connection String**
   - Check `backend/api/.env` file
   - Ensure `MONGODB_URI` is correct
   - Make sure password is URL-encoded if it contains special characters

3. **Check Firewall/VPN**
   - Some corporate networks block MongoDB connections
   - Try from a different network or disable VPN

4. **Test Connection**
   ```bash
   # Test MongoDB connection
   mongosh "your-connection-string"
   ```

## Security Note

⚠️ **Important**: Using `0.0.0.0/0` (Allow from anywhere) is convenient for development but should **NOT** be used in production. For production:
- Whitelist only specific IP addresses
- Use MongoDB Atlas VPC peering
- Implement proper authentication and encryption

