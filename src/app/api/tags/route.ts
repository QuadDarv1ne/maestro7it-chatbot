import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, badRequest } from '@/lib/api-helpers'

export async function GET() {
  const tags = await db.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { items: true } } },
  })
  return NextResponse.json({ ok: true, tags })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { name } = await req.json().catch(() => ({}))
  if (!name) return badRequest('Введите название тега')

  try {
    const tag = await db.tag.create({ data: { name } })
    return NextResponse.json({ ok: true, tag })
  } catch (e: any) {
    return badRequest(e?.message || 'Ошибка создания тега')
  }
}
