import { GridSkeleton } from '@/shared/components/SkeletonLoader'

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
      <GridSkeleton count={6} />
    </div>
  )
}
