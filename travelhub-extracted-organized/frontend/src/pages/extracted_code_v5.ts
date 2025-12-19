import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useFlightSearch } from '@hooks/useFlightSearch';
import Container from '@components/layout/Container/Container';
import SearchWidget from '@components/features/SearchWidget/SearchWidget';
import FlightCard from '@components/features/FlightCard/FlightCard';
import FilterPanel from '@components/features/FilterPanel/FilterPanel';
import Loading from '@components/common/Loading/Loading';
import Button from '@components/common/Button/Button';
import { FlightFilters } from '@types/api.types';

const FlightSearch: React.FC = () => {
  const location = useLocation();
  const { flights, loading, error, search, hasSearched } = useFlightSearch();
  const [filteredFlights, setFilteredFlights] = useState(flights);
  const [activeFilters, setActiveFilters] = useState<FlightFilters>({});

  // Auto-search if params provided from home page
  useEffect(() => {
    const params = location.state?.searchParams;
    if (params) {
      search(params);
    }
  }, [location.state, search]);

  // Apply filters
  useEffect(() => {
    let filtered = [...flights];

    if (activeFilters.maxPrice) {
      filtered = filtered.filter(f => f.price.amount <= activeFilters.maxPrice!);
    }

    if (activeFilters.maxStops !== undefined) {
      filtered = filtered.filter(f => f.transfers <= activeFilters.maxStops!);
    }

    if (activeFilters.airlines && activeFilters.airlines.length > 0) {
      filtered = filtered.filter(f => 
        activeFilters.airlines!.includes(f.airline.name)
      );
    }

    setFilteredFlights(filtered);
  }, [flights, activeFilters]);

  const handleSearch = (params: any) => {
    search(params);
  };

  const handleApplyFilters = (filters: FlightFilters) => {
    setActiveFilters(filters);
  };

  const handleResetFilters = () => {
    setActiveFilters({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        {/* Search Widget */}
        <div className="mb-8">
          <SearchWidget
            onSearch={handleSearch}
            type="flights"
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
                  {loading ? 'Searching...' : `${filteredFlights.length} flights found`}
                </h2>
                {!loading && flights.length > 0 && (
                  <p className="text-gray-600 mt-1">
                    Showing results for your search
                  </p>
                )}
              </div>

              <FilterPanel
                type="flights"
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
            </div>

            {/* Loading State */}
            {loading && (
              <div className="py-20">
                <Loading size="lg" text="Searching for the best flights..." />
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
            {!loading && !error && filteredFlights.length === 0 && flights.length > 0 && (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-600 text-lg">
                  No flights match your filters. Try adjusting your criteria.
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

            {!loading && !error && flights.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-600 text-lg">
                  No flights found for this route. Please try different dates or destinations.
                </p>
              </div>
            )}

            {/* Results List */}
            {!loading && !error && filteredFlights.length > 0 && (
              <div className="space-y-4">
                {filteredFlights.map((flight, index) => (
                  <FlightCard key={flight.id} flight={flight} index={index} />
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
                Search for Flights
              </h3>
              <p className="text-gray-600">
                Enter your travel details above to find the best flight options
              </p>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default FlightSearch;
