/**
 * Генерация deeplink для поиска авто
 */
function generateRentalcarsLink(params) {
  const {
    pickupLocation,    // ID локации
    dropoffLocation,   // ID локации (может быть тот же)
    pickupDate,        // DD/MM/YYYY
    pickupTime,        // HH:MM
    dropoffDate,       // DD/MM/YYYY
    dropoffTime,       // HH:MM
    driverAge          // Возраст
  } = params;
  
  const AFFILIATE_ID = 'your_affiliate_id';
  
  const baseUrl = 'https://www.rentalcars.com/Utilities/Affiliate/SearchRedirect.do';
  const queryParams = new URLSearchParams({
    affiliateCode: AFFILIATE_ID,
    language: 'en',
    currency: 'USD',
    pickupLocationID: pickupLocation,
    dropoffLocationID: dropoffLocation || pickupLocation,
    pickupDate: pickupDate,
    pickupTime: pickupTime || '10:00',
    dropoffDate: dropoffDate,
    dropoffTime: dropoffTime || '10:00',
    driverAge: driverAge || '30'
  });
  
  return `${baseUrl}?${queryParams}`;
}

// Использование
const carLink = generateRentalcarsLink({
  pickupLocation: '12345',  // Paris CDG Airport
  pickupDate: '01/12/2025',
  dropoffDate: '05/12/2025',
  driverAge: 30
});

console.log('Car rental search:', carLink);
