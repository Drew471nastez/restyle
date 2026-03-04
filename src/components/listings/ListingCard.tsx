'use client';

import { Heart } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import type { Listing } from '@/types/database';

interface ListingCardProps {
  listing: Listing & { profiles?: { username: string; avatar_url: string | null } };
  showFavorite?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function ListingCard({ listing, showFavorite = true, isFavorited = false, onToggleFavorite }: ListingCardProps) {
  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
      <Link href={`/item/${listing.id}`}>
        <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
          {listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            {listing.is_featured && <Badge>Featured</Badge>}
            {listing.is_boosted && <Badge variant="secondary">Boosted</Badge>}
          </div>
        </div>
      </Link>

      {showFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite?.();
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
      )}

      <Link href={`/item/${listing.id}`}>
        <div className="p-3">
          <p className="font-semibold text-gray-900">
            {formatPrice(listing.price, listing.currency)}
          </p>
          <p className="text-sm text-gray-600 truncate">{listing.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">{listing.size}</span>
            {listing.brand && (
              <>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">{listing.brand}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
