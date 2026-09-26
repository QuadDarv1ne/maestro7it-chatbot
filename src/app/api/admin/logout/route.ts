import { NextResponse } from 'next/server'
import { logout, clearSessionCookie, getSession } from '@/lib/auth'

export async function POST() {
  const session = await getSession()
  if (session.token) logout(session.token)
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
