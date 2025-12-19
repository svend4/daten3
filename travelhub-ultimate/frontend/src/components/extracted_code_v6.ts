import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, ExternalLink, Wifi, Coffee, Car } from 'lucide-react';
import { Hotel } from '@types/api.types';
import Card from '@components/common/Card/Card';
import Badge from '@components/common/Badge/Badge';
import Button from '@components/common/Button/Button';

interface HotelCardProps {
  hotel: Hotel;
  index?: number;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, index = 0 }) => {
  // Map amenities to icons
  const amenityIcons: { [key: string]: any } = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card hover padding="none" className="overflow-hidden group">
        <div className="md:flex">
          {/* Image */}
          <div className="md:w-1/3 relative">
            <img
              src={hotel.image}
              alt={hotel.name}
              className="w-full h-64 md:h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Featured Badge */}
            {hotel.rating >= 9 && (
              <div className="absolute top-4 right-4">
                <Badge variant="warning">Featured</Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {hotel.name}
                </h3>
                
                {/* Stars */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(hotel.stars)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-warning-500 text-warning-500"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {hotel.stars} Star Hotel
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{hotel.address}</span>
                </div>

                {/* Rating */}
                {hotel.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary-600 text-white px-3 py-1 rounded-lg font-bold">
                      {hotel.rating}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {hotel.rating >= 9 ? 'Excellent' :
                         hotel.rating >= 8 ? 'Very Good' :
                         hotel.rating >= 7 ? 'Good' : 'Fair'}
                      </p>
                      {hotel.reviewCount && (
                        <p className="text-xs text-gray-500">
                          {hotel.reviewCount} reviews
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {hotel.amenities.slice(0, 4).map((amenity, i) => {
                    const Icon = amenityIcons[amenity.toLowerCase()];
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600"
                      >
                        {Icon && <Icon className="w-3 h-3" />}
                        <span>{amenity}</span>
                      </div>
                    );
                  })}
                  {hotel.amenities.length > 4 && (
                    <div className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                      +{hotel.amenities.length - 4} more
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right ml-4">
                <p className="text-sm text-gray-500 mb-1">from</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${hotel.price.amount}
                </p>
                <p className="text-xs text-gray-500">per night</p>
                <p className="text-xs text-gray-400 mt-1">
                  ${hotel.price.total} total
                </p>
              </div>
            </div>

            {/* CTA */}
            <Button
              variant="primary"
              fullWidth
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={() => window.open(hotel.url, '_blank')}
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default HotelCard;
