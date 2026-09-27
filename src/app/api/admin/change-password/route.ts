import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/password'
import { logAdminAction, badRequest } from '@/lib/api-helpers'

/**
 * POST /api/admin/change-password
 * Body: { currentPassword, newPassword }
 *
 * Меняет пароль текущего авторизованного пользователя.
 * Требует подтверждения старым паролем.
 * После смены — инвалидация всех других сессий этого аккаунта.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.valid || !session.accountId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const currentPassword = String(body.currentPassword || '')
  const newPassword = String(body.newPassword || '')

  if (!currentPassword || !newPassword) {
    return badRequest('Введите текущий и новый пароль')
  }

  const account = await db.adminAccount.findUnique({
    where: { id: session.accountId },
  })
  if (!account) {
    return NextResponse.json({ ok: false, error: 'Аккаунт не найден' }, { status: 404 })
  }

  // Проверка текущего пароля
  if (!verifyPassword(currentPassword, account.passwordHash)) {
    return badRequest('Неверный текущий пароль')
  }

  // Проверка силы нового пароля
  const strength = validatePasswordStrength(newPassword)
  if (!strength.ok) {
    return badRequest(strength.error || 'Слабый пароль')
  }

  // Не даём установить тот же пароль
  if (currentPassword === newPassword) {
    return badRequest('Новый пароль не должен совпадать с текущим')
  }

  // Обновляем пароль
  await db.adminAccount.update({
    where: { id: account.id },
    data: { passwordHash: hashPassword(newPassword) },
  })

  // Инвалидируем все сессии КРОМЕ текущей
  await db.adminSession.deleteMany({
    where: {
      accountId: account.id,
      NOT: { token: session.token },
    },
  }).catch(() => {})

  await logAdminAction(
    'admin.password.change',
    'AdminAccount',
    account.id,
    `Смена пароля аккаунтом ${account.email}`,
  )

  return NextResponse.json({ ok: true })
}
