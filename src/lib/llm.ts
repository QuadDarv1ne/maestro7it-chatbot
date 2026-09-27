/**
 * LLM fallback через z-ai-web-dev-sdk.
 * Используется ТОЛЬКО на сервере (server-side).
 *
 * Если в базе знаний нет ответа, но вопрос относится к Maestro7IT,
 * подключается LLM для генерации ответа по контексту школы.
 */

import ZAI from 'z-ai-web-dev-sdk'

const SYSTEM_PROMPT = `Ты — консультант чат-бота школы программирования Maestro7IT (https://school-maestro7it.ru).

Школа основана Дуплеем Максимом Игоревичем. В коллекции 23 курса по 7 направлениям:
- DevOps: Linux, Docker, мониторинг
- Безопасность: кибербезопасность, тестирование ПО
- Базы данных: SQL, Redis, ClickHouse, MongoDB
- Аналитика и AI: Power BI, нейросети и n8n
- Программирование: JavaScript, PHP, Ассемблер, Go, C#, React
- Мультимедиа: видеомонтаж, мастеринг звука, саунд-дизайн, Blender
- Академическое: научные статьи, курсовые и дипломные работы

Контакты школы:
- MAX: https://max.ru/u/f9LHodD0cOLxcVXpSMqTSZLCFG_q6uz0QRQKOhGSBc5RIx4h-KYqVRvzW3k
- Telegram: @quadd4rv1n7 (https://t.me/quadd4rv1n7)
- WhatsApp: +7 915 048-02-49 (https://wa.me/79150480249)
- Email: info@maestro7it.ru
- Сайт: https://school-maestro7it.ru
- Платформа курсов: Stepik

Твои правила:
1. Отвечай ТОЛЬКО на вопросы, связанные с курсами, обучением, программированием, ИТ-карьерой, школой Maestro7IT.
2. Если вопрос СОВСЕМ не по теме (политика, медицина, личное, спам) — коротко ответь: "Извините, я отвечаю только на вопросы о курсах Maestro7IT."
3. Отвечай кратко, по-русски, дружелюбно. Не более 3-4 предложений.
4. ВАЖНО: упоминай ТОЛЬКО курсы из списка выше. Если спрашивают про курс, которого нет в списке (например Python, Java, Rust) — честно скажи, что такого курса пока нет, и предложи ближайшую альтернативу из списка выше. Это считается вопросом ПО ТЕМЕ (про обучение), не off-topic.
5. Не выдумывай цены, расписание, условия записи, сертификаты или другие детали, которых нет в контексте выше.
6. Не пиши markdown-разметку (звёздочки, решётки) — используй обычный текст с переносами строк.
7. Если уместно — направляй на сайт https://school-maestro7it.ru для деталей.`

export interface LlmResult {
  text: string
  isOnTopic: boolean
}

const OFF_TOPIC_MARKERS = [
  'отвечаю только',
  'не по теме',
  'только на вопросы о курсах',
  'извините, я отвечаю',
]

const MAX_RETRIES = 1

/**
 * Сгенерировать ответ через LLM с retry и таймаутом.
 */
export async function generateLlmResponse(userQuestion: string): Promise<LlmResult> {
  if (!userQuestion.trim()) {
    return {
      text: 'Пожалуйста, задайте ваш вопрос словами.',
      isOnTopic: false,
    }
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userQuestion.slice(0, 2000) },
        ],
        temperature: 0.4,
        max_tokens: 600,
      })

      const text = completion.choices?.[0]?.message?.content?.trim() || ''
      if (!text) {
        throw new Error('LLM вернул пустой ответ')
      }

      const isOffTopic = OFF_TOPIC_MARKERS.some((m) => text.toLowerCase().includes(m))
      return { text, isOnTopic: !isOffTopic }
    } catch (e: any) {
      lastError = e
      console.error(`[llm] attempt ${attempt + 1} failed:`, e?.message || e)
      // exponential backoff
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
      }
    }
  }

  console.error('[llm] all attempts failed:', lastError?.message)
  return {
    text:
      'Извините, не удалось сгенерировать ответ. Попробуйте позже или используйте /menu для просмотра курсов.',
    isOnTopic: false,
  }
}
