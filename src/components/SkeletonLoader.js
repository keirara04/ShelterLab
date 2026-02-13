'use client';

export function ListingCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700"></div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        
        {/* Price */}
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
        
        {/* Location */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        
        {/* Footer with avatar */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        
        <div className="flex-1 space-y-2">
          {/* Name */}
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          
          {/* Rating */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          
          {/* Description */}
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
        
        <div className="flex-1 space-y-2">
          {/* Reviewer name */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          
          {/* Rating */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          
          {/* Review text */}
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
