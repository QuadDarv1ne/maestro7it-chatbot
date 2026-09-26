import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, logAdminAction, badRequest } from '@/lib/api-helpers'
import { invalidateTokenCache } from '@/lib/max-api'

// Whitelist разрешённых ключей и их валидаторы
const ALLOWED_KEYS = new Set([
  'MAX_BOT_TOKEN',
  'welcomeText',
  'noAnswerText',
  'offtopicText',
  'useLlmFallback',
  'botName',
  'webhookUrl',
  'webhookSubscribed',
])

const BOOL_KEYS = new Set(['useLlmFallback', 'webhookSubscribed'])

export async function GET() {
  const settings = await db.botSetting.findMany()
  const obj: Record<string, string> = {}
  for (const s of settings) obj[s.key] = s.value
  // скрываем токен
  const hasToken = !!obj['MAX_BOT_TOKEN']
  return NextResponse.json({
    ok: true,
    settings: { ...obj, MAX_BOT_TOKEN: hasToken ? '***' : '' },
  })
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const { settings } = body as { settings: Record<string, string> }
  if (!settings || typeof settings !== 'object') {
    return badRequest('Нужен объект settings')
  }

  const updated: string[] = []
  const skipped: string[] = []

  for (const [key, rawValue] of Object.entries(settings)) {
    // whitelist
    if (!ALLOWED_KEYS.has(key)) {
      skipped.push(key)
      continue
    }

    let value = String(rawValue ?? '').slice(0, 4000)

    // bool keys — нормализуем
    if (BOOL_KEYS.has(key)) {
      value = value === 'true' ? 'true' : 'false'
    }

    // не даём перезаписать токен пустым или маской
    if (key === 'MAX_BOT_TOKEN' && (!value || value === '***')) {
      skipped.push(key)
      continue
    }

    // URL-валидация для webhookUrl
    if (key === 'webhookUrl' && value && !value.startsWith('https://')) {
      skipped.push(key)
      continue
    }

    await db.botSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    updated.push(key)

    // Если обновили токен — инвалидируем кеш
    if (key === 'MAX_BOT_TOKEN') {
      invalidateTokenCache()
    }
  }

  if (updated.length > 0) {
    await logAdminAction(
      'settings.update',
      'BotSetting',
      null,
      `Обновлены: ${updated.join(', ')}${skipped.length ? ` (пропущены: ${skipped.join(', ')})` : ''}`,
    )
  }

  return NextResponse.json({ ok: true, updated, skipped })
}
