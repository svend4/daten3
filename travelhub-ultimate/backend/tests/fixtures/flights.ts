/**
 * Flight Test Fixtures
 */

export const mockFlight = {
  id: 'flight-123',
  flightNumber: 'AA100',
  airline: 'American Airlines',
  origin: 'JFK',
  destination: 'LAX',
  departureTime: new Date('2024-12-25T10:00:00Z'),
  arrivalTime: new Date('2024-12-25T13:00:00Z'),
  price: 350.00,
  currency: 'USD',
  availableSeats: 150,
  class: 'economy',
  status: 'scheduled',
  duration: 360, // minutes
  stops: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockFlights = [
  mockFlight,
  {
    id: 'flight-456',
    flightNumber: 'DL200',
    airline: 'Delta Airlines',
    origin: 'LAX',
    destination: 'JFK',
    departureTime: new Date('2024-12-26T14:00:00Z'),
    arrivalTime: new Date('2024-12-26T22:00:00Z'),
    price: 400.00,
    currency: 'USD',
    availableSeats: 120,
    class: 'business',
    status: 'scheduled',
    duration: 360,
    stops: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'flight-789',
    flightNumber: 'UA300',
    airline: 'United Airlines',
    origin: 'ORD',
    destination: 'SFO',
    departureTime: new Date('2024-12-27T08:00:00Z'),
    arrivalTime: new Date('2024-12-27T11:00:00Z'),
    price: 280.00,
    currency: 'USD',
    availableSeats: 180,
    class: 'economy',
    status: 'scheduled',
    duration: 240,
    stops: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const validFlightSearchParams = {
  origin: 'JFK',
  destination: 'LAX',
  departureDate: '2024-12-25',
  passengers: 1,
  class: 'economy',
};
