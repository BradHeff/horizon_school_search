# CDN Integration Guide - CloudFlare

This document provides instructions for integrating CloudFlare CDN with the Horizon School Search application.

## Overview

CloudFlare CDN provides:
- **Global Content Delivery**: Faster load times worldwide
- **DDoS Protection**: Enterprise-level security
- **Auto-Minification**: CSS/JS compression
- **Brotli Compression**: Better than gzip
- **Image Optimization**: Automatic WebP conversion
- **Caching**: Smart caching for static assets

## Prerequisites

1. CloudFlare account (Free tier works)
2. Domain managed by CloudFlare DNS
3. SSL/TLS certificate (CloudFlare provides free)

## Setup Steps

### 1. Domain Configuration

Add your domain to CloudFlare:

```bash
# Your domain
search.horizon.sa.edu.au

# Backend API domain
search-api.horizon.sa.edu.au
```

### 2. DNS Records

Configure DNS records in CloudFlare:

```
Type    Name            Content                     Proxy Status
-----   -----------     -----------------------     ------------
A       search          <frontend-server-ip>        Proxied (Orange)
A       search-api      <backend-server-ip>         Proxied (Orange)
CNAME   www.search      search.horizon.sa.edu.au    Proxied (Orange)
```

### 3. SSL/TLS Configuration

**Recommended Settings:**
- SSL/TLS encryption mode: **Full (strict)**
- Always Use HTTPS: **On**
- Automatic HTTPS Rewrites: **On**
- Minimum TLS Version: **TLS 1.2**

```bash
# CloudFlare Dashboard > SSL/TLS > Overview
Encryption mode: Full (strict)

# CloudFlare Dashboard > SSL/TLS > Edge Certificates
Always Use HTTPS: On
HTTP Strict Transport Security (HSTS): Enabled
  - Max Age: 12 months
  - Include subdomains: Yes
  - Preload: Yes
```

### 4. Speed Optimization

**Auto Minify:**
```
CloudFlare Dashboard > Speed > Optimization

✓ JavaScript Minification
✓ CSS Minification
✓ HTML Minification
```

**Brotli Compression:**
```
CloudFlare Dashboard > Speed > Optimization

✓ Brotli (enabled automatically)
```

**Rocket Loader:**
```
CloudFlare Dashboard > Speed > Optimization

Rocket Loader: Off (can interfere with React)
```

### 5. Caching Rules

**Browser Cache TTL:**
```
CloudFlare Dashboard > Caching > Configuration

Browser Cache TTL: 4 hours (for static assets)
```

**Page Rules:**
```
CloudFlare Dashboard > Rules > Page Rules

Rule 1: Cache Static Assets
  URL: search.horizon.sa.edu.au/static/*
  Settings:
    - Cache Level: Cache Everything
    - Edge Cache TTL: 1 month
    - Browser Cache TTL: 1 week

Rule 2: Bypass API Cache
  URL: search-api.horizon.sa.edu.au/*
  Settings:
    - Cache Level: Bypass

Rule 3: Cache Homepage
  URL: search.horizon.sa.edu.au/
  Settings:
    - Cache Level: Cache Everything
    - Edge Cache TTL: 2 hours
```

### 6. Image Optimization

**Polish (WebP conversion):**
```
CloudFlare Dashboard > Speed > Optimization

Polish: Lossless (or Lossy for better compression)
WebP: Enabled
```

**Mirage (Lazy Loading):**
```
CloudFlare Dashboard > Speed > Optimization

Mirage: On (lazy loads images)
```

### 7. Security Configuration

**Firewall Rules:**
```
CloudFlare Dashboard > Security > WAF

Mode: High
Challenge Passage: 30 minutes

Custom Rule:
  Name: Block suspicious requests
  Expression: (http.request.uri.path contains "../") or
              (http.request.uri.path contains "wp-admin")
  Action: Block
```

**Rate Limiting:**
```
CloudFlare Dashboard > Security > Rate Limiting

Rule: API Rate Limit
  URL: search-api.horizon.sa.edu.au/*
  Threshold: 1000 requests per 10 minutes
  Action: Block for 1 hour
```

### 8. Performance Settings

**HTTP/3 (QUIC):**
```
CloudFlare Dashboard > Network

HTTP/3 (with QUIC): On
0-RTT Connection Resumption: On
```

**IPv6:**
```
CloudFlare Dashboard > Network

IPv6 Compatibility: On
```

**WebSockets:**
```
CloudFlare Dashboard > Network

WebSockets: On (for real-time features)
```

### 9. Caching Strategy

**Frontend Application:**
```javascript
// Cache-Control headers for different asset types

// HTML (index.html)
Cache-Control: public, max-age=0, must-revalidate

// JavaScript bundles
Cache-Control: public, max-age=31536000, immutable

// CSS files
Cache-Control: public, max-age=31536000, immutable

// Images
Cache-Control: public, max-age=31536000, immutable

// Fonts
Cache-Control: public, max-age=31536000, immutable
```

**Backend API:**
```javascript
// No caching for API responses
Cache-Control: no-cache, no-store, must-revalidate

// Cache static API documentation
Cache-Control: public, max-age=3600
```

### 10. Environment Configuration

**Frontend `.env`:**
```bash
# CDN Configuration
REACT_APP_CDN_URL=https://cdn.cloudflare.com/horizon-search
REACT_APP_ENABLE_CDN=true
REACT_APP_IMAGE_CDN=https://imagedelivery.net/horizon-search

# CloudFlare Analytics
REACT_APP_CF_ANALYTICS_TOKEN=your_cf_analytics_token
```

**Backend `.env`:**
```bash
# CloudFlare Configuration
CF_ZONE_ID=your_zone_id
CF_API_TOKEN=your_api_token
CF_PURGE_CACHE_ON_DEPLOY=true
```

### 11. Cache Purge Script

Create a script to purge cache on deployment:

```bash
#!/bin/bash
# scripts/purge-cf-cache.sh

CF_ZONE_ID="your_zone_id"
CF_API_TOKEN="your_api_token"

echo "Purging CloudFlare cache..."

curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

echo "Cache purged successfully!"
```

### 12. Analytics & Monitoring

**CloudFlare Analytics:**
```
CloudFlare Dashboard > Analytics > Traffic

Monitor:
- Requests
- Bandwidth
- Threats
- Cache hit ratio
```

**Web Analytics:**
```
CloudFlare Dashboard > Analytics > Web Analytics

Add Web Analytics to your site:
<script defer src='https://static.cloudflare.com/beacon.min.js'
        data-cf-beacon='{"token": "your-token"}'></script>
```

### 13. Workers (Optional Advanced Feature)

Deploy CloudFlare Workers for edge computing:

```javascript
// worker.js - Edge caching logic

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Custom caching logic
  if (url.pathname.startsWith('/api/')) {
    // Don't cache API requests
    return fetch(request)
  }

  // Cache static assets
  const cache = caches.default
  let response = await cache.match(request)

  if (!response) {
    response = await fetch(request)

    // Cache successful responses
    if (response.status === 200) {
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=86400')

      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      })

      event.waitUntil(cache.put(request, response.clone()))
    }
  }

  return response
}
```

### 14. Deployment Checklist

- [ ] DNS records configured and proxied through CloudFlare
- [ ] SSL/TLS set to Full (strict)
- [ ] Auto-minification enabled
- [ ] Image optimization (Polish) enabled
- [ ] Page rules configured
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] HTTP/3 enabled
- [ ] Cache purge script configured
- [ ] Analytics set up
- [ ] Test CDN performance
- [ ] Verify HTTPS enforcement
- [ ] Check mobile performance

### 15. Testing

**Test CDN Performance:**
```bash
# Check if CloudFlare is active
curl -I https://search.horizon.sa.edu.au

# Look for:
# cf-ray: <ray-id>
# cf-cache-status: HIT/MISS/DYNAMIC
# server: cloudflare

# Test image optimization
curl -I https://search.horizon.sa.edu.au/logo.png
# Should show: content-type: image/webp (if supported)
```

**Performance Testing Tools:**
- CloudFlare Speed Test
- WebPageTest.org
- Google PageSpeed Insights
- GTmetrix

### 16. Monitoring & Maintenance

**Regular Tasks:**
1. Review CloudFlare Analytics weekly
2. Check cache hit ratio (aim for >80%)
3. Monitor bandwidth usage
4. Review security threats
5. Update firewall rules as needed
6. Purge cache after deployments

**Performance Metrics to Track:**
- Time to First Byte (TTFB)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Cache hit ratio
- Bandwidth saved

## Support

For issues or questions:
- CloudFlare Support: https://support.cloudflare.com
- CloudFlare Community: https://community.cloudflare.com
- Internal IT: brad.heffernan@horizon.sa.edu.au

## Additional Resources

- [CloudFlare Documentation](https://developers.cloudflare.com/)
- [CloudFlare Page Rules](https://support.cloudflare.com/hc/en-us/articles/218411427)
- [CloudFlare Workers](https://workers.cloudflare.com/)
- [CloudFlare Analytics](https://www.cloudflare.com/analytics/)
