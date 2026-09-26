'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Terminal, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

const SYSTEM_COMMANDS = ['start', 'help', 'menu']

export function CommandsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api.listCommands()
      setItems(res.commands)
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(c: any) {
    if (SYSTEM_COMMANDS.includes(c.command)) {
      toast.error('Нельзя удалить системную команду')
      return
    }
    if (!confirm(`Удалить команду /${c.command}?`)) return
    try {
      await api.deleteCommand(c.id)
      toast.success('Команда удалена')
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  async function toggleEnabled(c: any) {
    try {
      await api.updateCommand(c.id, { isEnabled: !c.isEnabled })
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Команды бота</h1>
          <p className="text-sm text-muted-foreground">Реакции на слэш-команды (/start, /help и т.д.)</p>
        </div>
        <Button onClick={() => { setEditing(null); setIsOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Новая команда
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Terminal className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm">Команд нет</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Terminal className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <code className="text-sm font-mono font-semibold">/{c.command}</code>
                      {SYSTEM_COMMANDS.includes(c.command) && (
                        <Badge variant="secondary" className="text-[10px]">системная</Badge>
                      )}
                      <Badge variant={c.isEnabled ? 'default' : 'outline'} className="text-[10px]">
                        {c.isEnabled ? 'включена' : 'выключена'}
                      </Badge>
                    </div>
                    {c.description && (
                      <div className="text-xs text-muted-foreground mb-1">{c.description}</div>
                    )}
                    <div className="text-xs whitespace-pre-line line-clamp-3">{c.response}</div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Switch checked={c.isEnabled} onCheckedChange={() => toggleEnabled(c)} />
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setIsOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!SYSTEM_COMMANDS.includes(c.command) && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isOpen && (
        <CommandEditor
          command={editing}
          onClose={() => setIsOpen(false)}
          onSaved={() => { setIsOpen(false); load() }}
        />
      )}
    </div>
  )
}

function CommandEditor({ command, onClose, onSaved }: any) {
  const [cmd, setCmd] = useState(command?.command || '')
  const [description, setDescription] = useState(command?.description || '')
  const [response, setResponse] = useState(command?.response || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!cmd.trim() || !response.trim()) {
      toast.error('Команда и ответ обязательны')
      return
    }
    setSaving(true)
    try {
      const data = {
        command: cmd.replace(/^\//, ''),
        description,
        response,
      }
      if (command) {
        await api.updateCommand(command.id, data)
        toast.success('Команда обновлена')
      } else {
        await api.createCommand(data)
        toast.success('Команда создана')
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
          <DialogTitle>{command ? 'Редактировать команду' : 'Новая команда'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Команда *</Label>
            <Input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="mycommand"
              disabled={!!command && SYSTEM_COMMANDS.includes(command.command)}
            />
            <p className="text-xs text-muted-foreground">Без слэша. Пользователь напишет /{cmd || '…'}</p>
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ответ *</Label>
            <Textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={6} />
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
