import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, logAdminAction, badRequest, notFound } from '@/lib/api-helpers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const category = await db.category.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!category) return notFound('Категория не найдена')
  return NextResponse.json({ ok: true, category })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { name, emoji, sortOrder, slug } = body

  try {
    const category = await db.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(emoji !== undefined && { emoji: emoji || null }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    })
    await logAdminAction('category.update', 'Category', id, `Изменена категория «${category.name}»`)
    return NextResponse.json({ ok: true, category })
  } catch (e: any) {
    return badRequest(e?.message || 'Ошибка обновления')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const category = await db.category.findUnique({ where: { id } })
  if (!category) return notFound('Категория не найдена')

  await db.category.delete({ where: { id } })
  await logAdminAction('category.delete', 'Category', id, `Удалена категория «${category.name}»`)
  return NextResponse.json({ ok: true })
}
