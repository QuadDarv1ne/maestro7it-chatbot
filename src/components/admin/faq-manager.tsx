'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus, Search, Pencil, Trash2, Pin, PinOff, Loader2, BookOpen, Filter,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

interface FaqItem {
  id: string
  question: string
  answer: string
  keywords: string | null
  isPinned: boolean
  isPublished: boolean
  sortOrder: number
  categoryId: string | null
  category?: { id: string; name: string; emoji: string | null } | null
  tags?: { tag: { id: string; name: string } }[]
}

interface Category {
  id: string
  name: string
  emoji: string | null
}

export function FaqManager() {
  const [items, setItems] = useState<FaqItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showUnpublished, setShowUnpublished] = useState(false)
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (showUnpublished) params.unpublished = '1'
      if (categoryFilter !== 'all') params.categoryId = categoryFilter
      if (search) params.q = search
      const res = await api.listFaq(params)
      setItems(res.items)
      const catRes = await api.listCategories()
      setCategories(catRes.categories)
    } catch (e: any) {
      toast.error('Не удалось загрузить базу знаний', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }, [showUnpublished, categoryFilter, search])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingItem(null)
    setIsEditorOpen(true)
  }

  function openEdit(item: FaqItem) {
    setEditingItem(item)
    setIsEditorOpen(true)
  }

  async function handleDelete(item: FaqItem) {
    if (!confirm(`Удалить вопрос «${item.question}»?`)) return
    try {
      await api.deleteFaq(item.id)
      toast.success('Вопрос удалён')
      load()
    } catch (e: any) {
      toast.error('Ошибка удаления', { description: e?.message })
    }
  }

  async function togglePinned(item: FaqItem) {
    try {
      await api.updateFaq(item.id, { isPinned: !item.isPinned })
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  async function togglePublished(item: FaqItem) {
    try {
      await api.updateFaq(item.id, { isPublished: !item.isPublished })
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">База знаний</h1>
          <p className="text-sm text-muted-foreground">
            Всего ответов: <Badge variant="secondary">{items.length}</Badge>
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Новый ответ
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по вопросам и ответам…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showUnpublished ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowUnpublished(!showUnpublished)}
            >
              {showUnpublished ? 'Все' : 'Только опубликованные'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Нет вопросов по фильтрам</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className={`overflow-hidden ${!item.isPublished ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {item.isPinned && (
                        <Badge variant="default" className="text-[10px]">
                          <Pin className="h-3 w-3 mr-1" /> Закреплён
                        </Badge>
                      )}
                      {item.category && (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.category.emoji} {item.category.name}
                        </Badge>
                      )}
                      {item.tags?.map((t) => (
                        <Badge key={t.tag.id} variant="outline" className="text-[10px]">
                          #{t.tag.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="font-medium text-sm mb-1">{item.question}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">
                      {item.answer}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePinned(item)}
                      title={item.isPinned ? 'Открепить' : 'Закрепить'}
                    >
                      {item.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePublished(item)}
                      title={item.isPublished ? 'Скрыть' : 'Опубликовать'}
                    >
                      <Switch checked={item.isPublished} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Редактировать">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} title="Удалить">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isEditorOpen && (
        <FaqEditor
          item={editingItem}
          categories={categories}
          onClose={() => setIsEditorOpen(false)}
          onSaved={() => {
            setIsEditorOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function FaqEditor({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: FaqItem | null
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const [question, setQuestion] = useState(item?.question || '')
  const [answer, setAnswer] = useState(item?.answer || '')
  const [keywords, setKeywords] = useState(item?.keywords || '')
  const [categoryId, setCategoryId] = useState(item?.categoryId || '')
  const [isPinned, setIsPinned] = useState(item?.isPinned || false)
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? true)
  const [sortOrder, setSortOrder] = useState(item?.sortOrder ?? 0)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!question.trim() || !answer.trim()) {
      toast.error('Вопрос и ответ обязательны')
      return
    }
    setSaving(true)
    try {
      const data = {
        question,
        answer,
        keywords,
        categoryId: categoryId || null,
        isPinned,
        isPublished,
        sortOrder: Number(sortOrder),
      }
      if (item) {
        await api.updateFaq(item.id, data)
        toast.success('Ответ обновлён')
      } else {
        await api.createFaq(data)
        toast.success('Ответ создан')
      }
      onSaved()
    } catch (e: any) {
      toast.error('Ошибка сохранения', { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Редактировать ответ' : 'Новый ответ'}</DialogTitle>
          <DialogDescription>
            Вопрос, по которому бот будет находить этот ответ, и сам текст ответа.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Вопрос *</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Например: Как записаться на курс по Python?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="answer">Ответ *</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={8}
              placeholder="Текст ответа, который получит пользователь. Можно использовать переносы строк."
            />
            <p className="text-xs text-muted-foreground">
              Поддерживаются переносы строк. Markdown не используется.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="keywords">Ключевые слова</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="python, курс, запись, программирование"
            />
            <p className="text-xs text-muted-foreground">
              Через запятую. Помогают боту находить ответ даже если пользователь сформулировал иначе.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Без категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без категории</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Порядок сортировки</Label>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={isPinned} onCheckedChange={setIsPinned} id="pinned" />
              <Label htmlFor="pinned">Закрепить вверху</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} id="published" />
              <Label htmlFor="published">Опубликован</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
