'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, CheckCircle2, Plug, PlugZap, Unplug, Bot, AlertCircle, Lock, Eye, EyeOff, Database, Download, Upload } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [botCheck, setBotCheck] = useState<{ ok: boolean; info?: any; error?: string } | null>(null)
  const [checking, setChecking] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api.getSettings()
      setSettings(res.settings)
      setWebhookUrl(res.settings.webhookUrl || '')
    } catch (e: any) {
      toast.error('Ошибка загрузки', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    setSaving(true)
    try {
      // маскированный токен не отправляем обратно
      const toUpdate = { ...settings }
      if (toUpdate.MAX_BOT_TOKEN === '***') delete toUpdate.MAX_BOT_TOKEN
      await api.updateSettings(toUpdate)
      toast.success('Настройки сохранены')
      load()
    } catch (e: any) {
      toast.error('Ошибка сохранения', { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleCheckBot() {
    setChecking(true)
    try {
      const res = await api.checkBot()
      setBotCheck(res)
      if (res.ok) toast.success('Бот отвечает', { description: res.info?.name || res.info?.username })
      else toast.error('Бот не отвечает', { description: res.error })
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    } finally {
      setChecking(false)
    }
  }

  async function handleSubscribe() {
    if (!webhookUrl) {
      toast.error('Введите URL вебхука')
      return
    }
    if (!webhookUrl.startsWith('https://')) {
      toast.error('URL должен начинаться с https://')
      return
    }
    setSubscribing(true)
    try {
      await api.subscribeWebhook(webhookUrl)
      toast.success('Webhook подписан')
      load()
    } catch (e: any) {
      toast.error('Ошибка подписки', { description: e?.message })
    } finally {
      setSubscribing(false)
    }
  }

  async function handleUnsubscribe() {
    setSubscribing(true)
    try {
      await api.unsubscribeWebhook(webhookUrl || undefined)
      toast.success('Webhook отписан')
      load()
    } catch (e: any) {
      toast.error('Ошибка отписки', { description: e?.message })
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasToken = settings.MAX_BOT_TOKEN && settings.MAX_BOT_TOKEN !== ''
  const webhookSubscribed = settings.webhookSubscribed === 'true'

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-sm text-muted-foreground">Параметры бота, webhook и тексты</p>
      </div>

      {/* Bot status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" /> Статус бота
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleCheckBot} disabled={checking}>
              {checking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
              Проверить бота
            </Button>
            {hasToken ? (
              <Badge variant="secondary" className="text-emerald-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Токен установлен
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" /> Токен не установлен
              </Badge>
            )}
            {webhookSubscribed ? (
              <Badge variant="secondary" className="text-emerald-600">
                <PlugZap className="h-3 w-3 mr-1" /> Webhook активен
              </Badge>
            ) : (
              <Badge variant="outline">
                <Unplug className="h-3 w-3 mr-1" /> Webhook не подписан
              </Badge>
            )}
          </div>

          {botCheck && (
            <div className={`p-3 rounded-lg border ${botCheck.ok ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-destructive/40 bg-destructive/5'}`}>
              <div className="text-sm font-medium">{botCheck.ok ? '✅ Бот работает' : '❌ Ошибка'}</div>
              {botCheck.info && (
                <pre className="text-xs mt-2 overflow-x-auto">
                  {JSON.stringify(botCheck.info, null, 2)}
                </pre>
              )}
              {botCheck.error && (
                <div className="text-xs mt-1 text-destructive">{botCheck.error}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot token */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Токен бота MAX</CardTitle>
          <CardDescription>
            Получите токен в Портале для бизнеса MAX → Чат-боты → Настройки → Токен доступа
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="botToken">MAX_BOT_TOKEN</Label>
            <Input
              id="botToken"
              type="password"
              value={settings.MAX_BOT_TOKEN || ''}
              onChange={(e) => setSettings({ ...settings, MAX_BOT_TOKEN: e.target.value })}
              placeholder="Вставьте токен бота…"
            />
            <p className="text-xs text-muted-foreground">
              Хранится в БД в открытом виде. При отображении маскируется как <code>***</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4" /> Webhook
          </CardTitle>
          <CardDescription>
            URL, на который MAX будет присылать обновления. Должен быть HTTPS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL вебхука</Label>
            <Input
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.ru/api/max/webhook"
            />
            <p className="text-xs text-muted-foreground">
              Для локальной разработки используйте <code>cloudflared tunnel --url http://localhost:3000</code> или ngrok.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubscribe} disabled={subscribing || !webhookUrl}>
              {subscribing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlugZap className="h-4 w-4 mr-2" />}
              Подписать webhook
            </Button>
            <Button variant="outline" onClick={handleUnsubscribe} disabled={subscribing}>
              <Unplug className="h-4 w-4 mr-2" /> Отписать
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Texts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Тексты бота</CardTitle>
          <CardDescription>Ответы бота в типовых ситуациях</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcomeText">Приветствие</Label>
            <Textarea
              id="welcomeText"
              value={settings.welcomeText || ''}
              onChange={(e) => setSettings({ ...settings, welcomeText: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noAnswerText">Текст «нет ответа»</Label>
            <Textarea
              id="noAnswerText"
              value={settings.noAnswerText || ''}
              onChange={(e) => setSettings({ ...settings, noAnswerText: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offtopicText">Текст «не по теме»</Label>
            <Textarea
              id="offtopicText"
              value={settings.offtopicText || ''}
              onChange={(e) => setSettings({ ...settings, offtopicText: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="useLlm"
              checked={settings.useLlmFallback === 'true'}
              onCheckedChange={(v) => setSettings({ ...settings, useLlmFallback: v ? 'true' : 'false' })}
            />
            <Label htmlFor="useLlm">Использовать LLM-fallback (z-ai-web-dev-sdk)</Label>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordCard />

      <KbBackupCard />

      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Сохранить настройки
        </Button>
      </div>
    </div>
  )
}

// --- Change Password Card ---

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Заполните все поля')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают')
      return
    }
    if (newPassword.length < 8) {
      setError('Новый пароль должен быть не менее 8 символов')
      return
    }
    if (!/[a-zA-Zа-яА-Я]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Пароль должен содержать буквы и цифры')
      return
    }
    if (currentPassword === newPassword) {
      setError('Новый пароль не должен совпадать с текущим')
      return
    }

    setSaving(true)
    try {
      const res = await api.changePassword(currentPassword, newPassword)
      if (res.ok) {
        toast.success('Пароль изменён', {
          description: 'Другие сессии этого аккаунта деактивированы',
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" /> Смена пароля
        </CardTitle>
        <CardDescription>
          После смены пароля все другие сессии этого аккаунта будут деактивированы
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPw">Текущий пароль</Label>
            <div className="relative">
              <Input
                id="currentPw"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPw">Новый пароль</Label>
            <div className="relative">
              <Input
                id="newPw"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPw">Подтвердите новый пароль</Label>
            <Input
              id="confirmPw"
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Изменить пароль
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// --- Knowledge Base Backup Card ---

function KbBackupCard() {
  const [importing, setImporting] = useState(false)
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge')
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    // Прямая ссылка — браузер скачает файл
    window.open(api.exportKbUrl(), '_blank')
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const res = await api.importKb(data, importMode)
      if (res.ok) {
        setImportResult({ imported: res.imported || 0, skipped: res.skipped || 0 })
        toast.success('Импорт завершён', {
          description: `Импортировано: ${res.imported}, пропущено: ${res.skipped}`,
        })
      } else {
        toast.error('Ошибка импорта', { description: res.error })
      }
    } catch (e: any) {
      toast.error('Ошибка чтения файла', { description: e?.message })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" /> База знаний — экспорт/импорт
        </CardTitle>
        <CardDescription>
          Backup базы знаний в JSON. Полезно для переноса между окружениями.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Экспортировать в JSON
          </Button>

          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="hidden"
              id="kb-import-file"
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              variant="outline"
            >
              {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Импортировать из JSON
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Label className="text-sm">Режим импорта:</Label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              name="import-mode"
              checked={importMode === 'merge'}
              onChange={() => setImportMode('merge')}
            />
            Merge (добавить новые, пропустить дубликаты)
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              name="import-mode"
              checked={importMode === 'replace'}
              onChange={() => setImportMode('replace')}
            />
            Replace (полная замена)
          </label>
        </div>

        {importResult && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm">
            ✅ Импортировано: <strong>{importResult.imported}</strong>, пропущено: <strong>{importResult.skipped}</strong>
          </div>
        )}

        <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
          <div className="font-medium text-foreground mb-1">Формат файла:</div>
          <code className="text-[11px]">
            {'{ "version": "1.0", "categories": [...], "faqs": [...], "tags": [...] }'}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}
