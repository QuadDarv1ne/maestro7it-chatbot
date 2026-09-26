'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2, Tag as TagIcon } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export function TagManager() {
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api.listTags()
      setTags(res.tags)
    } catch (e: any) {
      toast.error('Ошибка загрузки', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await api.createTag(newName.trim())
      setNewName('')
      toast.success('Тег создан')
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(t: any) {
    if (!confirm(`Удалить тег #${t.name}?`)) return
    try {
      await api.deleteTag(t.id)
      toast.success('Тег удалён')
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Теги</h1>
        <p className="text-sm text-muted-foreground">Дополнительная маркировка для ответов</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Новый тег…"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <TagIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Нет тегов</div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-border bg-muted/40"
                >
                  <span className="text-sm">#{t.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{t._count?.items || 0}</Badge>
                  <button
                    onClick={() => handleDelete(t)}
                    className="text-muted-foreground hover:text-destructive ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
