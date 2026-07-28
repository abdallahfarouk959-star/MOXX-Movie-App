import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-white/5 rounded-lg", className)} />
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="flex-none w-40 sm:w-48 lg:w-56 aspect-[2/3] rounded-lg overflow-hidden bg-white/5 animate-pulse" />
  );
}

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
