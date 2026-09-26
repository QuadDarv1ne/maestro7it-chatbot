'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, CheckCircle2, Plug, PlugZap, Unplug, Bot, AlertCircle } from 'lucide-react'
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

      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Сохранить настройки
        </Button>
      </div>
    </div>
  )
}
