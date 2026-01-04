import React from 'react';

export const MemberSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse" role="status" aria-live="polite" aria-label="Loading members">
            {/* Header Skeleton */}
            <div className="bg-card rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="h-8 w-48 bg-muted rounded mb-2"></div>
                        <div className="h-4 w-32 bg-muted rounded"></div>
                    </div>
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-card rounded-xl shadow-md p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0"></div>
                            <div className="space-y-2 flex-grow">
                                <div className="h-5 w-32 bg-muted rounded"></div>
                                <div className="h-4 w-40 bg-muted rounded"></div>
                            </div>
                        </div>
                        <div className="border-t my-3 border-border"></div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-muted rounded"></div>
                            <div className="h-4 w-3/4 bg-muted rounded"></div>
                        </div>
                        <div className="border-t my-3 border-border"></div>
                        <div className="flex gap-2">
                            <div className="h-9 flex-1 bg-muted rounded"></div>
                            <div className="h-9 flex-1 bg-muted rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>    );
};
