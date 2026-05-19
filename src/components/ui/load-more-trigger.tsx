import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadMoreTriggerProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
  className?: string;
}

/**
 * Component that triggers loading more items when it becomes visible.
 * Uses IntersectionObserver for efficient scroll detection.
 */
export function LoadMoreTrigger({ onLoadMore, isLoading, hasMore, className = '' }: LoadMoreTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && hasMore) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading 200px before the trigger is visible
        threshold: 0,
      }
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, isLoading, hasMore]);

  if (!hasMore && !isLoading) {
    return null;
  }

  return (
    <div ref={triggerRef} className={`flex justify-center py-8 ${className}`}>
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Indlæser flere...</span>
        </div>
      )}
    </div>
  );
}
