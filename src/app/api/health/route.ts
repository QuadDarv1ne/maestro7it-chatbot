import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isEmailConfigured } from '@/lib/email'

/**
 * Health check endpoint с детальной информацией.
 *
 * Возвращает:
 *  - status: ok | degraded | error
 *  - service info
 *  - db connection status
 *  - bot token configured
 *  - email (SMTP) configured
 *  - counts: faq, categories, sessions, accounts
 *  - latency
 *
 * Не требует авторизации — безопасная информация для monitoring.
 */
export async function GET() {
  const start = Date.now()
  const checks: Record<string, any> = {}

  // DB check
  try {
    const [faqCount, categoryCount, accountCount, sessionCount] = await Promise.all([
      db.faqItem.count(),
      db.category.count(),
      db.adminAccount.count(),
      db.adminSession.count({ where: { expiresAt: { gt: new Date() } } }),
    ])
    checks.db = { ok: true, faqCount, categoryCount, accountCount, activeSessions: sessionCount }
  } catch (e: any) {
    checks.db = { ok: false, error: e?.message }
  }

  // Bot token
  let botTokenConfigured = false
  try {
    const row = await db.botSetting.findUnique({ where: { key: 'MAX_BOT_TOKEN' } })
    botTokenConfigured = !!row?.value
  } catch {}
  checks.bot = { tokenConfigured: botTokenConfigured }

  // Email
  checks.email = { smtpConfigured: isEmailConfigured() }

  // Webhook secret
  checks.webhook = { signatureVerification: !!process.env.WEBHOOK_SECRET }

  const latencyMs = Date.now() - start
  const allOk = checks.db?.ok === true
  const status = allOk ? 'ok' : 'degraded'

  return NextResponse.json({
    status,
    service: 'maestro7it-bot',
    version: process.env.npm_package_version || 'unknown',
    time: new Date().toISOString(),
    uptime: process.uptime ? Math.round(process.uptime()) : null,
    latencyMs,
    checks,
  }, {
    status: allOk ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
