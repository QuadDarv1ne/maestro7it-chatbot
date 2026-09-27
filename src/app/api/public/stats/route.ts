import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Публичная статистика для страницы логина и публичной справки.
 * НЕ требует авторизации — только безопасные, не-sensitive данные.
 *
 * Кэширование: in-memory на 30 секунд (уменьшает нагрузку на БД).
 *
 * НЕ возвращает:
 *  - userCount (количество пользователей бота) — это sensitive
 *  - totalMessages — утечка бизнес-метрик
 *
 * Возвращает:
 *  - faqCount: количество опубликованных курсов (безопасно)
 *  - categoryCount: количество категорий курсов (безопасно)
 *  - messageCount24h: количество обращений за 24ч (показывает что бот живой)
 *  - serverTime: для индикации онлайн-статуса
 */

interface CachedStats {
  data: { ok: true; stats: any }
  at: number
}

let cached: CachedStats | null = null
const CACHE_TTL_MS = 30_000 // 30 секунд

export async function GET() {
  // Возвращаем кэш если свежий
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  }

  try {
    const [faqCount, categoryCount, messageCount24h] = await Promise.all([
      db.faqItem.count({ where: { isPublished: true } }),
      db.category.count(),
      db.messageLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }).catch(() => 0),
    ])

    const data = {
      ok: true as const,
      stats: {
        faqCount,
        categoryCount,
        messageCount24h,
        serverTime: new Date().toISOString(),
      },
    }

    // Сохраняем в кэш
    cached = { data, at: Date.now() }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'unavailable' },
      { status: 503 },
    )
  }
}
