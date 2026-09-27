import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, badRequest } from '@/lib/api-helpers'
import { logAdminAction } from '@/lib/api-helpers'

/**
 * POST /api/kb/import
 * Импорт базы знаний из JSON.
 * Body: { data: {...}, mode: 'replace' | 'merge' }
 *
 *  - replace: полная замена (удаляем все существующие категории/FAQ/теги)
 *  - merge: добавляем только новые, пропускаем дубликаты
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const data = body.data
  const mode = body.mode === 'merge' ? 'merge' : 'replace'

  if (!data || !data.categories || !data.faqs) {
    return badRequest('Неверный формат файла. Ожидается { categories, faqs, tags }')
  }

  try {
    if (mode === 'replace') {
      // Полная замена
      await db.faqFeedback.deleteMany()
      await db.faqTag.deleteMany()
      await db.faqItem.deleteMany()
      await db.category.deleteMany()
      await db.tag.deleteMany()
    }

    // Импорт категорий
    const categoryMap = new Map<string, string>() // slug → id
    for (const c of data.categories) {
      const existing = await db.category.findUnique({ where: { slug: c.slug } })
      if (existing) {
        categoryMap.set(c.slug, existing.id)
        if (mode === 'replace') {
          await db.category.update({
            where: { id: existing.id },
            data: { name: c.name, emoji: c.emoji, sortOrder: c.sortOrder },
          })
        }
      } else {
        const created = await db.category.create({
          data: {
            name: c.name,
            slug: c.slug,
            emoji: c.emoji || null,
            sortOrder: c.sortOrder || 0,
          },
        })
        categoryMap.set(c.slug, created.id)
      }
    }

    // Импорт тегов
    const tagMap = new Map<string, string>() // name → id
    if (data.tags) {
      for (const t of data.tags) {
        const existing = await db.tag.findUnique({ where: { name: t.name } })
        if (existing) {
          tagMap.set(t.name, existing.id)
        } else {
          const created = await db.tag.create({ data: { name: t.name } })
          tagMap.set(t.name, created.id)
        }
      }
    }

    // Импорт FAQ
    let imported = 0
    let skipped = 0
    for (const f of data.faqs) {
      // В merge-режиме пропускаем дубликаты по вопросу
      if (mode === 'merge') {
        const existing = await db.faqItem.findFirst({ where: { question: f.question } })
        if (existing) {
          skipped++
          continue
        }
      }

      const categoryId = f.category ? categoryMap.get(f.category) : null
      const tagIds = (f.tags || []).map((name: string) => tagMap.get(name)).filter(Boolean)

      await db.faqItem.create({
        data: {
          question: f.question,
          answer: f.answer,
          keywords: f.keywords || null,
          isPinned: f.isPinned || false,
          isPublished: f.isPublished !== false,
          sortOrder: f.sortOrder || 0,
          categoryId: categoryId || null,
          tags: tagIds.length
            ? { create: tagIds.map((tagId: string) => ({ tagId })) }
            : undefined,
        },
      })
      imported++
    }

    await logAdminAction(
      'kb.import',
      'FaqItem',
      undefined,
      `Импорт базы знаний (${mode}): импортировано ${imported}, пропущено ${skipped}`,
    )

    return NextResponse.json({
      ok: true,
      imported,
      skipped,
      mode,
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Import failed' },
      { status: 500 },
    )
  }
}
