import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Plane } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface SearchWidgetProps {
  onSearch: (params: any) => void;
  type?: 'flights' | 'hotels' | 'cars';
  loading?: boolean;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({
  onSearch,
  type = 'flights',
  loading = false,
}) => {
  const [searchType, setSearchType] = useState(type);
  
  // Flight search state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState(1);

  // Hotel search state
  const [hotelDestination, setHotelDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  const handleFlightSearch = () => {
    if (!origin || !destination || !departDate) {
      alert('Please fill in all required fields');
      return;
    }

    onSearch({
      type: 'flights',
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departDate: departDate.toISOString().split('T')[0],
      returnDate: returnDate?.toISOString().split('T')[0],
      adults: passengers,
    });
  };

  const handleHotelSearch = () => {
    if (!hotelDestination || !checkIn || !checkOut) {
      alert('Please fill in all required fields');
      return;
    }

    onSearch({
      type: 'hotels',
      destination: hotelDestination,
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      adults: guests,
      rooms: rooms,
    });
  };

  return (
    <motion.div
      className="bg-white rounded-3xl shadow-strong p-6 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['flights', 'hotels', 'cars'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSearchType(tab)}
            className={`
              px-6 py-3 rounded-xl font-semibold transition-all
              ${searchType === tab
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {tab === 'flights' && <Plane className="inline w-5 h-5 mr-2" />}
            {tab === 'hotels' && <MapPin className="inline w-5 h-5 mr-2" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Flight Search Form */}
      {searchType === 'flights' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="From"
              placeholder="MOW (Moscow)"
              value={origin}
              onChange={setOrigin}
              icon={<MapPin className="w-5 h-5" />}
              required
            />
            <Input
              label="To"
              placeholder="LON (London)"
              value={destination}
              onChange={setDestination}
              icon={<MapPin className="w-5 h-5" />}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departure <span className="text-error-500">*</span>
              </label>
              <DatePicker
                selected={departDate}
                onChange={(date) => setDepartDate(date)}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Return (Optional)
              </label>
              <DatePicker
                selected={returnDate}
                onChange={(date) => setReturnDate(date)}
                minDate={departDate || new Date()}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Passengers
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                >
                  -
                </button>
                <span className="flex-1 text-center font-semibold">
                  {passengers}
                </span>
                <button
                  onClick={() => setPassengers(Math.min(9, passengers + 1))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleFlightSearch}
            loading={loading}
            icon={<Search className="w-5 h-5" />}
          >
            Search Flights
          </Button>
        </div>
      )}

      {/* Hotel Search Form */}
      {searchType === 'hotels' && (
        <div className="space-y-4">
          <Input
            label="Destination"
            placeholder="Paris, France"
            value={hotelDestination}
            onChange={setHotelDestination}
            icon={<MapPin className="w-5 h-5" />}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Check-in <span className="text-error-500">*</span>
              </label>
              <DatePicker
                selected={checkIn}
                onChange={(date) => setCheckIn(date)}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Check-out <span className="text-error-500">*</span>
              </label>
              <DatePicker
                selected={checkOut}
                onChange={(date) => setCheckOut(date)}
                minDate={checkIn || new Date()}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Guests
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                >
                  -
                </button>
                <span className="flex-1 text-center font-semibold">
                  {guests}
                </span>
                <button
                  onClick={() => setGuests(Math.min(30, guests + 1))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rooms
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRooms(Math.max(1, rooms - 1))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                >
                  -
                </button>
                <span className="flex-1 text-center font-semibold">
                  {rooms}
                </span>
                <button
                  onClick={() => setRooms(Math.min(10, rooms + 1))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleHotelSearch}
            loading={loading}
            icon={<Search className="w-5 h-5" />}
          >
            Search Hotels
          </Button>
        </div>
      )}

      {/* Car Search Form */}
      {searchType === 'cars' && (
        <div className="space-y-4">
          <p className="text-center text-gray-500">
            Car rental search coming soon...
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default SearchWidget;
