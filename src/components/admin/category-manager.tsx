'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, FolderTree } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  emoji: string | null
  sortOrder: number
  _count?: { items: number }
}

export function CategoryManager() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api.listCategories()
      setItems(res.categories)
    } catch (e: any) {
      toast.error('Ошибка загрузки', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(c: Category) {
    if ((c._count?.items || 0) > 0) {
      toast.error('Нельзя удалить категорию с вопросами', {
        description: `В категории ${c._count?.items} вопросов. Переместите их в другую категорию.`,
      })
      return
    }
    if (!confirm(`Удалить категорию «${c.name}»?`)) return
    try {
      await api.deleteCategory(c.id)
      toast.success('Категория удалена')
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Категории</h1>
          <p className="text-sm text-muted-foreground">Группировка вопросов по направлениям курсов</p>
        </div>
        <Button onClick={() => { setEditing(null); setIsOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Создать
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderTree className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Нет категорий</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                    {c.emoji || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
                    <Badge variant="secondary" className="mt-1">
                      {c._count?.items || 0} вопр.
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setIsOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isOpen && (
        <CategoryEditor
          category={editing}
          onClose={() => setIsOpen(false)}
          onSaved={() => { setIsOpen(false); load() }}
        />
      )}
    </div>
  )
}

function CategoryEditor({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(category?.name || '')
  const [emoji, setEmoji] = useState(category?.emoji || '')
  const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? 0)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Введите название')
      return
    }
    setSaving(true)
    try {
      const data = { name, emoji, sortOrder: Number(sortOrder) }
      if (category) {
        await api.updateCategory(category.id, data)
        toast.success('Категория обновлена')
      } else {
        await api.createCategory(data)
        toast.success('Категория создана')
      }
      onSaved()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Редактировать категорию' : 'Новая категория'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: DevOps" />
          </div>
          <div className="space-y-2">
            <Label>Эмодзи</Label>
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🛠️" maxLength={4} />
          </div>
          <div className="space-y-2">
            <Label>Порядок сортировки</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
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
