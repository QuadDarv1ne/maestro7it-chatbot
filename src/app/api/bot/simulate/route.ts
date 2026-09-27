import { NextRequest, NextResponse } from 'next/server'
import { handleMessage, handleCallback } from '@/lib/bot-logic'
import { requireAdmin, badRequest } from '@/lib/api-helpers'

/**
 * Симулятор бота — позволяет администратору протестировать логику
 * без реального подключения к MAX.
 *
 * Использует СТАБИЛЬНЫЙ sim_admin ID, чтобы не плодить пользователей в БД.
 * Все запросы логируются в общий MessageLog с этим же пользователем,
 * что позволяет увидеть их в "Логах обращений" и "Запросах без ответа".
 *
 * POST /api/bot/simulate
 *   { "text": "Какие курсы по Python?" }
 *   → { ok, reply: { text, source, faqItemId, isOffTopic, inlineKeyboard } }
 *
 *   { "payload": "category:devops" }
 *   → { ok, reply: {...} }  (callback simulation)
 */

// Стабильный ID симулятора — не плодим пользователей в БД
const SIM_MAX_USER_ID = 'sim_admin_local'
const SIM_USERNAME = 'simulator'
const SIM_FIRST_NAME = 'Симулятор'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))

  try {
    // --- Симуляция callback (inline button click) ---
    if (body.payload) {
      const payload = String(body.payload)
      const reply = await handleCallback(payload, {
        maxUserId: SIM_MAX_USER_ID,
        username: SIM_USERNAME,
        firstName: SIM_FIRST_NAME,
        text: `[callback:${payload}]`,
      })
      return NextResponse.json({ ok: true, reply })
    }

    // --- Симуляция текстового сообщения ---
    const text = (body.text || '').toString().trim()
    if (!text) return badRequest('Введите текст сообщения')

    if (text.length > 2000) return badRequest('Сообщение слишком длинное (макс. 2000)')

    const reply = await handleMessage({
      maxUserId: SIM_MAX_USER_ID,
      username: SIM_USERNAME,
      firstName: SIM_FIRST_NAME,
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
