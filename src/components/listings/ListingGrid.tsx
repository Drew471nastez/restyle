import type { Listing } from '@/types/database';
import { ListingCard } from './ListingCard';

interface ListingGridProps {
  listings: (Listing & { profiles?: { username: string; avatar_url: string | null } })[];
  emptyMessage?: string;
}

export function ListingGrid({ listings, emptyMessage = 'No listings found' }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
