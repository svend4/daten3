import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavorites } from '@hooks/useFavorites';
import { useAuth } from '@store/AuthContext';

interface FavoriteButtonProps {
  type: 'flight' | 'hotel';
  itemId: string;
  itemData: any;
  size?: 'sm' | 'md' | 'lg';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  type,
  itemId,
  itemData,
  size = 'md',
}) => {
  const { isAuthenticated } = useAuth();
  const { isFavorited, getFavoriteId, addFavorite, removeFavorite } = useFavorites(type);
  const [isAnimating, setIsAnimating] = useState(false);

  const favorited = isFavorited(itemId);
  const favoriteId = getFavoriteId(itemId);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Open login modal
      return;
    }

    setIsAnimating(true);
    
    if (favorited && favoriteId) {
      await removeFavorite(favoriteId);
    } else {
      await addFavorite(type, itemId, itemData);
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-full bg-white shadow-md
        hover:shadow-lg transition-shadow
        ${favorited ? 'text-error-500' : 'text-gray-400 hover:text-error-500'}
      `}
      whileTap={{ scale: 0.9 }}
      animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
    >
      <Heart
        className={`${iconSizes[size]} ${favorited ? 'fill-current' : ''}`}
      />
    </motion.button>
  );
};

export default FavoriteButton;
