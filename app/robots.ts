import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://billkhata.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/', '/bills/', '/settings/'], // Disallow private routes
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
