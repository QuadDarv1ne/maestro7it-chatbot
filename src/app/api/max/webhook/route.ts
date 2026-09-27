import { NextRequest, NextResponse } from 'next/server'
import { handleMessage, handleCallback } from '@/lib/bot-logic'
import { sendText, answerCallback, getBotToken } from '@/lib/max-api'
import { db } from '@/lib/db'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * MAX webhook endpoint.
 *
 * MAX отправляет POST на подписанный URL с событиями:
 *  - message.created  — новое сообщение от пользователя
 *  - callback.query   — нажата inline-кнопка
 *
 * Документация: https://dev.max.ru/docs
 *
 * Безопасность:
 *  - Webhook signature verification через HMAC-SHA256 (если задан WEBHOOK_SECRET)
 *  - Idempotency через in-memory LRU-кэш (защита от дублей)
 *
 * Idempotency: MAX может присылать одно и то же событие несколько раз.
 * Используем in-memory LRU-кэш на 60 секунд для deduplication по message.id.
 */

const processedIds = new Map<string, number>()
const DEDUP_TTL_MS = 60_000
const DEDUP_MAX = 1000

function isProcessed(id: string): boolean {
  const now = Date.now()
  // cleanup
  if (processedIds.size > DEDUP_MAX) {
    for (const [k, t] of processedIds) {
      if (now - t > DEDUP_TTL_MS) processedIds.delete(k)
    }
  }
  const seen = processedIds.has(id)
  if (!seen) processedIds.set(id, now)
  return seen
}

// Cleanup каждые 60 секунд
setInterval(() => {
  const now = Date.now()
  for (const [k, t] of processedIds) {
    if (now - t > DEDUP_TTL_MS) processedIds.delete(k)
  }
}, 60_000).unref?.()

/**
 * Проверка подписи webhook (если задан WEBHOOK_SECRET).
 * MAX подписывает body HMAC-SHA256 с секретом, отправляет в заголовке X-Max-Signature.
 *
 * Если WEBHOOK_SECRET не задан — проверка пропускается (для dev).
 */
function verifyWebhookSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) return true // проверка отключена

  const signature = req.headers.get('x-max-signature') || req.headers.get('x-signature')
  if (!signature) return false

  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length) return false
    return timingSafeEqual(sigBuf, expBuf)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  // Читаем raw body для проверки подписи
  const rawBody = await req.text()

  // Проверка подписи (если включена)
  if (!verifyWebhookSignature(req, rawBody)) {
    console.warn('[webhook] signature verification failed')
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const eventType = body?.eventType || body?.event || body?.type

  // Если токен не задан — отвечаем 200 OK чтобы MAX не ретраил,
  // но логируем warning
  const token = await getBotToken().catch(() => null)
  if (!token) {
    console.warn('[webhook] received event but MAX_BOT_TOKEN is not set:', eventType)
    return NextResponse.json({ ok: true, skipped: 'no_token' })
  }

  try {
    // --- Сообщение ---
    if (eventType === 'message.created' || body?.message) {
      const msg = body.message || body.data?.message
      if (!msg) return NextResponse.json({ ok: true })

      // Idempotency
      const msgId = String(msg.id || msg.message_id || '')
      if (msgId && isProcessed(`msg:${msgId}`)) {
        return NextResponse.json({ ok: true, dedup: true })
      }

      const text = msg.text || msg.body?.text || ''
      const sender = msg.sender || msg.from || {}
      const maxUserId = String(sender.user_id || sender.id || msg.chat?.chat_id || '')

      if (!text || !maxUserId) {
        return NextResponse.json({ ok: true, skipped: true })
      }

      const incoming = {
        maxUserId,
        username: sender.username,
        firstName: sender.first_name,
        lastName: sender.last_name,
        text,
      }

      const reply = await handleMessage(incoming)

      // sendText may fail — логируем, но отвечаем 200 OK
      try {
        await sendText(maxUserId, reply.text, {
          inlineKeyboard: reply.inlineKeyboard,
        })
      } catch (e: any) {
        console.error('[webhook] sendText failed:', e?.message)
        // всё равно 200, чтобы MAX не повторял
      }

      return NextResponse.json({ ok: true })
    }

    // --- Callback (inline button) ---
    if (eventType === 'callback.query' || body?.callback) {
      const cb = body.callback || body.data?.callback
      if (!cb) return NextResponse.json({ ok: true })

      const callbackId = String(cb.id || '')
      if (callbackId && isProcessed(`cb:${callbackId}`)) {
        return NextResponse.json({ ok: true, dedup: true })
      }

      const payload = cb.payload || cb.data || ''
      const user = cb.user || cb.from || {}
      const maxUserId = String(user.user_id || user.id || '')

      // сразу отвечаем на callback, чтобы убрать "часики"
      if (callbackId) {
        answerCallback(callbackId).catch((e: any) =>
          console.error('[webhook] answerCallback failed:', e?.message),
        )
      }

      if (!payload || !maxUserId) {
        return NextResponse.json({ ok: true, skipped: true })
      }

      const incoming = {
        maxUserId,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        text: `[callback:${payload}]`,
      }

      const reply = await handleCallback(payload, incoming)

      try {
        await sendText(maxUserId, reply.text, {
          inlineKeyboard: reply.inlineKeyboard,
        })
      } catch (e: any) {
        console.error('[webhook] sendText (callback) failed:', e?.message)
      }

      return NextResponse.json({ ok: true })
    }

    // --- Неизвестное событие ---
    return NextResponse.json({ ok: true, unknown: eventType })
  } catch (e: any) {
    console.error(
      '[webhook] error:',
      e?.message || e,
      'event:',
      eventType,
      'body:',
      JSON.stringify(body).slice(0, 500),
    )
    // Возвращаем 500 — MAX повторит запрос
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 },
    )
  }
}

/**
 * GET-эндпоинт для верификации webhook (если MAX пингует).
 */
export async function GET() {
  return NextResponse.json({
    service: 'maestro7it-bot',
    webhook: 'active',
    time: new Date().toISOString(),
    messageCount: await db.messageLog.count().catch(() => -1),
  })
}
