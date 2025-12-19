function generateDiscoverCarsLink(params) {
  const {
    location,
    lat,
    lng,
    pickupDate,      // YYYY-MM-DD
    dropoffDate,     // YYYY-MM-DD
    pickupTime,
    dropoffTime
  } = params;
  
  const AFFILIATE_ID = 'your_affiliate_id';
  
  const baseUrl = 'https://www.discovercars.com/';
  const queryParams = new URLSearchParams({
    a: AFFILIATE_ID,
    lat: lat,
    lng: lng,
    locationName: location,
    from: pickupDate,
    until: dropoffDate,
    pickUpTime: pickupTime || '10:00',
    dropOffTime: dropoffTime || '10:00'
  });
  
  return `${baseUrl}?${queryParams}`;
}

// Использование
const link = generateDiscoverCarsLink({
  location: 'Paris',
  lat: '48.8566',
  lng: '2.3522',
  pickupDate: '2025-12-01',
  dropoffDate: '2025-12-05'
});
