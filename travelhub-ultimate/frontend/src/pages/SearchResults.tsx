// src/components/FlightSearch.tsx
import React, { useState } from 'react';
import { useFlightSearch } from '../hooks/useFlightSearch';
import { FlightSearchParams } from '../services/api/travelhub.service';

export const FlightSearch: React.FC = () => {
  const { flights, loading, error, search } = useFlightSearch();
  
  const [formData, setFormData] = useState<FlightSearchParams>({
    origin: 'MOW',
    destination: 'LON',
    departDate: '2025-12-01',
    returnDate: '2025-12-10',
    adults: 2,
    cabinClass: 'economy'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await search(formData);
  };

  const handleChange = (field: keyof FlightSearchParams, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flight-search">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-group">
          <label>From</label>
          <input
            type="text"
            value={formData.origin}
            onChange={(e) => handleChange('origin', e.target.value.toUpperCase())}
            placeholder="MOW"
            maxLength={3}
            required
          />
        </div>

        <div className="form-group">
          <label>To</label>
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => handleChange('destination', e.target.value.toUpperCase())}
            placeholder="LON"
            maxLength={3}
            required
          />
        </div>

        <div className="form-group">
          <label>Departure</label>
          <input
            type="date"
            value={formData.departDate}
            onChange={(e) => handleChange('departDate', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Return</label>
          <input
            type="date"
            value={formData.returnDate}
            onChange={(e) => handleChange('returnDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Passengers</label>
          <input
            type="number"
            value={formData.adults}
            onChange={(e) => handleChange('adults', parseInt(e.target.value))}
            min={1}
            max={9}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Flights'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-spinner">
          Searching for flights...
        </div>
      )}

      {flights.length > 0 && (
        <div className="results">
          <h3>Found {flights.length} flights</h3>
          {flights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
};

// Flight Card Component
interface FlightCardProps {
  flight: Flight;
}

const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  return (
    <div className="flight-card">
      <div className="flight-header">
        <span className="airline">{flight.airline.name}</span>
        <span className="flight-number">{flight.flightNumber}</span>
      </div>

      <div className="flight-route">
        <div className="airport">
          <div className="code">{flight.route.origin}</div>
          <div className="time">
            {new Date(flight.dates.departure).toLocaleTimeString()}
          </div>
        </div>

        <div className="flight-info">
          <div className="duration">{flight.duration}</div>
          <div className="transfers">
            {flight.transfers === 0 ? 'Direct' : `${flight.transfers} stop(s)`}
          </div>
        </div>

        <div className="airport">
          <div className="code">{flight.route.destination}</div>
          <div className="time">
            {flight.dates.return && new Date(flight.dates.return).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="flight-footer">
        <div className="price">
          <span className="amount">${flight.price.amount}</span>
          <span className="currency">{flight.price.currency}</span>
        </div>

        <a
          href={flight.link}
          target="_blank"
          rel="noopener noreferrer"
          className="book-button"
        >
          Book Now →
        </a>
      </div>
    </div>
  );
};
