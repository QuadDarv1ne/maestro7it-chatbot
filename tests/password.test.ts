/**
 * Тесты для password utilities.
 * Запуск: bun test tests/password.test.ts
 */

import { describe, it, expect } from 'bun:test'
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  validateEmail,
} from '../src/lib/password'

describe('password', () => {
  describe('hashPassword / verifyPassword', () => {
    it('хэширует и проверяет корректный пароль', () => {
      const password = 'MyStr0ngP@ssw0rd'
      const hash = hashPassword(password)

      // Хэш не должен совпадать с паролем
      expect(hash).not.toBe(password)
      // Хэш должен содержать соль и хэш, разделённые двоеточием
      expect(hash).toContain(':')
      const [salt, hashPart] = hash.split(':')
      expect(salt.length).toBeGreaterThan(0)
      expect(hashPart.length).toBeGreaterThan(0)

      // Проверка корректного пароля
      expect(verifyPassword(password, hash)).toBe(true)
    })

    it('отклоняет неверный пароль', () => {
      const hash = hashPassword('correctPassword123')
      expect(verifyPassword('wrongPassword', hash)).toBe(false)
      expect(verifyPassword('', hash)).toBe(false)
      expect(verifyPassword('correctPassword123 ', hash)).toBe(false)
    })

    it('создаёт разные хэши для одного пароля (разная соль)', () => {
      const password = 'SamePassword123'
      const hash1 = hashPassword(password)
      const hash2 = hashPassword(password)
      expect(hash1).not.toBe(hash2)
      // Но оба должны проверяться
      expect(verifyPassword(password, hash1)).toBe(true)
      expect(verifyPassword(password, hash2)).toBe(true)
    })

    it('обрабатывает некорректный формат хэша', () => {
      expect(verifyPassword('password', '')).toBe(false)
      expect(verifyPassword('password', 'invalid')).toBe(false)
      expect(verifyPassword('password', 'no-colon-here')).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('принимает сильные пароли', () => {
      expect(validatePasswordStrength('Str0ngP@ss').ok).toBe(true)
      expect(validatePasswordStrength('Password123').ok).toBe(true)
      expect(validatePasswordStrength('abc123def').ok).toBe(true)
    })

    it('отклоняет короткие пароли', () => {
      const result = validatePasswordStrength('Ab1')
      expect(result.ok).toBe(false)
      expect(result.error).toContain('8 символов')
    })

    it('отклоняет пароли без букв', () => {
      const result = validatePasswordStrength('12345678')
      expect(result.ok).toBe(false)
      expect(result.error).toContain('букву')
    })

    it('отклоняет пароли без цифр', () => {
      const result = validatePasswordStrength('OnlyLetters')
      expect(result.ok).toBe(false)
      expect(result.error).toContain('цифру')
    })

    it('отклоняет пустые пароли', () => {
      const result = validatePasswordStrength('')
      expect(result.ok).toBe(false)
    })

    it('отклоняет слишком длинные пароли', () => {
      const result = validatePasswordStrength('A1'.repeat(150))
      expect(result.ok).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('принимает корректные email', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('admin@maestro7it.ru')).toBe(true)
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true)
    })

    it('отклоняет некорректные email', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('missing@domain')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user @domain.com')).toBe(false)
    })

    it('отклоняет слишком длинные email', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(validateEmail(longEmail)).toBe(false)
    })
  })
})
