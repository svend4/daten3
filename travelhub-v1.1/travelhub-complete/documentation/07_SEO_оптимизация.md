# 🎯 Пункт 7: SEO Оптимизация

## Обзор SEO стратегии

```
Technical SEO → On-Page SEO → Off-Page SEO → Content Strategy
```

## 1. Technical SEO

### Sitemap.xml

```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://travelhub.com/</loc>
    <lastmod>2025-12-19</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://travelhub.com/hotels</loc>
    <lastmod>2025-12-19</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://travelhub.com/flights</loc>
    <lastmod>2025-12-19</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://travelhub.com/cars</loc>
    <lastmod>2025-12-19</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### Robots.txt

```txt
# public/robots.txt
User-agent: *
Allow: /

# Disallow admin pages
Disallow: /admin/
Disallow: /api/

# Sitemap location
Sitemap: https://travelhub.com/sitemap.xml
Sitemap: https://travelhub.com/sitemap-destinations.xml
Sitemap: https://travelhub.com/sitemap-hotels.xml

# Crawl-delay for good citizenship
Crawl-delay: 1
```

### Dynamic Sitemap Generator

```typescript
// backend/src/routes/sitemap.ts
import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  const baseUrl = 'https://travelhub.com';
  
  // Get all destinations from DB
  const destinations = await db.query(
    'SELECT slug, updated_at FROM destinations ORDER BY updated_at DESC'
  );
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${destinations.rows.map(dest => `
  <url>
    <loc>${baseUrl}/destination/${dest.slug}</loc>
    <lastmod>${dest.updated_at.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  `).join('')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

export default router;
```

## 2. Meta Tags Component

```typescript
// frontend/src/components/common/SEOHead.tsx
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
}

export default function SEOHead({
  title,
  description,
  keywords = '',
  ogImage = '/og-image.jpg',
  ogType = 'website',
  canonicalUrl
}: SEOHeadProps) {
  const fullTitle = `${title} | TravelHub`;
  const siteUrl = 'https://travelhub.com';
  const canonical = canonicalUrl || siteUrl;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="TravelHub" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Russian" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="TravelHub" />
    </Helmet>
  );
}
```

### Usage Example

```typescript
// frontend/src/pages/Home.tsx
import SEOHead from '../components/common/SEOHead';

export default function Home() {
  return (
    <>
      <SEOHead
        title="Найдите идеальное путешествие"
        description="Сравните тысячи предложений на отели, авиабилеты и аренду автомобилей. Сэкономьте до 50% на бронировании путешествий."
        keywords="отели, авиабилеты, путешествия, туры, бронирование"
        ogImage="/images/home-og.jpg"
      />
      {/* Page content */}
    </>
  );
}
```

## 3. Structured Data (Schema.org)

### Organization Schema

```typescript
// frontend/src/components/common/StructuredData.tsx
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "TravelHub",
    "url": "https://travelhub.com",
    "logo": "https://travelhub.com/logo.png",
    "description": "Сравните цены на отели, авиабилеты и аренду автомобилей",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "RU"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "support@travelhub.com"
    },
    "sameAs": [
      "https://facebook.com/travelhub",
      "https://twitter.com/travelhub",
      "https://instagram.com/travelhub"
    ]
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Hotel Schema

```typescript
export function HotelSchema({ hotel }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": hotel.name,
    "description": hotel.description,
    "image": hotel.images,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": hotel.address,
      "addressLocality": hotel.city,
      "addressCountry": hotel.country
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": hotel.latitude,
      "longitude": hotel.longitude
    },
    "starRating": {
      "@type": "Rating",
      "ratingValue": hotel.stars
    },
    "priceRange": `${hotel.minPrice}-${hotel.maxPrice} RUB`,
    "amenityFeature": hotel.amenities.map(a => ({
      "@type": "LocationFeatureSpecification",
      "name": a
    }))
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Breadcrumb Schema

```typescript
export function BreadcrumbSchema({ items }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

## 4. Page Speed Optimization

### Image Optimization

```typescript
// frontend/src/components/common/OptimizedImage.tsx
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  loading?: 'lazy' | 'eager';
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  loading = 'lazy'
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  
  // Generate srcset for responsive images
  const srcset = `
    ${src}?w=400 400w,
    ${src}?w=800 800w,
    ${src}?w=1200 1200w
  `;
  
  return (
    <div className="relative" style={{ aspectRatio: `${width}/${height}` }}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        srcSet={srcset}
        sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
```

### Code Splitting

```typescript
// frontend/src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loading from './components/common/Loading';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const FlightSearch = lazy(() => import('./pages/FlightSearch'));
const HotelSearch = lazy(() => import('./pages/HotelSearch'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flights" element={<FlightSearch />} />
        <Route path="/hotels" element={<HotelSearch />} />
      </Routes>
    </Suspense>
  );
}
```

## 5. Content Strategy

### SEO-Friendly URLs

```
✅ GOOD:
https://travelhub.com/hotels/paris
https://travelhub.com/flights/moscow-to-london
https://travelhub.com/blog/best-hotels-paris

❌ BAD:
https://travelhub.com/search?id=123&type=hotel
https://travelhub.com/page.php?q=paris
```

### H1-H6 Hierarchy

```typescript
// Good SEO structure
<article>
  <h1>Лучшие отели Парижа 2025</h1>
  
  <section>
    <h2>Роскошные отели</h2>
    <h3>Le Bristol Paris</h3>
    <h3>Four Seasons George V</h3>
  </section>
  
  <section>
    <h2>Бюджетные варианты</h2>
    <h3>Hotel Central Saint Germain</h3>
  </section>
</article>
```

### Content Length

- **Главная:** 500-800 слов
- **Категории:** 300-500 слов
- **Блог:** 1500-2500 слов
- **Landing pages:** 800-1200 слов

## 6. Local SEO

### Location Pages

```typescript
// Generate location-specific pages
const locations = [
  { city: 'Москва', slug: 'moscow' },
  { city: 'Санкт-Петербург', slug: 'saint-petersburg' },
  { city: 'Париж', slug: 'paris' },
  // ...
];

// Routes
<Route path="/hotels/:city" element={<HotelsByCity />} />
<Route path="/flights/from/:city" element={<FlightsFrom />} />
```

### LocalBusiness Schema

```typescript
export function LocalBusinessSchema({ location }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `TravelHub ${location.city}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": location.city,
      "addressCountry": location.country
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": location.lat,
      "longitude": location.lng
    }
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

## 7. Analytics Integration

### Google Analytics 4

```typescript
// frontend/src/utils/analytics.ts
export const pageview = (url: string) => {
  window.gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track search
export const trackSearch = (searchType: string, destination: string) => {
  event({
    action: 'search',
    category: searchType,
    label: destination
  });
};

// Track booking
export const trackBooking = (type: string, value: number) => {
  event({
    action: 'booking',
    category: type,
    value: value
  });
};
```

### Usage in Components

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageview } from '../utils/analytics';

export default function App() {
  const location = useLocation();
  
  useEffect(() => {
    pageview(location.pathname + location.search);
  }, [location]);
  
  return <YourApp />;
}
```

## 8. Link Building Strategy

### Internal Linking

```typescript
// Автоматическое создание связанных ссылок
const relatedDestinations = [
  { name: 'Париж', slug: 'paris' },
  { name: 'Рим', slug: 'rome' },
  { name: 'Барселона', slug: 'barcelona' }
];

<section className="related-destinations">
  <h3>Похожие направления</h3>
  <ul>
    {relatedDestinations.map(dest => (
      <li key={dest.slug}>
        <Link to={`/destination/${dest.slug}`}>
          Отели в {dest.name}
        </Link>
      </li>
    ))}
  </ul>
</section>
```

### External Links (NoFollow)

```typescript
<a 
  href="https://partner-site.com/offer"
  target="_blank"
  rel="nofollow noopener noreferrer"
>
  Забронировать на сайте партнёра
</a>
```

## 9. Mobile SEO

### Viewport Configuration

```html
<!-- Already in index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

### Mobile-First Responsive Design

```css
/* Mobile first approach */
.search-widget {
  display: block;
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .search-widget {
    display: flex;
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .search-widget {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## 10. Performance Metrics

### Core Web Vitals Monitoring

```typescript
// frontend/src/utils/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}

// Send to analytics
const sendToAnalytics = (metric: any) => {
  window.gtag('event', metric.name, {
    value: Math.round(metric.value),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

### Target Metrics

```
✅ First Contentful Paint (FCP): < 1.8s
✅ Largest Contentful Paint (LCP): < 2.5s
✅ First Input Delay (FID): < 100ms
✅ Cumulative Layout Shift (CLS): < 0.1
✅ Time to First Byte (TTFB): < 600ms
```

## 11. Google Search Console Setup

### Verification Meta Tag

```html
<!-- Add to index.html -->
<meta name="google-site-verification" content="your-verification-code" />
```

### Submit Sitemap

```
1. Go to Google Search Console
2. Select your property
3. Navigate to Sitemaps
4. Submit: https://travelhub.com/sitemap.xml
```

## 12. SEO Monitoring Checklist

```markdown
### Weekly Tasks
- [ ] Check Google Analytics traffic
- [ ] Monitor Core Web Vitals
- [ ] Review Search Console errors
- [ ] Check broken links
- [ ] Monitor page speed

### Monthly Tasks
- [ ] Analyze keyword rankings
- [ ] Review backlinks
- [ ] Update sitemap
- [ ] Audit meta descriptions
- [ ] Check mobile usability

### Quarterly Tasks
- [ ] Full SEO audit
- [ ] Competitor analysis
- [ ] Content gap analysis
- [ ] Update content strategy
- [ ] Review and update old content
```

## 13. Keyword Strategy

### Primary Keywords
```
- "бронирование отелей"
- "дешевые авиабилеты"
- "аренда автомобилей"
- "путешествия онлайн"
- "сравнение цен отелей"
```

### Long-tail Keywords
```
- "лучшие отели в Париже недорого"
- "авиабилеты Москва Париж дешево"
- "как забронировать отель онлайн"
- "сравнение цен на авиабилеты"
```

### Keyword Implementation

```typescript
// In page content
const keywords = {
  primary: "бронирование отелей",
  secondary: ["дешевые отели", "онлайн бронирование"],
  longTail: "лучшие отели в Париже"
};

// Use in:
// 1. Title
// 2. H1
// 3. First paragraph
// 4. Meta description
// 5. Image alt tags
// 6. Internal links
```

---

**Итого:** Полная SEO оптимизация готова к внедрению! 🎯
