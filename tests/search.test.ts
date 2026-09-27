/**
 * Тесты для search engine.
 * Запуск: bun test tests/search.test.ts
 */

import { describe, it, expect } from 'bun:test'
import { normalize, tokenize } from '../src/lib/search'

describe('search', () => {
  describe('normalize', () => {
    it('приводит к нижнему регистру', () => {
      expect(normalize('Docker')).toBe('docker')
      expect(normalize('PYTHON')).toBe('python')
    })

    it('заменяет ё на е', () => {
      expect(normalize('ещё')).toBe('еще')
      expect(normalize('ёлочка')).toBe('елочка')
    })

    it('удаляет пунктуацию', () => {
      expect(normalize('Hello, World!')).toBe('hello world')
      expect(normalize('test (with parens)')).toBe('test with parens')
      expect(normalize('dash-word')).toBe('dash-word') // дефис остаётся
    })

    it('схлопывает пробелы', () => {
      expect(normalize('multiple   spaces')).toBe('multiple spaces')
      expect(normalize('  trim  ')).toBe('trim')
    })

    it('обрабатывает пустую строку', () => {
      expect(normalize('')).toBe('')
      expect(normalize(null as any)).toBe('')
    })
  })

  describe('tokenize', () => {
    it('разбивает на токены', () => {
      const tokens = tokenize('Docker для начинающих')
      expect(tokens).toContain('docker')
      expect(tokens).toContain('начинающих')
      // 'для' — stop word, должна быть отфильтрована
      expect(tokens).not.toContain('для')
    })

    it('фильтрует stop-words', () => {
      const tokens = tokenize('какие у вас есть курсы')
      expect(tokens).not.toContain('какие')
      expect(tokens).not.toContain('вас')
      expect(tokens).not.toContain('есть')
      expect(tokens).not.toContain('курс') // 'курс' теперь stop-word
    })

    it('возвращает уникальные токены', () => {
      const tokens = tokenize('docker docker DOCKER')
      expect(tokens).toEqual(['docker'])
    })

    it('отбрасывает токены короче 2 символов', () => {
      const tokens = tokenize('a ab abc')
      expect(tokens).not.toContain('a')
      expect(tokens).toContain('ab')
      expect(tokens).toContain('abc')
    })

    it('обрабатывает пустую строку', () => {
      expect(tokenize('')).toEqual([])
      expect(tokenize('   ')).toEqual([])
    })

    it('обрабатывает строку только из stop-words', () => {
      expect(tokenize('и в на')).toEqual([])
    })
  })
})
