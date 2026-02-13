'use client';

import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function EmptyState({ 
  title = "Nothing here yet", 
  description = "Try adjusting your filters or check back later",
  icon: Icon = MagnifyingGlassIcon,
  action = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm mb-6">
        {description}
      </p>
      
      {action && (
        <div className="flex gap-3">
          {action}
        </div>
      )}
    </div>
  );
}

export function NoListingsState() {
  return (
    <EmptyState
      title="No listings found"
      description="Start selling by creating your first listing!"
      action={
        <Link 
          href="/sell" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          Create Listing
        </Link>
      }
    />
  );
}

export function NoFavoritesState() {
  return (
    <EmptyState
      title="No favorites yet"
      description="Browse listings and click the heart icon to save your favorites!"
      action={
        <Link 
          href="/" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          Browse Listings
        </Link>
      }
    />
  );
}

export function NoSearchResultsState({ query }) {
  return (
    <EmptyState
      title="No results found"
      description={`We couldn't find any listings matching "${query}". Try a different search term.`}
      action={
        <Link 
          href="/" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          Back to Home
        </Link>
      }
    />
  );
}

export function NoReviewsState() {
  return (
    <EmptyState
      title="No reviews yet"
      description="This seller hasn't received any reviews. Be the first to leave one!"
    />
  );
}
