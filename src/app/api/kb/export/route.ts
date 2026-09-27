import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/api-helpers'

/**
 * GET /api/kb/export
 * Экспорт всей базы знаний (категории + курсы + теги) в JSON.
 * Полезно для backup и переноса между окружениями.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const [categories, faqs, tags] = await Promise.all([
      db.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { items: true } } },
      }),
      db.faqItem.findMany({
        orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }],
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      }),
      db.tag.findMany({
        orderBy: { name: 'asc' },
      }),
    ])

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'Maestro7IT Bot',
      categories: categories.map((c) => ({
        name: c.name,
        slug: c.slug,
        emoji: c.emoji,
        sortOrder: c.sortOrder,
      })),
      tags: tags.map((t) => ({ name: t.name })),
      faqs: faqs.map((f) => ({
        question: f.question,
        answer: f.answer,
        keywords: f.keywords,
        isPinned: f.isPinned,
        isPublished: f.isPublished,
        sortOrder: f.sortOrder,
        category: f.category?.slug || null,
        tags: f.tags.map((t) => t.tag.name),
      })),
    }

    const json = JSON.stringify(exportData, null, 2)
    const filename = `maestro7it-kb-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Export failed' },
      { status: 500 },
    )
  }
}
