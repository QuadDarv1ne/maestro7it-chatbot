import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

/**
 * sitemap.xml — генерируется автоматически.
 * Включает главную страницу + страницы категорий.
 *
 * Base URL определяется:
 *  1. Из env NEXT_PUBLIC_BASE_URL (если задан)
 *  2. Из request headers (x-forwarded-host / host) — для prod
 *  3. Fallback на хардкод
 */
async function getBaseUrl(): Promise<string> {
  // 1. Env variable
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  }

  // 2. Из request headers
  try {
    const headerList = await headers()
    const host = headerList.get('x-forwarded-host') || headerList.get('host')
    const proto = headerList.get('x-forwarded-proto') || 'https'
    if (host) {
      return `${proto}://${host}`
    }
  } catch {
    // headers() не доступен в этом контексте
  }

  // 3. Fallback
  return 'https://maestro7it-chatbot.space-z.ai'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Страницы категорий курсов
  try {
    const categories = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/#courses`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
    return [...staticPages, ...categoryPages]
  } catch {
    return staticPages
  }
}
