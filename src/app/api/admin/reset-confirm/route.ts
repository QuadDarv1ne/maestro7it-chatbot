import { NextRequest, NextResponse } from 'next/server'
import { resetPasswordWithToken, verifyResetToken } from '@/lib/auth'

/**
 * GET /api/admin/reset-confirm?token=...
 * Проверяет валидность токена (без сброса пароля).
 *
 * POST /api/admin/reset-confirm
 * Body: { token, newPassword }
 * Сбрасывает пароль.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') || ''

  const result = await verifyResetToken(token)
  if (!result.valid) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    )
  }

  return NextResponse.json({
    ok: true,
    email: result.email,
  })
}

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json().catch(() => ({}))

  if (!token || !newPassword) {
    return NextResponse.json(
      { ok: false, error: 'Токен и новый пароль обязательны' },
      { status: 400 },
    )
  }

  const result = await resetPasswordWithToken(String(token), String(newPassword))
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true })
}
