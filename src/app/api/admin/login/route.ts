import { NextRequest, NextResponse } from 'next/server'
import { login, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password, remember } = await req.json().catch(() => ({}))

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: 'Введите email и пароль' },
      { status: 400 },
    )
  }

  const result = await login(String(email), String(password), !!remember)

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 401 },
    )
  }

  await setSessionCookie(result.token!, result.remember)
  return NextResponse.json({ ok: true })
}
