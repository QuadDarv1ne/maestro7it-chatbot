import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/api-helpers'

/**
 * Real-time log stream через Server-Sent Events (SSE).
 * Админ-панель подписывается и получает новые логи в реальном времени.
 *
 * Polling каждые 2 сек, heartbeat каждые 25 сек.
 * Корректно отслеживает disconnect клиента.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let lastCreatedAt: Date | null = null
      let closed = false

      const send = (data: any) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      // heartbeat каждые 25 сек — держит соединение живым
      const heartbeat = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`))
        } catch {
          closed = true
        }
      }, 25000)

      // poll каждые 2 сек
      const poll = setInterval(async () => {
        if (closed) return
        try {
          const items = await db.messageLog.findMany({
            where: lastCreatedAt ? { createdAt: { gt: lastCreatedAt } } : {},
            orderBy: { createdAt: 'asc' },
            take: 50,
            include: { user: true },
          })
          if (items.length > 0) {
            for (const it of items) {
              send(it)
              lastCreatedAt = it.createdAt
            }
          }
        } catch (e) {
          console.error('[sse] poll error:', e)
        }
      }, 2000)

      // первичная загрузка — последние 20
      try {
        const initial = await db.messageLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: true },
        })
        // отправляем в хронологическом порядке (старые → новые)
        for (const it of initial.reverse()) {
          send(it)
        }
        if (initial.length > 0) {
          lastCreatedAt = initial[0].createdAt // самый свежий
        }
      } catch (e) {
        console.error('[sse] initial load error:', e)
      }

      // detect client disconnect
      const onAbort = () => {
        closed = true
        clearInterval(heartbeat)
        clearInterval(poll)
        try {
          controller.close()
        } catch {}
      }
      req.signal.addEventListener('abort', onAbort)

      // Safety: auto-close after 1 hour
      setTimeout(onAbort, 60 * 60 * 1000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  })
}
