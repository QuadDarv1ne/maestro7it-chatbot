import { NextRequest, NextResponse } from 'next/server'
import { handleMessage, handleCallback } from '@/lib/bot-logic'
import { requireAdmin, badRequest } from '@/lib/api-helpers'

/**
 * Симулятор бота — позволяет администратору протестировать логику
 * без реального подключения к MAX.
 *
 * POST /api/bot/simulate
 *   { "text": "Какие курсы по Python?" }
 *   → { ok, reply: { text, source, faqItemId, isOffTopic, inlineKeyboard } }
 *
 *   { "payload": "category:devops" }
 *   → { ok, reply: {...} }  (callback simulation)
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))

  try {
    if (body.payload) {
      // Симуляция callback
      const reply = await handleCallback(String(body.payload), {
        maxUserId: `sim_${Date.now()}`,
        username: 'simulator',
        firstName: 'Симулятор',
        text: `[callback:${body.payload}]`,
      })
      return NextResponse.json({ ok: true, reply })
    }

    const text = (body.text || '').toString().trim()
    if (!text) return badRequest('Введите текст сообщения')

    if (text.length > 2000) return badRequest('Сообщение слишком длинное (макс. 2000)')

    const reply = await handleMessage({
      maxUserId: `sim_${Date.now()}`,
      username: 'simulator',
      firstName: 'Симулятор',
      text,
    })

    return NextResponse.json({ ok: true, reply })
  } catch (e: any) {
    console.error('[simulate] error:', e?.message)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Internal error' },
      { status: 500 },
    )
  }
}
