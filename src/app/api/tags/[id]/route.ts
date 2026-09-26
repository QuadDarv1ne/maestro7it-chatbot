import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, notFound } from '@/lib/api-helpers'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const tag = await db.tag.findUnique({ where: { id } })
  if (!tag) return notFound('Тег не найден')

  await db.tag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
