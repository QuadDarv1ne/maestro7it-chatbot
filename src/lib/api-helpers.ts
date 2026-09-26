/**
 * Server-side helpers for admin API routes.
 */
import { getSession } from './auth'
import { NextResponse } from 'next/server'
import { db } from './db'

export async function requireAdmin() {
  const session = await getSession()
  if (!session.valid) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }),
    }
  }
  return { ok: true as const }
}

export async function logAdminAction(action: string, entity?: string, entityId?: string, details?: string) {
  return db.adminActionLog.create({
    data: { action, entity, entityId, details: details?.slice(0, 2000) },
  })
}

export function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 })
}

export function notFound(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 404 })
}
