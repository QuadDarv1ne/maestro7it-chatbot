/**
 * Search engine for FAQ.
 *
 * Подход:
 *  1. Нормализация текста (lowercase, ё→е, удаление пунктуации)
 *  2. Токенизация с фильтром стоп-слов
 *  3. Подсчёт совпадений по question / keywords / answer (Set для O(1) lookup)
 *  4. Скоринг: question (3) > keywords (2) > answer (1)
 *  5. Бонусы за точное вхождение фразы и за закреплённые
 *  6. Фильтр по порогу, сортировка по скору
 */

import { db } from './db'

const STOP_WORDS = new Set([
  // Русские
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все', 'она',
  'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее',
  'мне', 'было', 'вот', 'от', 'меня', 'о', 'из', 'ему', 'теперь', 'когда', 'даже', 'ну',
  'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибудь',
  'опять', 'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей', 'может', 'они',
  'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем', 'была', 'сам',
  'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под', 'будет', 'ж', 'тогда',
  'кто', 'этот', 'того', 'потому', 'этого', 'какой', 'совсем', 'ним', 'здесь', 'этом',
  'один', 'почему', 'все', 'кстати', 'можно', 'при', 'наконец', 'два', 'об', 'другой',
  'хоть', 'после', 'над', 'больше', 'тот', 'через', 'эти', 'нас', 'про', 'всего', 'них',
  'какая', 'оно', 'эту', 'моя', 'всю', 'который', 'которая', 'которое', 'чтобы',
  // Частотные слова из запросов к боту
  'сколько', 'стоит', 'подскажите', 'скажите', 'привет', 'здравствуйте', 'пожалуйста',
  'спасибо', 'хочу', 'нужно', 'надо', 'помогите', 'узнать', 'узнайте',
  'какие', 'какая', 'какое', 'какой', 'какую', 'есть', 'вас', 'вам', 'вас',
  // Английские
  'the', 'a', 'an', 'is', 'are', 'am', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'can', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down',
  'and', 'or', 'but', 'not', 'no', 'yes', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
])

/** Простая транслитерация ru↔en для устойчивости к запросам вроде "python" vs "питон" */
const LATIN_TO_CYR: Record<string, string> = {
  a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', yo: 'ё', zh: 'ж', z: 'з',
  i: 'и', j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
  s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', ts: 'ц', ch: 'ч', sh: 'ш', sch: 'щ',
  y: 'ы', e2: 'э', yu: 'ю', ya: 'я',
}

export function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Токенизация с фильтром стоп-слов.
 * Возвращает массив уникальных значимых токенов длиной > 1.
 */
export function tokenize(text: string): string[] {
  const normalized = normalize(text)
  const tokens = normalized
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
  return Array.from(new Set(tokens))
}

/** Биграммы для лучшего match фразовых запросов */
function bigrams(tokens: string[]): Set<string> {
  const set = new Set<string>()
  for (let i = 0; i < tokens.length - 1; i++) {
    set.add(`${tokens[i]} ${tokens[i + 1]}`)
  }
  return set
}

export interface SearchResult {
  faqItemId: string
  question: string
  answer: string
  score: number
}

export async function searchFaq(query: string, limit = 5): Promise<SearchResult[]> {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const queryTokenSet = new Set(queryTokens)
  const queryBigrams = bigrams(queryTokens)
  const normalizedQuery = normalize(query)

  // Загружаем все FAQ — для небольших баз это быстрее чем FTS
  const faqs = await db.faqItem.findMany({
    where: { isPublished: true },
    include: { category: true },
  })

  const results: SearchResult[] = []

  for (const faq of faqs) {
    const qTokens = tokenize(faq.question)
    const kTokens = tokenize(faq.keywords || '')
    const aTokens = tokenize(faq.answer)

    const qSet = new Set(qTokens)
    const kSet = new Set(kTokens)
    const aSet = new Set(aTokens)

    let score = 0

    // Совпадения по токенам
    for (const t of queryTokenSet) {
      if (qSet.has(t)) score += 3
      if (kSet.has(t)) score += 2
      if (aSet.has(t)) score += 1
      // частичное совпадение (начинается с) — дорого, но даёт match на "react" vs "reactjs"
      for (const qt of qSet) {
        if (qt === t) continue
        if (qt.startsWith(t) || t.startsWith(qt)) {
          score += 0.5
          break
        }
      }
    }

    // Совпадение биграмм (фраз)
    const qBigrams = bigrams(qTokens)
    let bigramHits = 0
    for (const bg of queryBigrams) {
      if (qBigrams.has(bg)) bigramHits++
    }
    score += bigramHits * 2

    // Бонус за точное вхождение фразы
    const normalizedQ = normalize(faq.question)
    if (normalizedQuery.length > 4 && normalizedQ.includes(normalizedQuery)) {
      score += 5
    }
    // и наоборот — вопрос включает слова запроса
    if (normalizedQuery.length > 4 && normalizedQuery.includes(normalizedQ)) {
      score += 3
    }

    // Бонус за закреплённые
    if (faq.isPinned) score += 0.5

    // Порог 3 — баланс между точностью и полнотой.
    // Слишком низкий (2) → много ложных срабатываний на частых словах.
    // Слишком высокий (5) → короткие запросы вроде "docker" не находят.
    if (score >= 3) {
      results.push({
        faqItemId: faq.id,
        question: faq.question,
        answer: faq.answer,
        score,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Глобальный поиск по всей базе (для админки).
 * Безопасен для инъекций — использует Prisma parameter binding.
 */
export async function globalSearch(query: string, limit = 20) {
  const q = query.trim()
  if (!q) return { faq: [], categories: [], logs: [] }

  const [faq, categories, logs] = await Promise.all([
    db.faqItem.findMany({
      where: {
        OR: [
          { question: { contains: q } },
          { answer: { contains: q } },
          { keywords: { contains: q } },
        ],
      },
      take: limit,
      include: { category: true },
    }),
    db.category.findMany({
      where: { OR: [{ name: { contains: q } }, { slug: { contains: q } }] },
      take: limit,
    }),
    db.messageLog.findMany({
      where: { text: { contains: q } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ])
  return { faq, categories, logs }
}
