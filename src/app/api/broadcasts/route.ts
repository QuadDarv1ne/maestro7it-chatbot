import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, badRequest } from '@/lib/api-helpers'
import { sendText } from '@/lib/max-api'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const broadcasts = await db.broadcast.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { _count: { select: { recipients: true } } },
  })
  return NextResponse.json({ ok: true, broadcasts })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const text = (body.text || '').toString().trim()
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null

  if (!text) return badRequest('Введите текст рассылки')
  if (text.length > 4000) return badRequest('Текст рассылки слишком длинный (макс. 4000 символов)')

  // Проверка даты — не в прошлом
  if (scheduledAt && scheduledAt.getTime() < Date.now()) {
    return badRequest('Дата рассылки не может быть в прошлом')
  }

  const broadcast = await db.broadcast.create({
    data: {
      text,
      status: 'pending',
      scheduledAt,
    },
  })

  // Если не отложена — отправляем сразу
  if (!scheduledAt) {
    setImmediate(() => sendBroadcast(broadcast.id))
  }

  return NextResponse.json({ ok: true, broadcast })
}

/**
 * Асинхронная отправка рассылки всем пользователям.
 * - Не делает N+1 запросов (текст читается 1 раз)
 * - Лимит 100 msg/sec через throttle
 * - При общей ошибке помечает оставшихся recipients как failed
 * - Безопасно прерывается при ошибке MAX API (например, токен невалиден)
 */
async function sendBroadcast(broadcastId: string) {
  try {
    const broadcast = await db.broadcast.findUnique({ where: { id: broadcastId } })
    if (!broadcast) {
      console.error(`[broadcast:${broadcastId}] not found`)
      return
    }

    await db.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'sending' },
    })

    const users = await db.maxUser.findMany({
      where: { isBlocked: false },
      select: { id: true, maxUserId: true },
    })

    if (users.length === 0) {
      await db.broadcast.update({
        where: { id: broadcastId },
        data: { status: 'done', sentAt: new Date(), recipientCount: 0 },
      })
      console.log(`[broadcast:${broadcastId}] no recipients`)
      return
    }

    let sent = 0
    let failed = 0
    const text = broadcast.text // читаем 1 раз

    for (const user of users) {
      try {
        await sendText(user.maxUserId, text)
        await db.broadcastRecipient.create({
          data: { broadcastId, maxUserId: user.id, status: 'sent', sentAt: new Date() },
        })
        sent++
      } catch (e: any) {
        await db.broadcastRecipient.create({
          data: {
            broadcastId,
            maxUserId: user.id,
            status: 'failed',
            error: (e?.message || String(e)).slice(0, 500),
          },
        }).catch(() => {}) // ignore duplicate errors
        failed++

        // Если ошибка — невалидный токен, прерываем отправку
        if (/MAX_BOT_TOKEN|invalid.token|unauthorized/i.test(e?.message || '')) {
          console.error(`[broadcast:${broadcastId}] auth error, aborting:`, e?.message)
          await db.broadcast.update({
            where: { id: broadcastId },
            data: { status: 'failed' },
          })
          // помечаем оставшихся как failed
          await db.broadcastRecipient.createMany({
            data: users
              .slice(users.indexOf(user) + 1)
              .map((u) => ({
                broadcastId,
                maxUserId: u.id,
                status: 'failed',
                error: 'Прервано: ошибка авторизации MAX API',
              })),
          }).catch(() => {})
          return
        }
      }
      // мягкий throttle: 10 msg/sec
      await new Promise((r) => setTimeout(r, 100))
    }

    await db.broadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'done',
        sentAt: new Date(),
        recipientCount: sent,
      },
    })
    console.log(`[broadcast:${broadcastId}] sent=${sent} failed=${failed}`)
  } catch (e: any) {
    console.error(`[broadcast:${broadcastId}] error:`, e?.message)
    await db.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'failed' },
    }).catch(() => {})
  }
}
