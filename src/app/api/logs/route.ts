import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, badRequest } from '@/lib/api-helpers'

const MAX_LIMIT = 500
const DEFAULT_LIMIT = 50

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || DEFAULT_LIMIT), 1), MAX_LIMIT)
  const offset = Math.max(Number(searchParams.get('offset') || 0), 0)
  const source = searchParams.get('source') || undefined
  const direction = searchParams.get('direction') || undefined
  const offTopic = searchParams.get('offTopic')
  const search = searchParams.get('q') || undefined

  // Валидация source
  const VALID_SOURCES = new Set([
    'faq', 'llm', 'command', 'callback', 'broadcast',
    'offtopic', 'unknown', 'user',
  ])
  if (source && !VALID_SOURCES.has(source)) {
    return badRequest(`Invalid source: ${source}`)
  }

  const where: any = {}
  if (source) where.source = source
  if (direction) {
    if (direction !== 'in' && direction !== 'out') {
      return badRequest(`Invalid direction: ${direction}`)
    }
    where.direction = direction
  }
  if (offTopic === '1') where.isOffTopic = true
  if (offTopic === '0') where.isOffTopic = false
  if (search) where.text = { contains: search }

  const [items, total] = await Promise.all([
    db.messageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { user: true },
    }),
    db.messageLog.count({ where }),
  ])

  return NextResponse.json({
    ok: true,
    items,
    total,
    pagination: {
      limit,
      offset,
      hasMore: offset + items.length < total,
      nextOffset: offset + items.length < total ? offset + limit : null,
    },
  })
}
