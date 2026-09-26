import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/api-helpers'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalMessages,
    messages24h,
    messages7d,
    faqCount,
    categoryCount,
    userCount,
    userCount24h,
    feedbackPositive,
    feedbackNegative,
    faqAnswers24h,
    llmAnswers24h,
    offTopic24h,
    unanswered,
    recentByDay,
    sourceBreakdown,
  ] = await Promise.all([
    db.messageLog.count(),
    db.messageLog.count({ where: { createdAt: { gte: dayAgo } } }),
    db.messageLog.count({ where: { createdAt: { gte: weekAgo } } }),
    db.faqItem.count(),
    db.category.count(),
    db.maxUser.count(),
    db.maxUser.count({ where: { firstSeenAt: { gte: dayAgo } } }),
    db.faqFeedback.count({ where: { rating: 1 } }),
    db.faqFeedback.count({ where: { rating: -1 } }),
    db.messageLog.count({ where: { source: 'faq', createdAt: { gte: dayAgo } } }),
    db.messageLog.count({ where: { source: 'llm', createdAt: { gte: dayAgo } } }),
    db.messageLog.count({ where: { isOffTopic: true, createdAt: { gte: dayAgo } } }),
    db.messageLog.count({ where: { source: 'unknown' } }),
    // last 14 days breakdown
    db.messageLog.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
      _count: true,
    }).then((rows) =>
      rows.reduce((acc, r) => {
        const day = r.createdAt.toISOString().slice(0, 10)
        acc[day] = (acc[day] || 0) + r._count
        return acc
      }, {} as Record<string, number>),
    ),
    db.messageLog.groupBy({
      by: ['source'],
      _count: true,
    }).then((rows) =>
      rows.reduce((acc, r) => {
        acc[r.source] = r._count
        return acc
      }, {} as Record<string, number>),
    ),
  ])

  // Доля FAQ vs LLM
  const totalAnswers24h = faqAnswers24h + llmAnswers24h
  const faqShare = totalAnswers24h > 0 ? Math.round((faqAnswers24h / totalAnswers24h) * 100) : 0
  const llmShare = totalAnswers24h > 0 ? Math.round((llmAnswers24h / totalAnswers24h) * 100) : 0

  return NextResponse.json({
    ok: true,
    metrics: {
      totalMessages,
      messages24h,
      messages7d,
      faqCount,
      categoryCount,
      userCount,
      userCount24h,
      feedbackPositive,
      feedbackNegative,
      feedbackRate: feedbackPositive + feedbackNegative > 0
        ? Math.round((feedbackPositive / (feedbackPositive + feedbackNegative)) * 100)
        : null,
      faqAnswers24h,
      llmAnswers24h,
      offTopic24h,
      unanswered,
      faqShare,
      llmShare,
    },
    recentByDay,
    sourceBreakdown,
  })
}
