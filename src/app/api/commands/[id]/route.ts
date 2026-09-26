import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, notFound, badRequest } from '@/lib/api-helpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const command = await db.botCommand.findUnique({ where: { id } })
  if (!command) return notFound('Команда не найдена')

  const updated = await db.botCommand.update({
    where: { id },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.response !== undefined && { response: body.response }),
      ...(body.isEnabled !== undefined && { isEnabled: !!body.isEnabled }),
    },
  })
  return NextResponse.json({ ok: true, command: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const command = await db.botCommand.findUnique({ where: { id } })
  if (!command) return notFound('Команда не найдена')
  // защищаем от удаления системных команд
  if (['start', 'help', 'menu'].includes(command.command)) {
    return badRequest('Нельзя удалить системную команду')
  }
  await db.botCommand.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
