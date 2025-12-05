type CacheEntry<T> = {
    value: T;
    expiry: number;
};

class SimpleCache {
    private cache: Map<string, CacheEntry<any>>;
    private defaultTTL: number;

    constructor(defaultTTLSeconds: number = 60) {
        this.cache = new Map();
        this.defaultTTL = defaultTTLSeconds * 1000;
    }

    set<T>(key: string, value: T, ttlSeconds?: number): void {
        const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.value as T;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

// Global cache instance for server-side usage
// Note: In serverless environments, this cache is per-lambda instance.
export const globalCache = new SimpleCache(60); // Default 1 minute TTL
