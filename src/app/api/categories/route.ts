import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, logAdminAction, badRequest } from '@/lib/api-helpers'

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { items: true } } },
  })
  return NextResponse.json({ ok: true, categories })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const { name, emoji, sortOrder } = body
  if (!name) return badRequest('Введите название категории')

  const slug = (body.slug || name)
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  try {
    const category = await db.category.create({
      data: {
        name,
        slug,
        emoji: emoji || null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    })
    await logAdminAction('category.create', 'Category', category.id, `Создана категория «${name}»`)
    return NextResponse.json({ ok: true, category })
  } catch (e: any) {
    return badRequest(e?.message || 'Ошибка создания')
  }
}
