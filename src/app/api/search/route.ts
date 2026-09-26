import { NextRequest, NextResponse } from 'next/server'
import { globalSearch } from '@/lib/search'
import { requireAdmin, badRequest } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  if (!q.trim()) return badRequest('Введите запрос')

  const results = await globalSearch(q, 30)
  return NextResponse.json({ ok: true, results, query: q })
}
