import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/error',
          '/auth/verify-request',
          '/_next/',
          '/admin/',
        ],
      },
    ],
    sitemap: 'https://optimizecard.com/sitemap.xml',
  }
} 