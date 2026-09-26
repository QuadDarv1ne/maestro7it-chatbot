'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Megaphone, Loader2, Send, Trash2, Eye, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

const STATUS_BADGES: Record<string, { label: string; variant: any; icon: any }> = {
  pending: { label: 'Ожидает', variant: 'outline', icon: Clock },
  sending: { label: 'Отправляется', variant: 'secondary', icon: Loader2 },
  done: { label: 'Отправлено', variant: 'default', icon: CheckCircle2 },
  failed: { label: 'Ошибка', variant: 'destructive', icon: XCircle },
}

export function BroadcastsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [sending, setSending] = useState(false)
  const [viewing, setViewing] = useState<any | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await api.listBroadcasts()
      setItems(res.broadcasts)
    } catch (e: any) {
      toast.error('Ошибка загрузки', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSend() {
    if (!text.trim()) {
      toast.error('Введите текст рассылки')
      return
    }
    setSending(true)
    try {
      await api.createBroadcast(text, scheduledAt || undefined)
      toast.success(scheduledAt ? 'Рассылка запланирована' : 'Рассылка отправляется')
      setText('')
      setScheduledAt('')
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить рассылку?')) return
    try {
      await api.deleteBroadcast(id)
      toast.success('Рассылка удалена')
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  async function viewItem(id: string) {
    try {
      const res = await api.getBroadcast(id)
      setViewing(res.broadcast)
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Рассылки</h1>
        <p className="text-sm text-muted-foreground">Массовые сообщения пользователям бота</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Новая рассылка</CardTitle>
          <CardDescription>Отправляется всем известным пользователям бота</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="broadcastText">Текст сообщения</Label>
            <Textarea
              id="broadcastText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Уважаемые студенты! Завтра в 18:00 состоится бесплатный вебинар по…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Запланировать на (необязательно)</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Если не указано — отправится немедленно.
            </p>
          </div>
          <Button onClick={handleSend} disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {scheduledAt ? 'Запланировать' : 'Отправить сейчас'}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Рассылок пока нет</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((b) => {
            const st = STATUS_BADGES[b.status] || STATUS_BADGES.pending
            return (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Megaphone className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={st.variant}>
                          <st.icon className={`h-3 w-3 mr-1 ${b.status === 'sending' ? 'animate-spin' : ''}`} />
                          {st.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(b.createdAt).toLocaleString('ru-RU')}
                        </span>
                        {b.sentAt && (
                          <span className="text-xs text-muted-foreground">
                            · отправлено {new Date(b.sentAt).toLocaleString('ru-RU')}
                          </span>
                        )}
                        <Badge variant="outline">{b.recipientCount} получ.</Badge>
                      </div>
                      <div className="text-sm whitespace-pre-line line-clamp-3">{b.text}</div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => viewItem(b.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {viewing && (
        <Dialog open onOpenChange={(v) => !v && setViewing(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Рассылка</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-line">
                {viewing.text}
              </div>
              <div className="text-xs text-muted-foreground">
                Создана: {new Date(viewing.createdAt).toLocaleString('ru-RU')}
                {viewing.sentAt && ` · Отправлена: ${new Date(viewing.sentAt).toLocaleString('ru-RU')}`}
              </div>
              {viewing.recipients?.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Получатели ({viewing.recipients.length}):</div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {viewing.recipients.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-2 text-xs p-2 rounded border border-border">
                        <Badge variant={r.status === 'sent' ? 'default' : 'destructive'}>
                          {r.status === 'sent' ? '✓' : '✗'}
                        </Badge>
                        <span className="flex-1">
                          {r.user?.firstName || r.user?.username || r.user?.maxUserId}
                        </span>
                        {r.error && <span className="text-destructive">{r.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewing(null)}>Закрыть</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
