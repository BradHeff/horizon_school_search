# Backend Authentication Debug & Enhanced Logging

## Issue

Despite backend login succeeding, the Moderation and Analytics pages were still receiving 401 errors:

```
✅ Backend login successful { hasAccessToken: true, hasRefreshToken: true }
[Immediately after]
Backend request failed for /moderation/rules?: Error: Authentication expired
```

Backend logs showed:
```
02:21:03 - POST /auth/login HTTP/1.1" 200  ✅ Login succeeds
02:21:10 - GET /moderation/rules HTTP/1.1" 401  ❌ 401 error
```

## Root Cause

Two separate issues:

### Issue 1: Race Condition Still Occurring
- Components were making API calls before checking `isAuthenticated()` properly
- Single retry with 1-second delay wasn't sufficient
- ModerationPanel was skipping the wait check entirely

### Issue 2: Lack of Visibility
- No logging to show when tokens were saved/loaded
- No logging to show what token was being sent in requests
- Hard to diagnose whether token was missing or invalid

## Solution

### Part 1: Enhanced Token Logging

**File:** `src/services/backendService.ts`

Added comprehensive logging throughout the authentication flow:

#### 1. Loading Tokens from Storage (lines 234-245)
```typescript
private loadTokensFromStorage(): void {
  this.accessToken = localStorage.getItem('horizon_access_token');
  this.refreshToken = localStorage.getItem('horizon_refresh_token');

  if (this.accessToken || this.refreshToken) {
    console.log('📂 Loaded tokens from storage', {
      hasAccessToken: !!this.accessToken,
      accessTokenPrefix: this.accessToken?.substring(0, 20) + '...',
      hasRefreshToken: !!this.refreshToken
    });
  }
}
```

#### 2. Saving Tokens to Storage (lines 247-264)
```typescript
private saveTokensToStorage(accessToken: string, refreshToken: string | null): void {
  this.accessToken = accessToken;
  this.refreshToken = refreshToken;

  localStorage.setItem('horizon_access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('horizon_refresh_token', refreshToken);
  } else {
    localStorage.removeItem('horizon_refresh_token');
  }

  console.log('💾 Tokens saved to storage', {
    accessTokenLength: accessToken?.length || 0,
    accessTokenPrefix: accessToken?.substring(0, 20) + '...',
    hasRefreshToken: !!refreshToken,
    isAuthenticatedNow: this.isAuthenticated()
  });
}
```

#### 3. Making Authenticated Requests (lines 273-290)
```typescript
if (requireAuth && this.accessToken) {
  headers['Authorization'] = `Bearer ${this.accessToken}`;
  console.log('🔑 Making authenticated request to', endpoint, {
    hasToken: !!this.accessToken,
    tokenPrefix: this.accessToken?.substring(0, 20) + '...'
  });
} else if (requireAuth && !this.accessToken) {
  console.warn('⚠️ Making request to', endpoint, 'but no access token available');
}
```

### Part 2: Improved Retry Logic with Multiple Attempts

**File:** `src/components/Analytics/AnalyticsDashboard.tsx` (lines 56-97)

**File:** `src/components/Moderation/ModerationPanel.tsx` (lines 69-102)

Changed from single retry to multiple retry attempts:

**Before (Single Retry):**
```typescript
if (!backendService.isAuthenticated()) {
  console.log('⏳ Analytics waiting for backend authentication...');
  setTimeout(() => {
    if (backendService.isAuthenticated()) {
      loadData();
    }
  }, 1000);
  return;
}
```

**After (Multiple Retries):**
```typescript
const [authRetries, setAuthRetries] = useState(0);
const maxAuthRetries = 5;

if (!backendService.isAuthenticated()) {
  if (authRetries < maxAuthRetries) {
    console.log(`⏳ Analytics waiting for backend authentication... (attempt ${authRetries + 1}/${maxAuthRetries})`);
    setAuthRetries(prev => prev + 1);
    setTimeout(() => {
      loadData();
    }, 500);
    return;
  } else {
    console.error('❌ Analytics: Backend authentication timeout after', maxAuthRetries, 'attempts');
    setLoading(false);
    return;
  }
}

// Reset retry counter on successful auth
setAuthRetries(0);
```

### Part 3: Faster Retry Interval

- Changed retry delay from 1000ms → 500ms
- Up to 5 retry attempts
- Total wait time: 2.5 seconds maximum
- More responsive to authentication completing

## Files Modified

1. **`src/services/backendService.ts`**
   - Added `loadTokensFromStorage()` logging (lines 234-245)
   - Added `saveTokensToStorage()` logging (lines 247-264)
   - Added `makeRequest()` logging (lines 273-290)

2. **`src/components/Analytics/AnalyticsDashboard.tsx`**
   - Added retry counter state (line 56-57)
   - Improved retry logic with multiple attempts (lines 59-97)
   - Faster retry interval (500ms instead of 1000ms)

3. **`src/components/Moderation/ModerationPanel.tsx`**
   - Added retry counter state (lines 69-70)
   - Improved retry logic with multiple attempts (lines 72-102)
   - Faster retry interval (500ms instead of 1000ms)

## Expected Console Logs

### Successful Authentication Flow:

```
🔗 Backend service initialized: https://search-api.horizon.sa.edu.au
🔄 Found MSAL account without backend token, attempting backend login...
🔐 Logging in to backend... { email: "user@horizon.sa.edu.au", rememberMe: true }
💾 Tokens saved to storage {
  accessTokenLength: 187,
  accessTokenPrefix: "eyJhbGciOiJIUzI1NiIsInR...",
  hasRefreshToken: true,
  isAuthenticatedNow: true
}
✅ Backend login successful { hasAccessToken: true, hasRefreshToken: true }
✅ Backend login successful during auto-login

[Components mount]
⏳ Analytics waiting for backend authentication... (attempt 1/5)
⏳ Moderation waiting for backend authentication... (attempt 1/5)

[500ms later]
⏳ Analytics waiting for backend authentication... (attempt 2/5)
⏳ Moderation waiting for backend authentication... (attempt 2/5)

[500ms later - auth complete]
🔑 Making authenticated request to /moderation/searches?limit=100 {
  hasToken: true,
  tokenPrefix: "eyJhbGciOiJIUzI1NiIsInR..."
}
🔑 Making authenticated request to /moderation/stats {
  hasToken: true,
  tokenPrefix: "eyJhbGciOiJIUzI1NiIsInR..."
}
[Data loads successfully]
```

### Authentication Failure:

```
❌ Backend login request failed: TypeError: Failed to fetch
❌ Backend URL: https://search-api.horizon.sa.edu.au
❌ Error type: TypeError
❌ Error message: Failed to fetch

[Components mount]
⏳ Analytics waiting for backend authentication... (attempt 1/5)
⏳ Analytics waiting for backend authentication... (attempt 2/5)
⏳ Analytics waiting for backend authentication... (attempt 3/5)
⏳ Analytics waiting for backend authentication... (attempt 4/5)
⏳ Analytics waiting for backend authentication... (attempt 5/5)
❌ Analytics: Backend authentication timeout after 5 attempts
```

### Token Missing (No Token in Storage):

```
⚠️ Making request to /moderation/rules but no access token available
Backend request failed for /moderation/rules: Error: Authentication expired
```

## Diagnostic Guide

### If You See "💾 Tokens saved to storage"

✅ Login succeeded and tokens were saved correctly

Check:
- `accessTokenLength` should be ~150-250 characters
- `accessTokenPrefix` shows the JWT token format (starts with "eyJ")
- `isAuthenticatedNow: true`

### If You See "⚠️ Making request but no access token available"

❌ Token is missing when making API calls

Possible causes:
1. Login failed silently before tokens were saved
2. Tokens were cleared between login and API call
3. Race condition where API call happened before login completed

### If You See "🔑 Making authenticated request"

✅ Token is being sent correctly

If backend still returns 401:
1. **Token is expired** - Check backend token expiration settings
2. **Token is invalid** - Backend may not recognize the token format
3. **Backend auth middleware issue** - Backend may not be parsing Authorization header correctly

### If Components Show "⏳ waiting..." Messages

✅ Retry logic is working

- Should see 1-5 attempts before timeout
- Each attempt is 500ms apart
- If reaches 5 attempts without success, backend authentication failed

## Testing Steps

### 1. Deploy New Build

```bash
npm run build
# Deploy build folder
```

### 2. Clear Browser Storage

- DevTools → Application → Clear Local Storage
- Clear Cookies
- Forces fresh authentication flow

### 3. Watch Console Logs

Open browser console and look for the new emoji logs:
- 📂 Token loading
- 💾 Token saving
- 🔑 Authenticated requests
- ⏳ Component waiting
- ✅ Success indicators
- ❌ Error indicators

### 4. Navigate to Analytics or Moderation

Watch the authentication flow:
1. Should see "💾 Tokens saved"
2. Should see "⏳ waiting..." (1-3 attempts)
3. Should see "🔑 Making authenticated request"
4. Data should load successfully

### 5. Check Backend Logs

Compare backend logs with frontend logs:
- Frontend: `💾 Tokens saved` + token prefix
- Backend: `POST /auth/login HTTP/1.1" 200`
- Frontend: `🔑 Making authenticated request` + token prefix
- Backend: Should see `GET /moderation/rules HTTP/1.1" 200` (not 401)

If backend shows 401, copy the token prefix from frontend logs and verify it matches what backend expects.

## Troubleshooting with New Logs

### Problem: Token Never Saved

**Symptom:**
```
✅ Backend login successful
[No "💾 Tokens saved" message]
⚠️ Making request but no access token available
```

**Diagnosis:** Backend returned success but without tokens in response

**Solution:** Check backend response format, ensure it includes `tokens.accessToken`

### Problem: Token Saved but Not Used

**Symptom:**
```
💾 Tokens saved to storage { accessTokenLength: 187, ... }
⚠️ Making request but no access token available
```

**Diagnosis:** Token was saved but cleared or not loaded correctly

**Solution:** Check if token is being cleared between save and use

### Problem: Token Sent but Rejected

**Symptom:**
```
🔑 Making authenticated request { hasToken: true, tokenPrefix: "eyJ..." }
Backend request failed: Authentication expired
```

**Diagnosis:** Token is sent but backend rejects it

**Solutions:**
1. Check token expiration on backend
2. Verify backend JWT secret matches
3. Check backend Authorization header parsing
4. Compare token prefix in logs with backend expectations

### Problem: Components Timeout Waiting

**Symptom:**
```
⏳ Analytics waiting... (attempt 1/5)
⏳ Analytics waiting... (attempt 2/5)
...
❌ Analytics: Backend authentication timeout after 5 attempts
```

**Diagnosis:** Backend login never completes successfully

**Solution:** Check earlier logs for backend login errors

## Build Info

- **Build Status:** ✅ Success
- **Build Size:** 300.28 kB (gzipped) - increased by 326 bytes for logging
- **Warnings:** Only unused imports (non-critical)

## Benefits of Enhanced Logging

1. **Token Lifecycle Visibility**
   - See when tokens are loaded from storage
   - See when tokens are saved to storage
   - See token length and prefix for validation

2. **Request Authentication Status**
   - See which requests include auth tokens
   - See which requests are missing tokens
   - See token prefix being sent

3. **Retry Logic Transparency**
   - See how many retry attempts are made
   - See when retries succeed or timeout
   - Clear error messages on failure

4. **Easy Debugging**
   - Emoji prefixes make logs easy to scan
   - Token prefixes allow verification
   - Timestamps from browser show timing issues

## Summary

✅ Added comprehensive logging throughout authentication flow
✅ Shows token loading, saving, and sending
✅ Improved retry logic from 1 attempt to 5 attempts
✅ Faster retry interval (500ms instead of 1000ms)
✅ Clear error messages on timeout
✅ Easy to diagnose token issues with new logs
✅ Token prefixes allow verification against backend
✅ Retry attempt counters show progress

With these changes, you can now:
1. See exactly when tokens are saved and their format
2. See if tokens are being sent in requests
3. Determine if 401 errors are due to missing or invalid tokens
4. Watch the retry logic working in real-time
5. Diagnose authentication issues quickly

Deploy this build and check the browser console - the new logs will show you exactly what's happening with the authentication flow!
