import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session.valid) {
    return NextResponse.json({ authenticated: false })
  }

  let account: { id: string; email: string; name: string | null; role: string; lastLoginAt: Date | null } | null = null
  if (session.accountId) {
    account = await db.adminAccount.findUnique({
      where: { id: session.accountId },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
    })
  }

  return NextResponse.json({
    authenticated: true,
    account,
  })
}
