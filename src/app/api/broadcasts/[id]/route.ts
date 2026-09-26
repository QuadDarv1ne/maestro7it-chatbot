import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, notFound } from '@/lib/api-helpers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const broadcast = await db.broadcast.findUnique({
    where: { id },
    include: { recipients: { include: { user: true }, take: 200 } },
  })
  if (!broadcast) return notFound('Рассылка не найдена')
  return NextResponse.json({ ok: true, broadcast })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  await db.broadcast.delete({ where: { id } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
