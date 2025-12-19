import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useHotelSearch } from '@hooks/useHotelSearch';
import Container from '@components/layout/Container/Container';
import SearchWidget from '@components/features/SearchWidget/SearchWidget';
import HotelCard from '@components/features/HotelCard/HotelCard';
import FilterPanel from '@components/features/FilterPanel/FilterPanel';
import Loading from '@components/common/Loading/Loading';
import Button from '@components/common/Button/Button';
import { HotelFilters } from '@types/api.types';

const HotelSearch: React.FC = () => {
  const location = useLocation();
  const { hotels, loading, error, search, hasSearched } = useHotelSearch();
  const [filteredHotels, setFilteredHotels] = useState(hotels);
  const [activeFilters, setActiveFilters] = useState<HotelFilters>({});
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');

  // Auto-search if params provided
  useEffect(() => {
    const params = location.state?.searchParams;
    if (params) {
      search(params);
    }
  }, [location.state, search]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...hotels];

    // Apply filters
    if (activeFilters.priceRange) {
      filtered = filtered.filter(h => 
        h.price.amount >= activeFilters.priceRange![0] &&
        h.price.amount <= activeFilters.priceRange![1]
      );
    }

    if (activeFilters.stars && activeFilters.stars.length > 0) {
      filtered = filtered.filter(h => 
        activeFilters.stars!.includes(h.stars)
      );
    }

    if (activeFilters.rating) {
      filtered = filtered.filter(h => h.rating >= activeFilters.rating!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price.amount - b.price.amount;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    setFilteredHotels(filtered);
  }, [hotels, activeFilters, sortBy]);

  const handleSearch = (params: any) => {
    search(params);
  };

  const handleApplyFilters = (filters: HotelFilters) => {
    setActiveFilters(filters);
    if (filters.sortBy) {
      setSortBy(filters.sortBy);
    }
  };

  const handleResetFilters = () => {
    setActiveFilters({});
    setSortBy('price');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        {/* Search Widget */}
        <div className="mb-8">
          <SearchWidget
            onSearch={handleSearch}
            type="hotels"
            loading={loading}
          />
        </div>

        {/* Results Section */}
        {hasSearched && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {loading ? 'Searching...' : `${filteredHotels.length} hotels found`}
                </h2>
                {!loading && hotels.length > 0 && (
                  <p className="text-gray-600 mt-1">
                    Showing results for your search
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
                >
                  <option value="price">Price: Low to High</option>
                  <option value="rating">Rating: High to Low</option>
                </select>

                <FilterPanel
                  type="hotels"
                  onApply={handleApplyFilters}
                  onReset={handleResetFilters}
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="py-20">
                <Loading size="lg" text="Finding the perfect hotels for you..." />
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-error-50 border-2 border-error-200 rounded-2xl p-8 text-center">
                <p className="text-error-600 font-semibold text-lg">{error}</p>
                <p className="text-gray-600 mt-2">
                  Please try again with different search parameters
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredHotels.length === 0 && hotels.length > 0 && (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-600 text-lg">
                  No hotels match your filters. Try adjusting your criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="mt-4"
                >
                  Reset Filters
                </Button>
              </div>
            )}

            {!loading && !error && hotels.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-600 text-lg">
                  No hotels found for this destination. Please try a different location or dates.
                </p>
              </div>
            )}

            {/* Results List */}
            {!loading && !error && filteredHotels.length > 0 && (
              <div className="space-y-4">
                {filteredHotels.map((hotel, index) => (
                  <HotelCard key={hotel.id} hotel={hotel} index={index} />
                ))}
              </div>
            )}
          </>
        )}

        {/* No Search Yet */}
        {!hasSearched && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ArrowLeft className="w-12 h-12 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Search for Hotels
              </h3>
              <p className="text-gray-600">
                Enter your destination and dates above to find the best hotel deals
              </p>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default HotelSearch;
