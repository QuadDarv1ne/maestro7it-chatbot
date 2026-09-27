'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  UserPlus, Trash2, Loader2, Users, Shield, Mail, Lock, AlertCircle,
  Crown, UserCircle, Eye, EyeOff,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

interface AdminAccount {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export function AccountsManager() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [currentAccountId, setCurrentAccountId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listAccounts()
      if (res.ok && res.accounts) {
        setAccounts(res.accounts)
        setCurrentAccountId(res.currentAccountId || '')
      } else {
        setError('Не удалось загрузить аккаунты. Проверьте права доступа.')
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleToggleActive(account: AdminAccount) {
    try {
      await api.updateAccount(account.id, { isActive: !account.isActive })
      toast.success(account.isActive ? 'Аккаунт деактивирован' : 'Аккаунт активирован')
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  async function handleChangeRole(account: AdminAccount) {
    const newRole = account.role === 'super_admin' ? 'admin' : 'super_admin'
    try {
      await api.updateAccount(account.id, { role: newRole })
      toast.success(`Роль изменена на ${newRole}`)
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  async function handleDelete(account: AdminAccount) {
    if (!confirm(`Удалить аккаунт ${account.email}? Это действие необратимо.`)) return
    try {
      await api.deleteAccount(account.id)
      toast.success('Аккаунт удалён')
      load()
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-destructive" />
          <div className="text-sm text-destructive mb-2">{error}</div>
          <Button variant="outline" size="sm" onClick={load}>Повторить</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" /> Администраторы
          </h1>
          <p className="text-sm text-muted-foreground">
            Всего: {accounts.length}. Создавайте и управляйте аккаунтами с доступом к панели.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Создать аккаунт
        </Button>
      </div>

      <div className="space-y-2">
        {accounts.map((a) => {
          const isSelf = a.id === currentAccountId
          return (
            <Card key={a.id} className={!a.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                    a.role === 'super_admin' ? 'bg-amber-500/10' : 'bg-primary/10'
                  }`}>
                    {a.role === 'super_admin'
                      ? <Crown className="h-5 w-5 text-amber-600" />
                      : <UserCircle className="h-5 w-5 text-primary" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm">{a.name || a.email}</span>
                      {isSelf && (
                        <Badge variant="outline" className="text-[10px]">это вы</Badge>
                      )}
                      <Badge variant={a.role === 'super_admin' ? 'default' : 'secondary'} className="text-[10px]">
                        {a.role === 'super_admin' ? 'super_admin' : 'admin'}
                      </Badge>
                      {!a.isActive && (
                        <Badge variant="destructive" className="text-[10px]">деактивирован</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Mail className="h-3 w-3" />
                      {a.email}
                    </div>
                    {a.lastLoginAt && (
                      <div className="text-xs text-muted-foreground">
                        Последний вход: {new Date(a.lastLoginAt).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">активен</span>
                      <Switch
                        checked={a.isActive}
                        onCheckedChange={() => handleToggleActive(a)}
                        disabled={isSelf}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleChangeRole(a)}
                        disabled={isSelf}
                        title="Сменить роль"
                      >
                        <Shield className="h-3.5 w-3.5 mr-1" />
                        {a.role === 'super_admin' ? 'Сделать admin' : 'Сделать super_admin'}
                      </Button>
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(a)}
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {isCreateOpen && (
        <CreateAccountDialog
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function CreateAccountDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('admin')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    if (!email || !password) {
      setError('Email и пароль обязательны')
      return
    }
    setSaving(true)
    try {
      const res = await api.createAccount({ email, password, name: name || undefined, role })
      if (res.ok) {
        toast.success('Аккаунт создан')
        onCreated()
      } else {
        setError(res.error || 'Ошибка')
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый администратор</DialogTitle>
          <DialogDescription>
            Создайте аккаунт с доступом к админ-панели
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@maestro7it.ru"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <Label>Имя (необязательно)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван Иванов" />
          </div>
          <div className="space-y-2">
            <Label>Пароль *</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов, буквы и цифры"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Минимум 8 символов, хотя бы одна буква и одна цифра
            </p>
          </div>
          <div className="space-y-2">
            <Label>Роль</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin — доступ к панели без управления аккаунтами</SelectItem>
                <SelectItem value="super_admin">super_admin — полный доступ, включая управление аккаунтами</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
