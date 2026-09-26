import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/api-helpers'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const items = await db.adminActionLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ ok: true, items })
}
