import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, badRequest } from '@/lib/api-helpers'

export async function GET() {
  const commands = await db.botCommand.findMany({ orderBy: { command: 'asc' } })
  return NextResponse.json({ ok: true, commands })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { command, description, response } = await req.json().catch(() => ({}))
  if (!command || !response) return badRequest('Нужны command и response')

  const created = await db.botCommand.create({
    data: { command: command.replace(/^\//, ''), description: description || '', response },
  })
  return NextResponse.json({ ok: true, command: created })
}
