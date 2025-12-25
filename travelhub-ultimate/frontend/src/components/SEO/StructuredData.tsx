import React from 'react';
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Product' | 'Hotel' | 'Flight' | 'LocalBusiness' | 'BreadcrumbList';
  data: any;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const baseContext = 'https://schema.org';

  const schemas: Record<string, any> = {
    Organization: {
      '@context': baseContext,
      '@type': 'Organization',
      name: 'TravelHub',
      url: 'https://daten3.onrender.com',
      logo: 'https://daten3.onrender.com/logo.png',
      sameAs: [
        'https://www.facebook.com/travelhub',
        'https://www.twitter.com/travelhub',
        'https://www.instagram.com/travelhub',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-TRAVEL',
        contactType: 'Customer Service',
        areaServed: 'Worldwide',
        availableLanguage: ['English', 'Russian'],
      },
      ...data,
    },

    WebSite: {
      '@context': baseContext,
      '@type': 'WebSite',
      name: 'TravelHub',
      url: 'https://daten3.onrender.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://daten3.onrender.com/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
      ...data,
    },

    Hotel: {
      '@context': baseContext,
      '@type': 'Hotel',
      name: data.name,
      image: data.image,
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.address?.street,
        addressLocality: data.address?.city,
        addressRegion: data.address?.region,
        postalCode: data.address?.postalCode,
        addressCountry: data.address?.country,
      },
      geo: data.location && {
        '@type': 'GeoCoordinates',
        latitude: data.location.lat,
        longitude: data.location.lng,
      },
      priceRange: data.priceRange,
      telephone: data.phone,
      starRating: data.rating && {
        '@type': 'Rating',
        ratingValue: data.rating,
      },
      ...data.additionalData,
    },

    Flight: {
      '@context': baseContext,
      '@type': 'Flight',
      flightNumber: data.flightNumber,
      carrier: {
        '@type': 'Airline',
        name: data.airline,
        iataCode: data.airlineCode,
      },
      departureAirport: data.departure ? {
        '@type': 'Airport',
        name: data.departure.airport,
        iataCode: data.departure.code,
      } : undefined,
      arrivalAirport: data.arrival ? {
        '@type': 'Airport',
        name: data.arrival.airport,
        iataCode: data.arrival.code,
      } : undefined,
      departureTime: data.departure?.time,
      arrivalTime: data.arrival?.time,
      ...data.additionalData,
    },

    Product: {
      '@context': baseContext,
      '@type': 'Product',
      name: data.name,
      image: data.image,
      description: data.description,
      offers: {
        '@type': 'Offer',
        url: data.url,
        priceCurrency: data.currency || 'USD',
        price: data.price,
        availability: data.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        validFrom: data.validFrom,
      },
      aggregateRating: data.rating && {
        '@type': 'AggregateRating',
        ratingValue: data.rating.value,
        reviewCount: data.rating.count,
      },
      ...data.additionalData,
    },

    BreadcrumbList: {
      '@context': baseContext,
      '@type': 'BreadcrumbList',
      itemListElement: data.items?.map((item: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })) || [],
    },
  };

  const structuredData = schemas[type] || data;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default StructuredData;
