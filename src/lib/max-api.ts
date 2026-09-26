/**
 * MAX Bot API client.
 *
 * Документация MAX: https://dev.max.ru/docs
 * Базовый URL: https://platform-api2.max.ru/
 */

import { db } from './db'

const MAX_API_BASE = 'https://platform-api2.max.ru'
const API_TIMEOUT_MS = 15000

/** Cache token in-memory to avoid DB lookup on every API call. */
let cachedToken: string | null = null
let cachedTokenAt = 0
const TOKEN_CACHE_TTL_MS = 30_000

export async function getBotToken(): Promise<string | null> {
  // Cache for 30s
  if (cachedToken && Date.now() - cachedTokenAt < TOKEN_CACHE_TTL_MS) {
    return cachedToken
  }
  const row = await db.botSetting.findUnique({ where: { key: 'MAX_BOT_TOKEN' } })
  const token = row?.value || process.env.MAX_BOT_TOKEN || null
  cachedToken = token
  cachedTokenAt = Date.now()
  return token
}

export function invalidateTokenCache(): void {
  cachedToken = null
  cachedTokenAt = 0
}

export async function setBotToken(token: string): Promise<void> {
  await db.botSetting.upsert({
    where: { key: 'MAX_BOT_TOKEN' },
    update: { value: token },
    create: { key: 'MAX_BOT_TOKEN', value: token },
  })
  invalidateTokenCache()
}

/** fetch with timeout */
async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = API_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

interface MaxApiError {
  code: string | number
  message?: string
}

async function callApi<T = any>(
  method: string,
  params: Record<string, any> = {},
): Promise<T> {
  const t = await getBotToken()
  if (!t) throw new Error('MAX_BOT_TOKEN is not set')

  const url = new URL(`${MAX_API_BASE}/${method}`)
  url.searchParams.set('access_token', t)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    url.searchParams.set(k, String(v))
  }

  const res = await fetchWithTimeout(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`MAX API ${method} HTTP ${res.status}: ${text.slice(0, 500)}`)
  }
  const data = await res.json()
  // MAX API возвращает { code: 'ok' | 'invalid.token' | ..., message?: string }
  if (data.code && data.code !== 'ok' && data.code !== 200 && data.code !== 'created') {
    const err = data as MaxApiError
    throw new Error(`MAX API ${method} error: ${err.code}${err.message ? ` — ${err.message}` : ''}`)
  }
  return data as T
}

async function postApi<T = any>(
  method: string,
  body: Record<string, any>,
): Promise<T> {
  const t = await getBotToken()
  if (!t) throw new Error('MAX_BOT_TOKEN is not set')

  const url = new URL(`${MAX_API_BASE}/${method}`)
  url.searchParams.set('access_token', t)

  const res = await fetchWithTimeout(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`MAX API ${method} POST HTTP ${res.status}: ${text.slice(0, 500)}`)
  }
  const data = await res.json()
  if (data.code && data.code !== 'ok' && data.code !== 200 && data.code !== 'created') {
    const err = data as MaxApiError
    throw new Error(`MAX API ${method} error: ${err.code}${err.message ? ` — ${err.message}` : ''}`)
  }
  return data as T
}

// --- Public API ---

export interface MaxUser {
  user_id: string
  username?: string
  first_name?: string
  last_name?: string
}

export interface MaxMessage {
  id: string
  text?: string
  sender: MaxUser
  chat?: { chat_id: string }
  recipient?: { recipient_id: string }
}

export interface MaxCallback {
  id: string
  payload: string
  user: MaxUser
  message?: MaxMessage
}

export interface InlineButton {
  text: string
  payload: string
}

/**
 * Отправить текстовое сообщение пользователю.
 * Inline-клавиатура кодируется как attachment (по спецификации MAX Bot API).
 */
export async function sendText(
  maxUserId: string,
  text: string,
  options: {
    inlineKeyboard?: InlineButton[][]
    parseMode?: 'HTML' | 'Markdown'
  } = {},
): Promise<any> {
  const body: Record<string, any> = {
    chat_id: maxUserId,
    text: text.slice(0, 4000), // MAX limit
    disable_preview: true,
  }
  if (options.parseMode) body.parse_mode = options.parseMode
  if (options.inlineKeyboard && options.inlineKeyboard.length) {
    const flat = options.inlineKeyboard.flat()
    body.attachments = [
      {
        type: 'inline_keyboard',
        payload: {
          layout: options.inlineKeyboard.map((row) => row.length),
          buttons: flat.map((b) => ({
            type: 'callback',
            text: b.text.slice(0, 100),
            payload: b.payload.slice(0, 1000),
          })),
        },
      },
    ]
  }
  return postApi('messages', body)
}

/** Отредактировать существующее сообщение */
export async function editText(
  chatId: string,
  messageId: string,
  text: string,
): Promise<any> {
  return postApi(`messages/${messageId}`, { chat_id: chatId, text: text.slice(0, 4000) })
}

/** Ответить на callback (убрать "часики" на кнопке) */
export async function answerCallback(callbackId: string): Promise<any> {
  return callApi(`callbacks/${callbackId}/answer`)
}

/** Получить информацию о боте */
export async function getMe(): Promise<any> {
  return callApi('me')
}

/**
 * Подписать webhook на события MAX.
 * См. https://dev.max.ru/docs/api/bot-api/subscription
 */
export async function subscribeWebhook(url: string): Promise<any> {
  const t = await getBotToken()
  if (!t) throw new Error('MAX_BOT_TOKEN is not set')

  // MAX API: subscriptions принимает POST с access_token в query
  const endpoint = `${MAX_API_BASE}/subscriptions?access_token=${encodeURIComponent(t)}`
  const res = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      types: ['message.created', 'callback.query'],
      // p2p_notify позволяет получать события без подтверждения сервером MAX
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Webhook subscribe HTTP ${res.status}: ${text.slice(0, 500)}`)
  }
  // response may be empty on success
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { ok: true, raw: text.slice(0, 200) }
  }
}

/** Отписать webhook */
export async function unsubscribeWebhook(url: string): Promise<any> {
  const t = await getBotToken()
  if (!t) throw new Error('MAX_BOT_TOKEN is not set')

  const endpoint = `${MAX_API_BASE}/subscriptions?access_token=${encodeURIComponent(t)}&url=${encodeURIComponent(url)}`
  const res = await fetchWithTimeout(endpoint, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Webhook unsubscribe HTTP ${res.status}: ${text.slice(0, 500)}`)
  }
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { ok: true }
  }
}

/** Проверить, отвечает ли API бота */
export async function checkBot(): Promise<{ ok: boolean; info?: any; error?: string }> {
  try {
    const info = await getMe()
    return { ok: true, info }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}
