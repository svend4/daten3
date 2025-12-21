import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Clock, ArrowRight, ExternalLink } from 'lucide-react';
import { Flight } from '../../types/api.types';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { formatDuration, formatTime } from '../../utils/formatters';

interface FlightCardProps {
  flight: Flight;
  index?: number;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card hover padding="lg" className="group">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Flight Info */}
          <div className="flex-1">
            {/* Airline */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plane className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{flight.airline.name}</p>
                <p className="text-sm text-gray-500">{flight.flightNumber}</p>
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center gap-4">
              {/* Origin */}
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {flight.route.origin}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatTime(flight.dates.departure)}
                </p>
              </div>

              {/* Duration & Stops */}
              <div className="flex-1 relative">
                <div className="flex items-center justify-center">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className="mx-2">
                    <Plane className="w-5 h-5 text-gray-400 rotate-90" />
                  </div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500">{flight.duration}</p>
                  <p className="text-xs font-semibold text-gray-600">
                    {flight.transfers === 0 ? 'Direct' : `${flight.transfers} stop(s)`}
                  </p>
                </div>
              </div>

              {/* Destination */}
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {flight.route.destination}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {flight.dates.return && formatTime(flight.dates.return)}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2 mt-4">
              {flight.transfers === 0 && (
                <Badge variant="success" size="sm">Direct Flight</Badge>
              )}
            </div>
          </div>

          {/* Right: Price & CTA */}
          <div className="flex flex-col justify-between items-end md:w-48">
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">from</p>
              <p className="text-4xl font-bold text-gray-900">
                ${flight.price.amount}
              </p>
              <p className="text-sm text-gray-500">{flight.price.currency}</p>
            </div>

            <Button
              variant="primary"
              fullWidth
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={() => window.open(flight.link, '_blank')}
            >
              Book Now
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FlightCard;
