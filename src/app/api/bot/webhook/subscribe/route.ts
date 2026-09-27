import { NextRequest, NextResponse } from 'next/server'
import { subscribeWebhook } from '@/lib/max-api'
import { requireAdmin, logAdminAction, badRequest } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { url } = await req.json().catch(() => ({}))
  if (!url) return badRequest('Нужен URL вебхука')

  try {
    const result = await subscribeWebhook(url)
    await db.botSetting.upsert({
      where: { key: 'webhookUrl' },
      update: { value: url },
      create: { key: 'webhookUrl', value: url },
    })
    await db.botSetting.upsert({
      where: { key: 'webhookSubscribed' },
      update: { value: 'true' },
      create: { key: 'webhookSubscribed', value: 'true' },
    })
    await logAdminAction('bot.webhook.subscribe', 'BotSetting', undefined, `URL: ${url}`)
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
