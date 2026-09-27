import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, logAdminAction, badRequest } from '@/lib/api-helpers'
import { hashPassword, validateEmail, validatePasswordStrength } from '@/lib/password'
import { getSession } from '@/lib/auth'

/**
 * GET /api/admin/accounts
 * Список администраторов (только для super_admin).
 */
export async function GET() {
  const session = await getSession()
  if (!session.valid) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  // Проверяем что текущий юзер — super_admin
  const currentAccount = session.accountId
    ? await db.adminAccount.findUnique({ where: { id: session.accountId } })
    : null

  if (!currentAccount || currentAccount.role !== 'super_admin') {
    return NextResponse.json(
      { ok: false, error: 'Недостаточно прав. Требуется super_admin.' },
      { status: 403 },
    )
  }

  const accounts = await db.adminAccount.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ ok: true, accounts, currentAccountId: currentAccount.id })
}

/**
 * POST /api/admin/accounts
 * Создание нового администратора (только super_admin).
 * Body: { email, password, name, role }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.valid) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const currentAccount = session.accountId
    ? await db.adminAccount.findUnique({ where: { id: session.accountId } })
    : null

  if (!currentAccount || currentAccount.role !== 'super_admin') {
    return NextResponse.json(
      { ok: false, error: 'Недостаточно прав. Требуется super_admin.' },
      { status: 403 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const name = String(body.name || '').trim() || null
  const role = body.role === 'super_admin' ? 'super_admin' : 'admin'

  if (!validateEmail(email)) {
    return badRequest('Некорректный email')
  }

  const strength = validatePasswordStrength(password)
  if (!strength.ok) {
    return badRequest(strength.error || 'Слабый пароль')
  }

  // Проверка уникальности email
  const existing = await db.adminAccount.findUnique({ where: { email } })
  if (existing) {
    return badRequest('Аккаунт с таким email уже существует')
  }

  const account = await db.adminAccount.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      name,
      role,
      isActive: true,
    },
    select: {
      id: true, email: true, name: true, role: true, isActive: true, createdAt: true,
    },
  })

  await logAdminAction(
    'admin.account.create',
    'AdminAccount',
    account.id,
    `Создан аккаунт ${email} (role: ${role})`,
  )

  return NextResponse.json({ ok: true, account })
}
