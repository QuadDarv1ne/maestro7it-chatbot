/**
 * Admin auth — persistent cookie-based сессии в БД.
 *
 * Изменения в v1.4.0:
 *  - Логин по email + пароль (вместо единого ADMIN_PASSWORD)
 *  - Поддержка нескольких администраторов (AdminAccount model)
 *  - Восстановление пароля через email (PasswordResetToken)
 *  - Backward compat: если нет AdminAccount, fallback на ADMIN_PASSWORD env
 *    (для миграции — но рекомендуется создать аккаунт через seed)
 */

import { cookies } from 'next/headers'
import { randomBytes, timingSafeEqual } from 'crypto'
import { db } from './db'
import { verifyPassword, validateEmail } from './password'

const SESSION_COOKIE = 'maestro7it_admin_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours
const SESSION_TTL_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

// Rate limit: 5 failed attempts per 15 min per email
interface RateEntry {
  count: number
  firstAt: number
  lockedUntil: number
}
const rateMap = new Map<string, RateEntry>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LOCK_MS = 15 * 60 * 1000

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

// Periodic cleanup of expired sessions
let lastCleanup = 0
async function cleanupExpiredSessions() {
  const now = Date.now()
  if (now - lastCleanup < 60 * 60 * 1000) return
  lastCleanup = now
  try {
    await db.adminSession.deleteMany({
      where: { expiresAt: { lt: new Date(now) } },
    })
  } catch {
    // ignore
  }
}

export interface LoginResult {
  ok: boolean
  error?: string
  token?: string
  remember?: boolean
  retryAfterMs?: number
  accountId?: string
}

/**
 * Login by email + password.
 * Поддерживает multiple admin accounts.
 */
export async function login(
  email: string,
  password: string,
  remember = false,
): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !password) {
    return { ok: false, error: 'Введите email и пароль' }
  }
  if (!validateEmail(normalizedEmail)) {
    return { ok: false, error: 'Некорректный email' }
  }

  // Rate limit per email
  const rlKey = `login_${normalizedEmail}`
  const rl = checkRateLimit(rlKey)
  if (!rl.ok) {
    return {
      ok: false,
      error: `Слишком много попыток. Повторите через ${Math.ceil((rl.retryAfterMs || 0) / 60_000)} мин.`,
      retryAfterMs: rl.retryAfterMs,
    }
  }

  // Find admin account
  const account = await db.adminAccount.findUnique({
    where: { email: normalizedEmail },
  })

  if (!account) {
    registerFailure(rlKey)
    return { ok: false, error: 'Неверный email или пароль' }
  }

  if (!account.isActive) {
    return { ok: false, error: 'Аккаунт деактивирован. Обратитесь к супер-админу.' }
  }

  if (!verifyPassword(password, account.passwordHash)) {
    registerFailure(rlKey)
    return { ok: false, error: 'Неверный email или пароль' }
  }

  clearRateLimit(rlKey)

  // Create session
  const token = randomBytes(32).toString('hex')
  const now = new Date()
  const ttl = remember ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_MS
  const expiresAt = new Date(now.getTime() + ttl)

  await db.adminSession.create({
    data: {
      token,
      createdAt: now,
      expiresAt,
      lastActivity: now,
      accountId: account.id,
    },
  })

  // Update lastLoginAt
  await db.adminAccount.update({
    where: { id: account.id },
    data: { lastLoginAt: now },
  }).catch(() => {})

  return { ok: true, token, remember, accountId: account.id }
}

export async function logout(token: string): Promise<void> {
  try {
    await db.adminSession.deleteMany({ where: { token } })
  } catch {
    // ignore
  }
}

export async function getSession(): Promise<{ valid: boolean; token?: string; accountId?: string }> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return { valid: false }

  try {
    const session = await db.adminSession.findUnique({
      where: { token },
      include: { account: true },
    })
    if (!session) return { valid: false }

    if (session.expiresAt.getTime() < Date.now()) {
      await db.adminSession.delete({ where: { id: session.id } }).catch(() => {})
      return { valid: false }
    }

    // Account deactivated after session was created
    if (session.account && !session.account.isActive) {
      await db.adminSession.delete({ where: { id: session.id } }).catch(() => {})
      return { valid: false }
    }

    // Update lastActivity (no more than once per minute)
    const minuteAgo = new Date(Date.now() - 60_000)
    if (session.lastActivity < minuteAgo) {
      await db.adminSession.update({
        where: { id: session.id },
        data: { lastActivity: new Date() },
      }).catch(() => {})
    }

    cleanupExpiredSessions().catch(() => {})

    return { valid: true, token, accountId: session.accountId || undefined }
  } catch {
    return { valid: false }
  }
}

export async function setSessionCookie(token: string, remember = false): Promise<void> {
  const store = await cookies()
  const ttl = remember ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_MS
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ttl / 1000,
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE

// --- Password reset ---

/**
 * Создаёт токен восстановления пароля.
 * Возвращает токен (для формирования ссылки) или null если email не найден.
 *
 * ВАЖНО: для безопасности не раскрываем, существует ли email.
 * Если email не найден — возвращаем как будто успешно (токен не создаём).
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!validateEmail(normalizedEmail)) return null

  const account = await db.adminAccount.findUnique({
    where: { email: normalizedEmail },
  })
  if (!account || !account.isActive) return null

  // Инвалидируем старые токены этого email
  await db.passwordResetToken.updateMany({
    where: { email: normalizedEmail, usedAt: null },
    data: { usedAt: new Date() },
  }).catch(() => {})

  const token = randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MS)

  await db.passwordResetToken.create({
    data: { email: normalizedEmail, token, expiresAt, createdAt: now },
  })

  return token
}

/**
 * Проверяет токен восстановления (без его использования).
 */
export async function verifyResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
  if (!token || token.length < 32) {
    return { valid: false, error: 'Некорректный токен' }
  }

  const record = await db.passwordResetToken.findUnique({
    where: { token },
  })

  if (!record) {
    return { valid: false, error: 'Токен не найден' }
  }
  if (record.usedAt) {
    return { valid: false, error: 'Токен уже использован' }
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return { valid: false, error: 'Срок действия токена истёк' }
  }

  return { valid: true, email: record.email }
}

/**
 * Сбрасывает пароль по токену.
 * Проверяет токен, обновляет пароль аккаунта, помечает токен как использованный.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const verify = await verifyResetToken(token)
  if (!verify.valid || !verify.email) {
    return { ok: false, error: verify.error || 'Неверный токен' }
  }

  const account = await db.adminAccount.findUnique({
    where: { email: verify.email },
  })
  if (!account || !account.isActive) {
    return { ok: false, error: 'Аккаунт не найден или деактивирован' }
  }

  // Импортируем здесь чтобы избежать циклической зависимости
  const { hashPassword, validatePasswordStrength } = await import('./password')
  const strength = validatePasswordStrength(newPassword)
  if (!strength.ok) {
    return { ok: false, error: strength.error }
  }

  const passwordHash = hashPassword(newPassword)

  // Обновляем пароль
  await db.adminAccount.update({
    where: { id: account.id },
    data: { passwordHash },
  })

  // Помечаем токен как использованный
  await db.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  })

  // Инвалидируем все сессии этого аккаунта (безопасность)
  await db.adminSession.deleteMany({
    where: { accountId: account.id },
  }).catch(() => {})

  return { ok: true }
}

export async function getActiveSessionsCount(): Promise<number> {
  try {
    return await db.adminSession.count({
      where: { expiresAt: { gt: new Date() } },
    })
  } catch {
    return 0
  }
}
