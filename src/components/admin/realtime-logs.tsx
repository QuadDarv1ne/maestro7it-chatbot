'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollText, Play, Pause, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api-client'

const SOURCE_LABELS: Record<string, string> = {
  faq: 'FAQ', llm: 'LLM', command: 'Команда', callback: 'Callback',
  broadcast: 'Рассылка', offtopic: 'Off-topic', unknown: 'Без ответа', user: 'Входящее',
}

interface LogItem {
  id: string
  direction: string
  source: string
  text: string
  isOffTopic: boolean
  rating: number | null
  createdAt: string
  user?: { firstName?: string; username?: string; maxUserId: string } | null
}

export function RealtimeLogs() {
  const [items, setItems] = useState<LogItem[]>([])
  const [connected, setConnected] = useState(false)
  const [paused, setPaused] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pausedRef = useRef(false)

  useEffect(() => { pausedRef.current = paused }, [paused])

  useEffect(() => {
    const es = new EventSource(api.logsStreamUrl())
    eventSourceRef.current = es

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)
    es.onmessage = (ev) => {
      if (pausedRef.current) return
      try {
        const data = JSON.parse(ev.data) as LogItem
        setItems((prev) => [data, ...prev].slice(0, 200))
      } catch {}
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Real-time логи</h1>
          <p className="text-sm text-muted-foreground">
            Поток сообщений в реальном времени через SSE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-muted-foreground">{connected ? 'Подключено' : 'Отключено'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPaused(!paused)}>
            {paused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
            {paused ? 'Продолжить' : 'Пауза'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setItems([])}>
            Очистить
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {connected ? <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-50" /> : <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />}
            <div className="text-sm">
              {connected ? 'Ожидание новых сообщений…' : 'Подключение…'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
          {items.map((l) => (
            <Card key={l.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {l.direction === 'in' ? (
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                    ) : (
                      <ArrowLeft className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {SOURCE_LABELS[l.source] || l.source}
                      </Badge>
                      {l.isOffTopic && <Badge variant="destructive" className="text-[10px]">off-topic</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(l.createdAt).toLocaleTimeString('ru-RU')}
                      </span>
                      {l.user && (
                        <span className="text-xs text-muted-foreground">
                          {l.user.firstName || l.user.username || l.user.maxUserId}
                        </span>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-line break-words">{l.text}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
