import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const start = Date.now()
  try {
    await db.botSetting.count()
    const settings = await db.botSetting.findUnique({ where: { key: 'MAX_BOT_TOKEN' } })
    return NextResponse.json({
      status: 'ok',
      service: 'maestro7it-bot',
      time: new Date().toISOString(),
      db: 'ok',
      botTokenConfigured: !!settings?.value,
      latencyMs: Date.now() - start,
    })
  } catch (e: any) {
    return NextResponse.json(
      { status: 'error', error: e?.message || String(e), latencyMs: Date.now() - start },
      { status: 500 },
    )
  }
}
