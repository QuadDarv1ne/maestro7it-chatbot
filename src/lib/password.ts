/**
 * Password hashing utilities.
 * Использует Node.js built-in scrypt (без внешних зависимостей).
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY_LEN = 64
const SALT_LEN = 16
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 }

/**
 * Хэширует пароль. Возвращает строку в формате `salt_hex:hash_hex`.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN)
  const hash = scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

/**
 * Проверяет пароль против хэша. Constant-time comparison.
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [saltHex, hashHex] = stored.split(':')
    if (!saltHex || !hashHex) return false

    const salt = Buffer.from(saltHex, 'hex')
    const storedHash = Buffer.from(hashHex, 'hex')
    const hash = scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS)

    if (hash.length !== storedHash.length) return false
    return timingSafeEqual(hash, storedHash)
  } catch {
    return false
  }
}

/**
 * Валидация силы пароля.
 * Минимум: 8 символов, хотя бы 1 буква и 1 цифра.
 */
export function validatePasswordStrength(password: string): { ok: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { ok: false, error: 'Пароль должен быть не менее 8 символов' }
  }
  if (password.length > 200) {
    return { ok: false, error: 'Пароль слишком длинный' }
  }
  if (!/[a-zA-Zа-яА-Я]/.test(password)) {
    return { ok: false, error: 'Пароль должен содержать хотя бы одну букву' }
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: 'Пароль должен содержать хотя бы одну цифру' }
  }
  return { ok: true }
}

/**
 * Простая валидация email.
 */
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email) && email.length <= 254
}
