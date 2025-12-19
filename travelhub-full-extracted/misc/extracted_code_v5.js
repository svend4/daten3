require('dotenv').config();

module.exports = {
  // Travelpayouts configuration
  travelpayouts: {
    token: process.env.TRAVELPAYOUTS_TOKEN,
    marker: process.env.TRAVELPAYOUTS_MARKER,
    baseUrl: 'https://api.travelpayouts.com',
    hotellookUrl: 'https://engine.hotellook.com/api/v2',
    autocompleteUrl: 'https://autocomplete.travelpayouts.com',
    timeout: 30000,
    retries: 3
  },

  // Aviasales (part of Travelpayouts)
  aviasales: {
    token: process.env.TRAVELPAYOUTS_TOKEN,
    marker: process.env.TRAVELPAYOUTS_MARKER,
    baseUrl: 'https://api.travelpayouts.com/aviasales/v3',
    timeout: 20000,
    retries: 2
  },

  // Booking.com
  booking: {
    affiliateId: process.env.BOOKING_AFFILIATE_ID,
    apiKey: process.env.BOOKING_API_KEY,
    secret: process.env.BOOKING_SECRET,
    baseUrl: 'https://distribution-xml.booking.com/2.7/json',
    timeout: 30000,
    retries: 3
  },

  // Skyscanner
  skyscanner: {
    apiKey: process.env.SKYSCANNER_API_KEY,
    baseUrl: 'https://partners.api.skyscanner.net/apiservices',
    timeout: 45000,
    retries: 2
  },

  // Amadeus
  amadeus: {
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
    hostname: process.env.NODE_ENV === 'production' ? 'production' : 'test',
    timeout: 30000
  },

  // General settings
  general: {
    defaultCurrency: 'USD',
    defaultLanguage: 'en',
    defaultTimeout: 30000
  }
};
