import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/api-helpers'

/**
 * Запросы без ответа — off-topic / unknown source.
 * Здесь администратор может посмотреть, что спрашивали,
 * на что бот не смог ответить, и быстро добавить в базу.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const items = await db.messageLog.findMany({
    where: {
      direction: 'in',
      AND: [
        {
          OR: [
            { source: 'unknown' },
            { source: 'offtopic' },
            { source: 'user' },
          ],
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: true },
  })

  return NextResponse.json({ ok: true, items })
}

/**
 * Превратить запрос без ответа в новый FAQ-элемент.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { messageLogId, question, answer, categoryId, keywords } = await req.json().catch(() => ({}))
  if (!question || !answer) {
    return NextResponse.json({ ok: false, error: 'Нужны question и answer' }, { status: 400 })
  }

  const item = await db.faqItem.create({
    data: {
      question,
      answer,
      keywords: keywords || null,
      categoryId: categoryId || null,
      isPublished: true,
    },
  })

  // помечаем исходный лог как обработанный
  if (messageLogId) {
    await db.messageLog.update({
      where: { id: messageLogId },
      data: { source: 'faq', faqItemId: item.id },
    })
  }

  return NextResponse.json({ ok: true, item })
}
