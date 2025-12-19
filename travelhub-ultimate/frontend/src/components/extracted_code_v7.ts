import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, DollarSign, Star } from 'lucide-react';
import Button from '@components/common/Button/Button';
import { FlightFilters, HotelFilters } from '@types/api.types';

interface FilterPanelProps {
  type: 'flights' | 'hotels';
  onApply: (filters: any) => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  type,
  onApply,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Flight filters
  const [maxPrice, setMaxPrice] = useState(1000);
  const [maxStops, setMaxStops] = useState(2);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);

  // Hotel filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [minRating, setMinRating] = useState(0);

  const airlines = ['Aeroflot', 'British Airways', 'Lufthansa', 'Air France'];

  const handleApply = () => {
    if (type === 'flights') {
      onApply({
        maxPrice,
        maxStops,
        airlines: selectedAirlines,
      } as FlightFilters);
    } else {
      onApply({
        priceRange,
        stars: selectedStars,
        rating: minRating,
      } as HotelFilters);
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    setMaxPrice(1000);
    setMaxStops(2);
    setSelectedAirlines([]);
    setPriceRange([0, 500]);
    setSelectedStars([]);
    setMinRating(0);
    onReset();
  };

  return (
    <>
      {/* Filter Button */}
      <Button
        variant="outline"
        icon={<SlidersHorizontal className="w-5 h-5" />}
        onClick={() => setIsOpen(true)}
      >
        Filters
      </Button>

      {/* Filter Panel Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-strong z-50 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Flight Filters */}
                {type === 'flights' && (
                  <div className="space-y-6">
                    {/* Price */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <DollarSign className="inline w-4 h-4 mr-1" />
                        Max Price: ${maxPrice}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>$0</span>
                        <span>$2000</span>
                      </div>
                    </div>

                    {/* Stops */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Max Stops
                      </label>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((stops) => (
                          <button
                            key={stops}
                            onClick={() => setMaxStops(stops)}
                            className={`
                              flex-1 py-2 px-4 rounded-lg font-medium transition-all
                              ${maxStops === stops
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }
                            `}
                          >
                            {stops === 0 ? 'Direct' : `${stops}+`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Airlines */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Airlines
                      </label>
                      <div className="space-y-2">
                        {airlines.map((airline) => (
                          <label key={airline} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedAirlines.includes(airline)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAirlines([...selectedAirlines, airline]);
                                } else {
                                  setSelectedAirlines(selectedAirlines.filter(a => a !== airline));
                                }
                              }}
                              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{airline}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hotel Filters */}
                {type === 'hotels' && (
                  <div className="space-y-6">
                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <DollarSign className="inline w-4 h-4 mr-1" />
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                          className="w-full"
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Stars */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <Star className="inline w-4 h-4 mr-1" />
                        Star Rating
                      </label>
                      <div className="flex gap-2">
                        {[3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            onClick={() => {
                              if (selectedStars.includes(stars)) {
                                setSelectedStars(selectedStars.filter(s => s !== stars));
                              } else {
                                setSelectedStars([...selectedStars, stars]);
                              }
                            }}
                            className={`
                              flex-1 py-2 px-4 rounded-lg font-medium transition-all
                              ${selectedStars.includes(stars)
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }
                            `}
                          >
                            {stars}★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Min Guest Rating: {minRating}/10
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={minRating}
                        onChange={(e) => setMinRating(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleApply}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FilterPanel;
