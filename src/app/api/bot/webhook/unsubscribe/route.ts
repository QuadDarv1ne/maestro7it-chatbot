import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeWebhook } from '@/lib/max-api'
import { requireAdmin, logAdminAction, badRequest } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { url } = await req.json().catch(() => ({}))
  const targetUrl = url || (await db.botSetting.findUnique({ where: { key: 'webhookUrl' } }))?.value
  if (!targetUrl) return badRequest('Нужен URL вебхука')

  try {
    const result = await unsubscribeWebhook(targetUrl)
    await db.botSetting.upsert({
      where: { key: 'webhookSubscribed' },
      update: { value: 'false' },
      create: { key: 'webhookSubscribed', value: 'false' },
    })
    await logAdminAction('bot.webhook.unsubscribe', 'BotSetting', undefined, `URL: ${targetUrl}`)
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
