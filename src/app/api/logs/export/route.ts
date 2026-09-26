import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const source = searchParams.get('source')
  const where: any = {}
  if (source) where.source = source

  const items = await db.messageLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000,
    include: { user: true },
  })

  const rows = [
    ['id', 'createdAt', 'direction', 'source', 'text', 'isOffTopic', 'rating', 'maxUserId', 'username'],
    ...items.map((it) => [
      it.id,
      it.createdAt.toISOString(),
      it.direction,
      it.source,
      it.text.replace(/"/g, '""').replace(/\n/g, ' '),
      it.isOffTopic ? '1' : '0',
      it.rating ?? '',
      it.user?.maxUserId ?? '',
      it.user?.username ?? '',
    ]),
  ]

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="maestro7it-logs-${Date.now()}.csv"`,
    },
  })
}
