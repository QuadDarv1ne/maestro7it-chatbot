import { NextResponse } from 'next/server'
import { checkBot } from '@/lib/max-api'
import { requireAdmin } from '@/lib/api-helpers'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const result = await checkBot()
  return NextResponse.json(result)
}
