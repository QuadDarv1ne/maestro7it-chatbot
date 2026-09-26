'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollText, Search, Download, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

const SOURCE_LABELS: Record<string, string> = {
  faq: 'FAQ',
  llm: 'LLM',
  command: 'Команда',
  callback: 'Callback',
  broadcast: 'Рассылка',
  offtopic: 'Off-topic',
  unknown: 'Без ответа',
  user: 'Входящее',
}

const SOURCE_COLORS: Record<string, string> = {
  faq: 'default',
  llm: 'secondary',
  command: 'secondary',
  callback: 'outline',
  broadcast: 'outline',
  offtopic: 'destructive',
  unknown: 'destructive',
  user: 'secondary',
}

export function LogManager() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(50)
  const [source, setSource] = useState('all')
  const [direction, setDirection] = useState('all')
  const [offTopic, setOffTopic] = useState('all')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        limit: String(limit),
        offset: String(offset),
      }
      if (source !== 'all') params.source = source
      if (direction !== 'all') params.direction = direction
      if (offTopic !== 'all') params.offTopic = offTopic
      if (search) params.q = search
      const res = await api.listLogs(params)
      setItems(res.items)
      setTotal(res.total)
    } catch (e: any) {
      toast.error('Ошибка загрузки', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [offset, source, direction, offTopic])

  function applySearch() {
    setOffset(0)
    load()
  }

  function exportCsv() {
    const params: Record<string, string> = {}
    if (source !== 'all') params.source = source
    if (direction !== 'all') params.direction = direction
    if (offTopic !== 'all') params.offTopic = offTopic
    if (search) params.q = search
    const url = api.exportLogsUrl(params)
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Логи обращений</h1>
          <p className="text-sm text-muted-foreground">Всего: {total}</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-2" /> Экспорт CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по тексту…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                className="pl-8"
              />
            </div>
            <Select value={source} onValueChange={(v) => { setSource(v); setOffset(0) }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Источник" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все источники</SelectItem>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={direction} onValueChange={(v) => { setDirection(v); setOffset(0) }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Направление" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="in">Входящие</SelectItem>
                <SelectItem value="out">Исходящие</SelectItem>
              </SelectContent>
            </Select>
            <Select value={offTopic} onValueChange={(v) => { setOffTopic(v); setOffset(0) }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все темы</SelectItem>
                <SelectItem value="1">Off-topic</SelectItem>
                <SelectItem value="0">По теме</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Нет логов</div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
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
                        <Badge variant={SOURCE_COLORS[l.source] as any || 'outline'} className="text-[10px]">
                          {SOURCE_LABELS[l.source] || l.source}
                        </Badge>
                        {l.isOffTopic && <Badge variant="destructive" className="text-[10px]">off-topic</Badge>}
                        {l.rating === 1 && <Badge variant="outline" className="text-[10px]">👍</Badge>}
                        {l.rating === -1 && <Badge variant="outline" className="text-[10px]">👎</Badge>}
                        <span className="text-xs text-muted-foreground">
                          {new Date(l.createdAt).toLocaleString('ru-RU')}
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

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Показаны {offset + 1}–{Math.min(offset + items.length, total)} из {total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                ← Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + items.length >= total}
                onClick={() => setOffset(offset + limit)}
              >
                Вперёд →
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
