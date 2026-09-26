'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { HelpCircle, Loader2, Plus, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export function UnansweredPage() {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState<any | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [keywords, setKeywords] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [res, catRes] = await Promise.all([api.listUnanswered(), api.listCategories()])
      setItems(res.items)
      setCategories(catRes.categories)
    } catch (e: any) {
      toast.error('Ошибка загрузки', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openConvert(item: any) {
    setConverting(item)
    setQuestion(item.text)
    setAnswer('')
    setKeywords('')
    setCategoryId('')
  }

  async function handleConvert() {
    if (!question.trim() || !answer.trim()) {
      toast.error('Нужны вопрос и ответ')
      return
    }
    setSaving(true)
    try {
      await api.convertUnanswered({
        messageLogId: converting?.id,
        question,
        answer,
        keywords,
        categoryId: categoryId || null,
      })
      toast.success('Ответ добавлен в базу')
      setConverting(null)
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Запросы без ответа</h1>
        <p className="text-sm text-muted-foreground">
          Вопросы пользователей, на которые бот не смог ответить. Превратите их в FAQ одним кликом.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Нет необработанных запросов 🎉</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((l) => (
            <Card key={l.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-4 w-4 text-blue-500 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{l.source}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(l.createdAt).toLocaleString('ru-RU')}
                      </span>
                      {l.user && (
                        <span className="text-xs text-muted-foreground">
                          · {l.user.firstName || l.user.username || l.user.maxUserId}
                        </span>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-line break-words">{l.text}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openConvert(l)}>
                    <Plus className="h-4 w-4 mr-1" /> В FAQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {converting && (
        <Dialog open onOpenChange={(v) => !v && setConverting(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Добавить ответ в базу</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm border-l-4 border-primary">
                <div className="text-xs text-muted-foreground mb-1">Исходный запрос:</div>
                {converting.text}
              </div>
              <div className="space-y-2">
                <Label>Вопрос *</Label>
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Ответ *</Label>
                <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6} />
              </div>
              <div className="space-y-2">
                <Label>Ключевые слова (через запятую)</Label>
                <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Без категории" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Без категории</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConverting(null)}>Отмена</Button>
              <Button onClick={handleConvert} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Добавить в базу
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
