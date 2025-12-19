import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plane, Hotel, Trash2 } from 'lucide-react';
import { useFavorites } from '@hooks/useFavorites';
import Container from '@components/layout/Container/Container';
import FlightCard from '@components/features/FlightCard/FlightCard';
import HotelCard from '@components/features/HotelCard/HotelCard';
import Loading from '@components/common/Loading/Loading';
import Button from '@components/common/Button/Button';

const Favorites: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'flights' | 'hotels'>('all');
  const { favorites, loading, removeFavorite } = useFavorites(
    activeTab === 'all' ? undefined : activeTab === 'flights' ? 'flight' : 'hotel'
  );

  const tabs = [
    { id: 'all', label: 'All', icon: Heart },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <Loading size="lg" text="Loading favorites..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Favorites</h1>
            <p className="text-xl text-gray-600">
              {favorites.length} saved {favorites.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Empty State */}
          {favorites.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No favorites yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start adding your favorite flights and hotels to see them here
              </p>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/'}
              >
                Start Searching
              </Button>
            </div>
          )}

          {/* Favorites List */}
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="relative group">
                {favorite.type === 'flight' && (
                  <FlightCard flight={favorite.itemData} />
                )}
                {favorite.type === 'hotel' && (
                  <HotelCard hotel={favorite.itemData} />
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeFavorite(favorite.id)}
                  className="
                    absolute top-4 right-4 z-10
                    p-3 bg-white rounded-full shadow-md
                    opacity-0 group-hover:opacity-100
                    transition-opacity
                    hover:bg-error-50 hover:text-error-600
                  "
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default Favorites;
