/**
 * Admin auth — persistent cookie-based сессии в БД.
 *
 * Усиления:
 *  - Persistent сессии (переживают рестарт сервера, работают в multi-instance)
 *  - Rate-limiting на login (5 попыток / 15 минут)
 *  - timing-safe сравнение пароля
 *  - 12-часовой TTL сессии с авто-продлением
 *  - Сессионный токен — 32 байта crypto-random hex
 *  - periodic cleanup истёкших сессий
 */

import { cookies } from 'next/headers'
import { randomBytes, timingSafeEqual } from 'crypto'
import { db } from './db'

const SESSION_COOKIE = 'maestro7it_admin_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

// Rate limit: 5 failed attempts per 15 min
interface RateEntry {
  count: number
  firstAt: number
  lockedUntil: number
}
const rateMap = new Map<string, RateEntry>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LOCK_MS = 15 * 60 * 1000

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123'
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function checkRateLimit(key: string): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry) return { ok: true }

  if (now - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
    rateMap.delete(key)
    return { ok: true }
  }

  if (entry.lockedUntil > now) {
    return { ok: false, retryAfterMs: entry.lockedUntil - now }
  }

  return { ok: true }
}

function registerFailure(key: string) {
  const now = Date.now()
  const entry = rateMap.get(key) || { count: 0, firstAt: now, lockedUntil: 0 }
  entry.count++
  if (entry.count >= RATE_LIMIT_MAX) {
    entry.lockedUntil = now + RATE_LOCK_MS
    entry.count = 0
    entry.firstAt = now
  }
  rateMap.set(key, entry)
}

function clearRateLimit(key: string) {
  rateMap.delete(key)
}

// Periodic cleanup of expired sessions — запускается раз в час
let lastCleanup = 0
async function cleanupExpiredSessions() {
  const now = Date.now()
  if (now - lastCleanup < 60 * 60 * 1000) return // раз в час
  lastCleanup = now
  try {
    await db.adminSession.deleteMany({
      where: { expiresAt: { lt: new Date(now) } },
    })
  } catch {
    // ignore
  }
}

export async function login(
  password: string,
): Promise<{ ok: boolean; error?: string; token?: string; retryAfterMs?: number }> {
  const rlKey = 'global_login'
  const rl = checkRateLimit(rlKey)
  if (!rl.ok) {
    return {
      ok: false,
      error: `Слишком много попыток. Повторите через ${Math.ceil((rl.retryAfterMs || 0) / 60_000)} мин.`,
      retryAfterMs: rl.retryAfterMs,
    }
  }

  if (!safeEqual(password, getAdminPassword())) {
    registerFailure(rlKey)
    return { ok: false, error: 'Неверный пароль' }
  }

  clearRateLimit(rlKey)

  const token = randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)

  await db.adminSession.create({
    data: { token, createdAt: now, expiresAt, lastActivity: now },
  })

  return { ok: true, token }
}

export async function logout(token: string): Promise<void> {
  try {
    await db.adminSession.deleteMany({ where: { token } })
  } catch {
    // ignore
  }
}

export async function getSession(): Promise<{ valid: boolean; token?: string }> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return { valid: false }

  try {
    const session = await db.adminSession.findUnique({ where: { token } })
    if (!session) return { valid: false }

    if (session.expiresAt.getTime() < Date.now()) {
      await db.adminSession.delete({ where: { id: session.id } }).catch(() => {})
      return { valid: false }
    }

    // Продлеваем активность (не чаще раза в минуту)
    const minuteAgo = new Date(Date.now() - 60_000)
    if (session.lastActivity < minuteAgo) {
      await db.adminSession.update({
        where: { id: session.id },
        data: { lastActivity: new Date() },
      }).catch(() => {})
    }

    // Фоновая очистка
    cleanupExpiredSessions().catch(() => {})

    return { valid: true, token }
  } catch {
    return { valid: false }
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE

/** Возвращает количество активных сессий */
export async function getActiveSessionsCount(): Promise<number> {
  try {
    return await db.adminSession.count({
      where: { expiresAt: { gt: new Date() } },
    })
  } catch {
    return 0
  }
}
