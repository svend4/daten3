import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'TravelHub - Compare Flights, Hotels & Car Rentals',
  description = 'Find the best travel deals from hundreds of providers. Compare flights, hotels, and car rentals all in one place.',
  keywords = 'flights, hotels, travel, booking, cheap flights, hotel deals, car rental',
  image = '/og-image.jpg',
  type = 'website',
}) => {
  const location = useLocation();
  const siteUrl = 'https://travelhub.com';
  const url = `${siteUrl}${location.pathname}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${image}`} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${siteUrl}${image}`} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;
