export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
};

export const CABIN_CLASSES = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
];

export const POPULAR_AIRPORTS = [
  { code: 'JFK', name: 'New York JFK', city: 'New York' },
  { code: 'LAX', name: 'Los Angeles', city: 'Los Angeles' },
  { code: 'LHR', name: 'London Heathrow', city: 'London' },
  { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai' },
  { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo' },
];

export const AMENITIES_ICONS = {
  wifi: 'Wifi',
  parking: 'Parking',
  pool: 'Pool',
  gym: 'Gym',
  restaurant: 'Restaurant',
  spa: 'Spa',
  breakfast: 'Breakfast',
  'air-conditioning': 'AC',
};
