import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, badRequest, logAdminAction } from '@/lib/api-helpers'

const MAX_QUESTION_LEN = 500
const MAX_ANSWER_LEN = 8000
const MAX_KEYWORDS_LEN = 500
const MAX_TAKE = 500

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId') || undefined
  const unpublished = searchParams.get('unpublished') === '1'
  const search = searchParams.get('q') || undefined
  const limit = Math.min(Number(searchParams.get('limit') || MAX_TAKE), MAX_TAKE)

  const where: any = {}
  if (categoryId) where.categoryId = categoryId
  if (!unpublished) where.isPublished = true
  if (search) {
    where.OR = [
      { question: { contains: search } },
      { answer: { contains: search } },
      { keywords: { contains: search } },
    ]
  }

  const items = await db.faqItem.findMany({
    where,
    orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { category: true, tags: { include: { tag: true } } },
    take: limit,
  })

  return NextResponse.json({ ok: true, items, count: items.length })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const question = (body.question || '').toString().trim()
  const answer = (body.answer || '').toString().trim()
  const keywords = (body.keywords || '').toString().trim()
  const categoryId = body.categoryId ? String(body.categoryId) : null
  const isPinned = !!body.isPinned
  const isPublished = body.isPublished !== false
  const sortOrder = typeof body.sortOrder === 'number' ? body.sortOrder : 0
  const tagIds: string[] = Array.isArray(body.tagIds) ? body.tagIds : []

  if (!question || !answer) {
    return badRequest('Вопрос и ответ обязательны')
  }
  if (question.length > MAX_QUESTION_LEN) {
    return badRequest(`Вопрос слишком длинный (макс. ${MAX_QUESTION_LEN} символов)`)
  }
  if (answer.length > MAX_ANSWER_LEN) {
    return badRequest(`Ответ слишком длинный (макс. ${MAX_ANSWER_LEN} символов)`)
  }
  if (keywords.length > MAX_KEYWORDS_LEN) {
    return badRequest(`Ключевые слова слишком длинные (макс. ${MAX_KEYWORDS_LEN} символов)`)
  }

  // Проверка categoryId
  if (categoryId) {
    const cat = await db.category.findUnique({ where: { id: categoryId } })
    if (!cat) return badRequest('Категория не найдена')
  }

  // Проверка tagIds
  if (tagIds.length > 0) {
    const existingTags = await db.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true },
    })
    if (existingTags.length !== tagIds.length) {
      return badRequest('Один или несколько тегов не существуют')
    }
  }

  try {
    const item = await db.faqItem.create({
      data: {
        question,
        answer,
        keywords: keywords || null,
        categoryId,
        isPinned,
        isPublished,
        sortOrder,
        tags: tagIds.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: { category: true, tags: { include: { tag: true } } },
    })
    await logAdminAction('faq.create', 'FaqItem', item.id, `Создан вопрос: ${question.slice(0, 80)}`)
    return NextResponse.json({ ok: true, item })
  } catch (e: any) {
    return badRequest(e?.message || 'Ошибка создания')
  }
}
