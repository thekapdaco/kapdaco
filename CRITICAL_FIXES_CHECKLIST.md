# 🚨 CRITICAL FIXES CHECKLIST - MUST FIX BEFORE DEPLOYMENT

## Priority 1: Security (BLOCKER)

### 1. Move JWT to HTTP-Only Cookies
**Files to modify:**
- `backend/src/routes/auth.js` - Login/signup endpoints
- `src/context/AuthContext.jsx` - Remove localStorage token handling
- `src/lib/api.js` - Remove Authorization header, use cookies

**Time estimate:** 2-3 hours

---

## Priority 2: Deployment Paths (BLOCKER)

### 2. Fix Frontend Build Path
**File:** `backend/server.js:324`
**Change:**
```javascript
// FROM:
app.use(express.static(path.join(__dirname, '../frontend/build')));

// TO (if deploying separately - RECOMMENDED):
// Remove this entire block - frontend served separately

// OR (if deploying together):
app.use(express.static(path.join(__dirname, '../dist')));
```

**Time estimate:** 5 minutes

### 3. Fix dotenv Path
**File:** `backend/server.js:32`
**Change:**
```javascript
// FROM:
dotenv.config({ path: './api/.env' });

// TO:
dotenv.config({ path: path.join(__dirname, '.env') });
// OR if .env is in backend root:
dotenv.config();
```

**Time estimate:** 2 minutes

---

## Priority 3: Environment Variables (BLOCKER)

### 4. Add VITE_API_BASE_URL to env.example
**File:** `env.example` (root)
**Add:**
```env
# Frontend API Base URL (leave empty for same-domain, or set to backend URL)
VITE_API_BASE_URL=
```

**Time estimate:** 1 minute

### 5. Set Production Environment Variables
**Action:** Configure in Hostinger:
- `VITE_API_BASE_URL` (frontend)
- `CORS_ALLOWED_ORIGINS` (backend)
- `CLIENT_URL` (backend)

**Time estimate:** 10 minutes

---

## Priority 4: Code Cleanup (SHOULD FIX)

### 6. Remove console.log Statements
**Files:**
- `src/context/AuthContext.jsx` - Lines 70, 174, 178
- `src/context/CartContext.jsx` - Lines 102, 106
- `src/lib/api.js` - Line 52
- `backend/src/controllers/order.controller.js` - Line 656

**Time estimate:** 10 minutes

### 7. Add Node Version Specification
**File:** `backend/package.json`
**Add:**
```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
}
```

**Time estimate:** 1 minute

---

## Quick Fix Script

Run these commands to verify fixes:

```bash
# 1. Check for console.log in production code
grep -r "console\.log" src/ backend/src/ --exclude-dir=node_modules

# 2. Verify environment variables
cd backend && npm run validate-env

# 3. Test build
npm run build
cd backend && npm start
```

---

## Deployment Order

1. ✅ Fix all Priority 1-3 items (BLOCKERS)
2. ✅ Test locally with production-like environment
3. ✅ Fix Priority 4 items (cleanup)
4. ✅ Deploy to staging
5. ✅ Run smoke tests
6. ✅ Deploy to production

---

**Total Estimated Time:** 3-4 hours for critical fixes

