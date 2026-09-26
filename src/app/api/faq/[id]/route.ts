import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, logAdminAction, badRequest, notFound } from '@/lib/api-helpers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await db.faqItem.findUnique({
    where: { id },
    include: { category: true, tags: { include: { tag: true } } },
  })
  if (!item) return notFound('Ответ не найден')
  return NextResponse.json({ ok: true, item })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { question, answer, keywords, categoryId, isPinned, isPublished, sortOrder, tagIds } = body

  try {
    // Обновляем теги: удаляем старые, создаём новые
    if (tagIds !== undefined) {
      await db.faqTag.deleteMany({ where: { faqItemId: id } })
    }

    const item = await db.faqItem.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(keywords !== undefined && { keywords: keywords || null }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(isPinned !== undefined && { isPinned: !!isPinned }),
        ...(isPublished !== undefined && { isPublished: !!isPublished }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(tagIds?.length && {
          tags: { create: tagIds.map((tagId: string) => ({ tagId })) },
        }),
      },
      include: { category: true, tags: { include: { tag: true } } },
    })

    await logAdminAction('faq.update', 'FaqItem', id, `Изменён вопрос: ${item.question.slice(0, 80)}`)
    return NextResponse.json({ ok: true, item })
  } catch (e: any) {
    return badRequest(e?.message || 'Ошибка обновления')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const item = await db.faqItem.findUnique({ where: { id } })
  if (!item) return notFound('Ответ не найден')

  await db.faqItem.delete({ where: { id } })
  await logAdminAction('faq.delete', 'FaqItem', id, `Удалён вопрос: ${item.question.slice(0, 80)}`)
  return NextResponse.json({ ok: true })
}
