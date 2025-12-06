type CacheEntry<T> = {
    value: T;
    expiry: number;
    staleAt: number;
};

class SimpleCache {
    private cache: Map<string, CacheEntry<any>>;
    private defaultTTL: number;
    private staleTTL: number;

    constructor(defaultTTLSeconds: number = 120, staleTTLSeconds: number = 60) {
        this.cache = new Map();
        this.defaultTTL = defaultTTLSeconds * 1000;
        this.staleTTL = staleTTLSeconds * 1000;
    }

    set<T>(key: string, value: T, ttlSeconds?: number): void {
        const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
        const now = Date.now();
        this.cache.set(key, {
            value,
            expiry: now + ttl,
            staleAt: now + this.staleTTL,
        });
    }

    get<T>(key: string): { value: T | null; isStale: boolean } {
        const entry = this.cache.get(key);
        if (!entry) return { value: null, isStale: false };

        const now = Date.now();

        // Hard expired - delete and return null
        if (now > entry.expiry) {
            this.cache.delete(key);
            return { value: null, isStale: false };
        }

        // Stale but usable - return value but mark as stale for background refresh
        const isStale = now > entry.staleAt;
        return { value: entry.value as T, isStale };
    }

    // Simple get without stale check (backward compatible)
    getValue<T>(key: string): T | null {
        const { value } = this.get<T>(key);
        return value;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Cleanup expired entries periodically
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Global cache instance - 2 minute TTL, 1 minute stale threshold
// Note: In serverless environments, this cache is per-lambda instance.
export const globalCache = new SimpleCache(120, 60);
