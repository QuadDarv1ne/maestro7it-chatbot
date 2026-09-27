import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

/**
 * robots.txt — правила для поисковых роботов.
 */
async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  }
  try {
    const headerList = await headers()
    const host = headerList.get('x-forwarded-host') || headerList.get('host')
    const proto = headerList.get('x-forwarded-proto') || 'https'
    if (host) return `${proto}://${host}`
  } catch {}
  return 'https://maestro7it-chatbot.space-z.ai'
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getBaseUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ''),
  }
}
