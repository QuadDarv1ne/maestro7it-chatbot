import { NextRequest, NextResponse } from 'next/server'
import { login, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  if (!password) {
    return NextResponse.json({ ok: false, error: 'Введите пароль' }, { status: 400 })
  }

  const result = await login(password)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 401 })
  }

  await setSessionCookie(result.token!)
  return NextResponse.json({ ok: true })
}
