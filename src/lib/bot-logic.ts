/**
 * Core bot logic — обработка входящих сообщений из MAX.
 *
 * Шаги:
 *  1. Идентифицируем/создаём пользователя MaxUser
 *  2. Парсим команду или текст
 *  3. Ищем ответ в FAQ (через lib/search)
 *  4. Если нет — пробуем LLM fallback (если включён)
 *  5. Логируем всё в MessageLog
 *  6. Возвращаем текст ответа и inline-клавиатуру
 */

import { db } from './db'
import { searchFaq, type SearchResult } from './search'
import { generateLlmResponse } from './llm'

export interface IncomingMessage {
  maxUserId: string
  username?: string
  firstName?: string
  lastName?: string
  text: string
}

export interface OutgoingReply {
  text: string
  source: 'faq' | 'llm' | 'command' | 'offtopic' | 'unknown' | 'callback'
  faqItemId?: string
  isOffTopic: boolean
  inlineKeyboard?: { text: string; payload: string }[][]
}

// --- Helpers ---

async function upsertUser(msg: IncomingMessage) {
  const existing = await db.maxUser.findUnique({ where: { maxUserId: msg.maxUserId } })
  if (existing) {
    return db.maxUser.update({
      where: { id: existing.id },
      data: {
        username: msg.username || existing.username,
        firstName: msg.firstName || existing.firstName,
        lastName: msg.lastName || existing.lastName,
        lastSeenAt: new Date(),
      },
    })
  }
  return db.maxUser.create({
    data: {
      maxUserId: msg.maxUserId,
      username: msg.username,
      firstName: msg.firstName,
      lastName: msg.lastName,
    },
  })
}

async function logMessage(params: {
  maxUserId?: string
  direction: 'in' | 'out'
  text: string
  source: string
  faqItemId?: string
  isOffTopic?: boolean
  rating?: number | null
}) {
  return db.messageLog.create({
    data: {
      maxUserId: params.maxUserId,
      direction: params.direction,
      text: params.text.slice(0, 4000),
      source: params.source,
      faqItemId: params.faqItemId,
      isOffTopic: params.isOffTopic ?? false,
      rating: params.rating ?? null,
    },
  })
}

async function getSetting(key: string, fallback = ''): Promise<string> {
  const row = await db.botSetting.findUnique({ where: { key } })
  return row?.value ?? fallback
}

async function getBoolSetting(key: string, fallback: boolean): Promise<boolean> {
  const v = await getSetting(key, '')
  if (v === 'true') return true
  if (v === 'false') return false
  return fallback
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

// --- Main entry ---

export async function handleMessage(msg: IncomingMessage): Promise<OutgoingReply> {
  const user = await upsertUser(msg)
  await logMessage({ maxUserId: user.id, direction: 'in', text: msg.text, source: 'user' })

  const text = msg.text.trim()
  if (!text) {
    const welcomeText = await getSetting('welcomeText', '👋 Чем могу помочь?')
    return {
      text: welcomeText,
      source: 'command',
      isOffTopic: false,
    }
  }

  const lower = text.toLowerCase()

  // 1. Команды
  if (lower.startsWith('/')) {
    const cmdMatch = lower.match(/^\/(\S+)/)
    if (cmdMatch) {
      const cmd = cmdMatch[1]
      const arg = text.slice(cmdMatch[0].length).trim()
      const reply = await handleCommand(cmd, arg, user.id)
      if (reply) {
        await logMessage({
          maxUserId: user.id,
          direction: 'out',
          text: reply.text,
          source: reply.source === 'faq' ? 'faq' : 'command',
          faqItemId: reply.faqItemId,
          isOffTopic: reply.isOffTopic,
        })
        return reply
      }
    }
  }

  // 2. Поиск по FAQ
  const results = await searchFaq(text, 3)
  if (results.length > 0) {
    const top = results[0]
    const reply: OutgoingReply = {
      text: formatFaqAnswer(top),
      source: 'faq',
      faqItemId: top.faqItemId,
      isOffTopic: false,
      inlineKeyboard: [
        [
          { text: '👍 Полезно', payload: `feedback:${top.faqItemId}:1` },
          { text: '👎 Не помогло', payload: `feedback:${top.faqItemId}:-1` },
        ],
        ...(results.length > 1
          ? [[{ text: '📋 Ещё варианты', payload: `more:${truncate(text, 100)}` }]]
          : []),
      ],
    }
    await logMessage({
      maxUserId: user.id,
      direction: 'out',
      text: reply.text,
      source: 'faq',
      faqItemId: top.faqItemId,
    })
    return reply
  }

  // 3. LLM fallback (если включён)
  const useLlm = await getBoolSetting('useLlmFallback', true)
  if (useLlm) {
    const llmResult = await generateLlmResponse(text)
    const reply: OutgoingReply = {
      text: llmResult.text,
      source: llmResult.isOnTopic ? 'llm' : 'offtopic',
      isOffTopic: !llmResult.isOnTopic,
    }
    await logMessage({
      maxUserId: user.id,
      direction: 'out',
      text: reply.text,
      source: reply.source,
      isOffTopic: reply.isOffTopic,
    })
    return reply
  }

  // 4. Нет ответа
  const noAnswerText = await getSetting(
    'noAnswerText',
    '🤔 Извините, у меня нет ответа на этот вопрос.',
  )
  const reply: OutgoingReply = {
    text: noAnswerText,
    source: 'unknown',
    isOffTopic: false,
    inlineKeyboard: [[{ text: '📞 Написать в поддержку', payload: 'contacts' }]],
  }
  await logMessage({
    maxUserId: user.id,
    direction: 'out',
    text: reply.text,
    source: 'unknown',
  })
  return reply
}

function formatFaqAnswer(r: SearchResult): string {
  return `${r.answer}\n\n❓ Был ли ответ полезен? Нажмите кнопку ниже.`
}

async function handleCommand(
  cmd: string,
  arg: string,
  _userId: string,
): Promise<OutgoingReply | null> {
  const command = await db.botCommand.findUnique({ where: { command: cmd } })
  if (!command || !command.isEnabled) return null

  // /menu — категории курсов
  if (cmd === 'menu') {
    const categories = await db.category.findMany({
      where: { NOT: { slug: 'obshee' } },
      orderBy: { sortOrder: 'asc' },
    })
    return {
      text: command.response,
      source: 'command',
      isOffTopic: false,
      inlineKeyboard: categories.map((c) => [
        { text: `${c.emoji || '📁'} ${c.name}`, payload: `category:${c.slug}` },
      ]),
    }
  }

  // /search без аргумента — подсказка
  if (cmd === 'search' && !arg) {
    return {
      text:
        '🔍 Поиск по базе знаний.\n\nИспользование: /search <запрос>\nНапример: /search docker',
      source: 'command',
      isOffTopic: false,
    }
  }

  if (cmd === 'search' && arg) {
    const results = await searchFaq(arg, 5)
    if (results.length === 0) {
      return {
        text: `🔍 По запросу «${arg}» ничего не найдено. Попробуйте переформулировать или задайте вопрос словами.`,
        source: 'command',
        isOffTopic: false,
      }
    }
    return {
      text: `🔍 Результаты по «${arg}»:\n\n${results
        .map((r, i) => `${i + 1}. ${r.question}`)
        .join('\n')}\n\nВыберите вопрос:`,
      source: 'command',
      isOffTopic: false,
      inlineKeyboard: results.map((r) => [
        { text: truncate(r.question, 60), payload: `show:${r.faqItemId}` },
      ]),
    }
  }

  if (cmd === 'show' && arg) {
    const faq = await db.faqItem.findUnique({ where: { id: arg } })
    if (!faq) {
      return {
        text: `❌ Ответ с ID ${arg} не найден.`,
        source: 'command',
        isOffTopic: false,
      }
    }
    return {
      text: formatFaqAnswer({
        faqItemId: faq.id,
        question: faq.question,
        answer: faq.answer,
        score: 0,
      }),
      source: 'faq',
      faqItemId: faq.id,
      isOffTopic: false,
      inlineKeyboard: [
        [
          { text: '👍 Полезно', payload: `feedback:${faq.id}:1` },
          { text: '👎 Не помогло', payload: `feedback:${faq.id}:-1` },
        ],
      ],
    }
  }

  // Default: возвращаем response команды
  return {
    text: command.response,
    source: 'command',
    isOffTopic: false,
  }
}

// --- Callbacks (inline button clicks) ---

/**
 * Парсит payload формата "key:value1:value2" с защитой от двоеточий в значениях.
 * Возвращает [key, rest].
 */
function parsePayload(payload: string): { key: string; rest: string } {
  const idx = payload.indexOf(':')
  if (idx === -1) return { key: payload, rest: '' }
  return { key: payload.slice(0, idx), rest: payload.slice(idx + 1) }
}

export async function handleCallback(
  payload: string,
  msg: IncomingMessage,
): Promise<OutgoingReply> {
  const user = await upsertUser(msg)
  const { key, rest } = parsePayload(payload)

  // feedback:<faqId>:<1|-1>
  if (key === 'feedback') {
    const [faqId, ratingStr] = rest.split(':')
    const rating = Number(ratingStr)
    if (faqId && (rating === 1 || rating === -1)) {
      try {
        await db.faqFeedback.create({
          data: { faqItemId: faqId, maxUserId: user.id, rating },
        })
        // обновляем только последний исходящий лог с этим faqItemId
        const lastLog = await db.messageLog.findFirst({
          where: { faqItemId: faqId, maxUserId: user.id, direction: 'out' },
          orderBy: { createdAt: 'desc' },
        })
        if (lastLog) {
          await db.messageLog.update({
            where: { id: lastLog.id },
            data: { rating },
          })
        }
      } catch (e) {
        // ignore duplicate feedback
      }
      return {
        text:
          rating === 1
            ? '💚 Спасибо за оценку!'
            : '🙏 Спасибо, постараемся улучшить ответ.',
        source: 'callback',
        isOffTopic: false,
      }
    }
  }

  // category:<slug>
  if (key === 'category') {
    const slug = rest
    const category = await db.category.findUnique({ where: { slug } })
    if (!category) {
      return { text: 'Категория не найдена', source: 'callback', isOffTopic: false }
    }
    const faqs = await db.faqItem.findMany({
      where: { categoryId: category.id, isPublished: true },
      orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }],
      take: 20,
    })
    if (faqs.length === 0) {
      return {
        text: `${category.emoji || ''} ${category.name}\n\nВ этой категории пока нет вопросов.`,
        source: 'callback',
        isOffTopic: false,
      }
    }
    return {
      text: `${category.emoji || ''} ${category.name} — выберите вопрос:`,
      source: 'callback',
      isOffTopic: false,
      inlineKeyboard: faqs.map((f) => [
        { text: truncate(f.question, 60), payload: `show:${f.id}` },
      ]),
    }
  }

  // show:<faqId>
  if (key === 'show') {
    const faqId = rest
    const faq = await db.faqItem.findUnique({ where: { id: faqId } })
    if (!faq) {
      return { text: '❌ Ответ не найден', source: 'callback', isOffTopic: false }
    }
    await logMessage({
      maxUserId: user.id,
      direction: 'out',
      text: faq.answer,
      source: 'faq',
      faqItemId: faq.id,
    })
    return {
      text: formatFaqAnswer({
        faqItemId: faq.id,
        question: faq.question,
        answer: faq.answer,
        score: 0,
      }),
      source: 'faq',
      faqItemId: faq.id,
      isOffTopic: false,
      inlineKeyboard: [
        [
          { text: '👍 Полезно', payload: `feedback:${faq.id}:1` },
          { text: '👎 Не помогло', payload: `feedback:${faq.id}:-1` },
        ],
      ],
    }
  }

  // menu — показать категории курсов (как при команде /menu)
  if (payload === 'menu') {
    const categories = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return {
      text: '📂 Выберите направление курса:',
      source: 'callback',
      isOffTopic: false,
      inlineKeyboard: categories.map((c) => [
        { text: `${c.emoji || '📁'} ${c.name}`, payload: `category:${c.slug}` },
      ]),
    }
  }

  // more:<text> — показать больше вариантов
  if (key === 'more') {
    const query = rest
    const results = await searchFaq(query, 8)
    if (results.length === 0) {
      return {
        text: '🔍 Больше ничего не найдено. Напишите свой вопрос словами или используйте /search.',
        source: 'callback',
        isOffTopic: false,
      }
    }
    return {
      text: `🔍 Ещё варианты по «${query}»:`,
      source: 'callback',
      isOffTopic: false,
      inlineKeyboard: results.map((r) => [
        { text: truncate(r.question, 60), payload: `show:${r.faqItemId}` },
      ]),
    }
  }

  return { text: 'Неизвестная команда', source: 'callback', isOffTopic: false }
}
