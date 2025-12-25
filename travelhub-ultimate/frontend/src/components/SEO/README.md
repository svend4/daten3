# SEO Components

## Overview

This directory contains SEO optimization components for TravelHub that improve search engine visibility, social media sharing, and provide rich snippets in search results.

## Components

### SEOHead

A React component for managing page meta tags using `react-helmet-async`.

**Features:**
- Dynamic page titles and descriptions
- Open Graph meta tags for social media sharing (Facebook, LinkedIn)
- Twitter Card meta tags
- Keywords and canonical URLs
- Robots directives (noindex, nofollow)

**Usage:**

```tsx
import SEOHead from '../components/SEO/SEOHead';

function MyPage() {
  return (
    <div>
      <SEOHead
        title="My Page Title"
        description="A compelling description of my page"
        keywords={['keyword1', 'keyword2', 'keyword3']}
        image="https://example.com/image.jpg"
        type="website"
      />
      {/* Your page content */}
    </div>
  );
}
```

**Props:**

- `title` (string, optional): Page title. Default: "TravelHub - Book Flights, Hotels & Car Rentals"
- `description` (string, optional): Page description for search results
- `keywords` (string[], optional): Array of keywords for the page
- `image` (string, optional): Image URL for social media sharing
- `url` (string, optional): Canonical URL of the page
- `type` ('website' | 'article' | 'product', optional): Open Graph type
- `author` (string, optional): Author name for articles
- `publishedTime` (string, optional): Publication date for articles
- `modifiedTime` (string, optional): Last modification date
- `noindex` (boolean, optional): Prevent search engine indexing
- `nofollow` (boolean, optional): Prevent following links

### StructuredData

A component for adding Schema.org JSON-LD structured data to pages.

**Features:**
- Support for multiple Schema.org types
- Organization markup
- WebSite with SearchAction
- Hotel, Flight, Product entities
- BreadcrumbList for navigation

**Usage:**

```tsx
import StructuredData from '../components/SEO/StructuredData';

// Organization data (already added to App.tsx)
<StructuredData
  type="Organization"
  data={{}}
/>

// Hotel data
<StructuredData
  type="Hotel"
  data={{
    name: "Grand Hotel",
    image: "https://example.com/hotel.jpg",
    address: {
      street: "123 Main St",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      country: "US"
    },
    location: {
      lat: 40.7128,
      lng: -74.0060
    },
    priceRange: "$$$",
    phone: "+1-555-1234",
    rating: 4.5
  }}
/>

// Product data (for booking offers)
<StructuredData
  type="Product"
  data={{
    name: "Hotel Booking",
    image: "https://example.com/image.jpg",
    description: "5-star hotel in downtown",
    url: "https://daten3.onrender.com/hotel/123",
    currency: "USD",
    price: 299,
    available: true,
    rating: {
      value: 4.5,
      count: 150
    }
  }}
/>

// Breadcrumb navigation
<StructuredData
  type="BreadcrumbList"
  data={{
    items: [
      { name: "Home", url: "https://daten3.onrender.com/" },
      { name: "Hotels", url: "https://daten3.onrender.com/hotels" },
      { name: "New York", url: "https://daten3.onrender.com/hotels/new-york" }
    ]
  }}
/>
```

## Files

### public/robots.txt

Instructs search engine crawlers on which pages to index.

**Current configuration:**
- Allows all user agents
- Disallows admin and user-specific pages
- Disallows API endpoints
- Points to sitemap.xml

### public/sitemap.xml

Lists all public pages for search engine crawlers.

**Includes:**
- Homepage (priority 1.0)
- Main services (flights, hotels - priority 0.9)
- Auth pages (priority 0.6)
- Information pages (privacy, terms - priority 0.4-0.7)
- Affiliate program (priority 0.6-0.7)

**Update frequency:** Update `lastmod` dates when making significant changes to pages.

## Implementation

### Already Implemented

The following pages already have SEO components:

1. **App.tsx** - HelmetProvider wrapper + Organization/WebSite structured data
2. **Home.tsx** - SEOHead with homepage meta tags
3. **FlightSearch.tsx** - SEOHead for flight search page
4. **HotelSearch.tsx** - SEOHead for hotel search page

### How to Add to Other Pages

1. Import the SEOHead component:
```tsx
import SEOHead from '../components/SEO/SEOHead';
```

2. Add it inside your component's return statement (before other content):
```tsx
return (
  <div>
    <SEOHead
      title="Your Page Title | TravelHub"
      description="Your page description"
      keywords={['relevant', 'keywords']}
    />
    {/* Rest of your page */}
  </div>
);
```

3. For pages with specific entities (hotels, flights), add StructuredData:
```tsx
import StructuredData from '../components/SEO/StructuredData';

<StructuredData
  type="Hotel"
  data={{ /* hotel data */ }}
/>
```

## Best Practices

1. **Title Length**: Keep titles under 60 characters
2. **Description Length**: Keep descriptions between 150-160 characters
3. **Keywords**: Use 3-7 relevant keywords per page
4. **Images**: Use high-quality images (1200x630px for social sharing)
5. **Canonical URLs**: Always set the canonical URL to prevent duplicate content
6. **Structured Data**: Use structured data on detail pages (hotel details, flight details)

## Testing

Use these tools to verify SEO implementation:

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
4. **Schema.org Validator**: https://validator.schema.org/

## Next Steps

Consider adding SEOHead to these pages:

- Login/Register pages
- Dashboard
- Affiliate Portal
- Support pages
- Hotel/Flight detail pages (with entity-specific structured data)
- Booking pages
