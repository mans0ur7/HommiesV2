import { Skeleton } from "./skeleton";

// Property card skeleton for loading states
export function PropertyCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
      <Skeleton className="h-40 md:h-48 w-full" />
      <div className="p-3 md:p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Roomie card skeleton
export function RoomieCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

// Conversation skeleton for inbox
export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-border/30">
      <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

// Message skeleton for chat
export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        <Skeleton className={`h-10 w-48 rounded-2xl ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`} />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// Group card skeleton for Focus page
export function GroupCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex -space-x-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-full border-2 border-background" />
        ))}
      </div>
    </div>
  );
}

// Notification skeleton
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 border-b border-border/30">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Profile section skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

// Grid of property skeletons
export function PropertyGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {[...Array(count)].map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

// List of conversation skeletons
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {[...Array(count)].map((_, i) => (
        <ConversationSkeleton key={i} />
      ))}
    </div>
  );
}
