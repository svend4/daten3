export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'affiliate';
  createdAt: string;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  price: number;
  currency: string;
  images: string[];
  amenities: string[];
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  class: 'economy' | 'business' | 'first';
}

export interface Booking {
  id: string;
  userId: string;
  type: 'hotel' | 'flight';
  itemId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'hotel' | 'flight';
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Affiliate {
  id: string;
  userId: string;
  code: string;
  totalEarnings: number;
  pendingEarnings: number;
  status: 'active' | 'inactive';
}
