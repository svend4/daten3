/**
 * Hotel Test Fixtures
 */

export const mockHotel = {
  id: 'hotel-123',
  name: 'Grand Hotel',
  description: 'Luxury hotel in downtown',
  address: '123 Main St',
  city: 'New York',
  country: 'USA',
  latitude: 40.7128,
  longitude: -74.0060,
  rating: 4.5,
  starRating: 5,
  amenities: ['wifi', 'pool', 'gym', 'spa'],
  images: ['image1.jpg', 'image2.jpg'],
  pricePerNight: 250.00,
  currency: 'USD',
  availableRooms: 50,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockHotels = [
  mockHotel,
  {
    id: 'hotel-456',
    name: 'Budget Inn',
    description: 'Affordable hotel near airport',
    address: '456 Airport Rd',
    city: 'Los Angeles',
    country: 'USA',
    latitude: 34.0522,
    longitude: -118.2437,
    rating: 3.5,
    starRating: 3,
    amenities: ['wifi', 'parking'],
    images: ['image3.jpg'],
    pricePerNight: 80.00,
    currency: 'USD',
    availableRooms: 30,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const validHotelSearchParams = {
  city: 'New York',
  checkIn: '2024-12-25',
  checkOut: '2024-12-28',
  guests: 2,
  rooms: 1,
};
