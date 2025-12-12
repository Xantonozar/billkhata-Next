import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    reactCompiler: true,
    // Image optimization
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: '*.cloudinary.com' },
        ],
        minimumCacheTTL: 60 * 60 * 24, // 24 hours
    },
    // Compression
    compress: true,
    // Reduce bundle size by removing console in production
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // Experimental features for better performance
    experimental: {
        optimizePackageImports: ['@/components/Icons', 'lodash', 'date-fns'],
    },
    // Turbopack config (required for Next.js 16 to silence webpack migration warning)
    turbopack: {},
};

export default withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: false, // Enable PWA in development for testing
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts',
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                }
            }
        },
        {
            urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-font-assets',
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
                }
            }
        },
        {
            urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-image-assets',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 24 * 60 * 60 // 1 day
                }
            }
        },
        {
            urlPattern: /\.(?:js)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-js-assets',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60 // 1 day
                }
            }
        },
        {
            urlPattern: /\.(?:css|less)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-style-assets',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60 // 1 day
                }
            }
        },
        {
            urlPattern: /\/api\/.*$/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'apis',
                expiration: {
                    maxEntries: 16,
                    maxAgeSeconds: 5 * 60 // 5 minutes
                },
                networkTimeoutSeconds: 10
            }
        },
        {
            urlPattern: /.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'others',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60 // 1 day
                },
                networkTimeoutSeconds: 10
            }
        }
    ]
})(nextConfig);
