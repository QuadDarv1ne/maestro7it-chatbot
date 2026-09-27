import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, logAdminAction, badRequest, notFound } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'

/**
 * Проверяет что текущий юзер — super_admin.
 * Возвращает currentAccount или null.
 */
async function requireSuperAdmin() {
  const session = await getSession()
  if (!session.valid) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }),
    }
  }
  const currentAccount = session.accountId
    ? await db.adminAccount.findUnique({ where: { id: session.accountId } })
    : null
  if (!currentAccount || currentAccount.role !== 'super_admin') {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: 'Недостаточно прав. Требуется super_admin.' },
        { status: 403 },
      ),
    }
  }
  return { ok: true as const, currentAccount }
}

/**
 * PUT /api/admin/accounts/[id]
 * Обновление аккаунта (role, isActive, name).
 * Body: { role?, isActive?, name? }
 *
 * Защита: нельзя удалить себя, нельзя снять с себя super_admin.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const target = await db.adminAccount.findUnique({ where: { id } })
  if (!target) return notFound('Аккаунт не найден')

  const updates: any = {}

  if (body.name !== undefined) {
    updates.name = String(body.name).trim() || null
  }

  if (body.role !== undefined) {
    const newRole = body.role === 'super_admin' ? 'super_admin' : 'admin'
    // Нельзя снять с себя super_admin
    if (target.id === guard.currentAccount.id && newRole !== 'super_admin') {
      return badRequest('Нельзя снять с себя роль super_admin')
    }
    updates.role = newRole
  }

  if (body.isActive !== undefined) {
    // Нельзя деактивировать себя
    if (target.id === guard.currentAccount.id && body.isActive === false) {
      return badRequest('Нельзя деактивировать свой собственный аккаунт')
    }
    updates.isActive = !!body.isActive
  }

  const updated = await db.adminAccount.update({
    where: { id },
    data: updates,
    select: {
      id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true,
    },
  })

  await logAdminAction(
    'admin.account.update',
    'AdminAccount',
    id,
    `Обновлён аккаунт ${target.email}: ${Object.keys(updates).join(', ')}`,
  )

  return NextResponse.json({ ok: true, account: updated })
}

/**
 * DELETE /api/admin/accounts/[id]
 * Удаление аккаунта.
 * Защита: нельзя удалить себя.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const target = await db.adminAccount.findUnique({ where: { id } })
  if (!target) return notFound('Аккаунт не найден')

  // Нельзя удалить себя
  if (target.id === guard.currentAccount.id) {
    return badRequest('Нельзя удалить свой собственный аккаунт')
  }

  // Удаляем сессии этого аккаунта тоже (каскад)
  await db.adminAccount.delete({ where: { id } })

  await logAdminAction(
    'admin.account.delete',
    'AdminAccount',
    id,
    `Удалён аккаунт ${target.email}`,
  )

  return NextResponse.json({ ok: true })
}
