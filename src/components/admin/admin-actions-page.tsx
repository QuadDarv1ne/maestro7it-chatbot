'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { History, Loader2, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

const ACTION_COLORS: Record<string, any> = {
  'faq.create': 'default',
  'faq.update': 'secondary',
  'faq.delete': 'destructive',
  'category.create': 'default',
  'category.update': 'secondary',
  'category.delete': 'destructive',
  'settings.update': 'secondary',
  'bot.webhook.subscribe': 'default',
  'bot.webhook.unsubscribe': 'outline',
}

export function AdminActionsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await api.listAdminActions()
      setItems(res.items)
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Журнал действий</h1>
          <p className="text-sm text-muted-foreground">Аудит операций администратора</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" /> Обновить
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Журнал пуст</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Badge variant={ACTION_COLORS[a.action] || 'outline'} className="text-[10px] font-mono">
                    {a.action}
                  </Badge>
                  {a.details && <div className="flex-1 text-sm truncate">{a.details}</div>}
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {new Date(a.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
