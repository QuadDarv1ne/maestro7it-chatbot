'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Database, Lock, Globe, Bot, Server, FileJson, Webhook,
} from 'lucide-react'

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  auth: 'public' | 'admin' | 'super_admin'
}

const ENDPOINTS: { group: string; icon: any; endpoints: Endpoint[] }[] = [
  {
    group: 'Публичные',
    icon: Globe,
    endpoints: [
      { method: 'GET', path: '/api/health', description: 'Health check с детальной информацией', auth: 'public' },
      { method: 'GET', path: '/api/public/stats', description: 'Публичная статистика (без sensitive данных)', auth: 'public' },
      { method: 'GET', path: '/sitemap.xml', description: 'XML sitemap для поисковиков', auth: 'public' },
      { method: 'GET', path: '/robots.txt', description: 'Правила для поисковых роботов', auth: 'public' },
      { method: 'GET', path: '/manifest.webmanifest', description: 'PWA манифест', auth: 'public' },
    ],
  },
  {
    group: 'Авторизация',
    icon: Lock,
    endpoints: [
      { method: 'POST', path: '/api/admin/login', description: 'Вход по email + пароль', auth: 'public' },
      { method: 'POST', path: '/api/admin/logout', description: 'Выход, удаление сессии', auth: 'admin' },
      { method: 'GET', path: '/api/admin/me', description: 'Текущий аккаунт', auth: 'admin' },
      { method: 'POST', path: '/api/admin/change-password', description: 'Смена своего пароля', auth: 'admin' },
      { method: 'POST', path: '/api/admin/reset-request', description: 'Запрос восстановления пароля по email', auth: 'public' },
      { method: 'GET', path: '/api/admin/reset-confirm?token=X', description: 'Проверка токена восстановления', auth: 'public' },
      { method: 'POST', path: '/api/admin/reset-confirm', description: 'Установка нового пароля по токену', auth: 'public' },
    ],
  },
  {
    group: 'Аккаунты администраторов',
    icon: Lock,
    endpoints: [
      { method: 'GET', path: '/api/admin/accounts', description: 'Список аккаунтов', auth: 'super_admin' },
      { method: 'POST', path: '/api/admin/accounts', description: 'Создать аккаунт', auth: 'super_admin' },
      { method: 'PUT', path: '/api/admin/accounts/[id]', description: 'Обновить аккаунт (role, isActive)', auth: 'super_admin' },
      { method: 'DELETE', path: '/api/admin/accounts/[id]', description: 'Удалить аккаунт', auth: 'super_admin' },
    ],
  },
  {
    group: 'База знаний',
    icon: Database,
    endpoints: [
      { method: 'GET', path: '/api/categories', description: 'Список категорий', auth: 'public' },
      { method: 'POST', path: '/api/categories', description: 'Создать категорию', auth: 'admin' },
      { method: 'PUT', path: '/api/categories/[id]', description: 'Обновить категорию', auth: 'admin' },
      { method: 'DELETE', path: '/api/categories/[id]', description: 'Удалить категорию', auth: 'admin' },
      { method: 'GET', path: '/api/faq', description: 'Список FAQ (с фильтрами)', auth: 'public' },
      { method: 'POST', path: '/api/faq', description: 'Создать FAQ', auth: 'admin' },
      { method: 'PUT', path: '/api/faq/[id]', description: 'Обновить FAQ', auth: 'admin' },
      { method: 'DELETE', path: '/api/faq/[id]', description: 'Удалить FAQ', auth: 'admin' },
      { method: 'GET', path: '/api/tags', description: 'Список тегов', auth: 'public' },
      { method: 'POST', path: '/api/tags', description: 'Создать тег', auth: 'admin' },
      { method: 'DELETE', path: '/api/tags/[id]', description: 'Удалить тег', auth: 'admin' },
    ],
  },
  {
    group: 'Экспорт/Импорт',
    icon: FileJson,
    endpoints: [
      { method: 'GET', path: '/api/kb/export', description: 'Экспорт базы знаний в JSON', auth: 'admin' },
      { method: 'POST', path: '/api/kb/import', description: 'Импорт базы знаний (replace/merge)', auth: 'admin' },
    ],
  },
  {
    group: 'Бот и Webhook',
    icon: Bot,
    endpoints: [
      { method: 'POST', path: '/api/max/webhook', description: 'Webhook для MAX Bot API', auth: 'public' },
      { method: 'GET', path: '/api/bot/check', description: 'Проверка бота (getMe)', auth: 'admin' },
      { method: 'POST', path: '/api/bot/webhook/subscribe', description: 'Подписать webhook', auth: 'admin' },
      { method: 'POST', path: '/api/bot/webhook/unsubscribe', description: 'Отписать webhook', auth: 'admin' },
      { method: 'POST', path: '/api/bot/simulate', description: 'Симулятор бота (без MAX)', auth: 'admin' },
    ],
  },
  {
    group: 'Логи и Аналитика',
    icon: Server,
    endpoints: [
      { method: 'GET', path: '/api/logs', description: 'Логи с фильтрами и пагинацией', auth: 'admin' },
      { method: 'GET', path: '/api/logs/export', description: 'Экспорт логов в CSV', auth: 'admin' },
      { method: 'GET', path: '/api/logs/stream', description: 'Real-time логи через SSE', auth: 'admin' },
      { method: 'GET', path: '/api/analytics', description: 'Метрики и графики', auth: 'admin' },
      { method: 'GET', path: '/api/admin-actions', description: 'Журнал действий администраторов', auth: 'admin' },
      { method: 'GET', path: '/api/unanswered', description: 'Запросы без ответа', auth: 'admin' },
      { method: 'POST', path: '/api/unanswered', description: 'Превратить запрос в FAQ', auth: 'admin' },
    ],
  },
  {
    group: 'Рассылки',
    icon: Webhook,
    endpoints: [
      { method: 'GET', path: '/api/broadcasts', description: 'Список рассылок', auth: 'admin' },
      { method: 'POST', path: '/api/broadcasts', description: 'Создать рассылку', auth: 'admin' },
      { method: 'GET', path: '/api/broadcasts/[id]', description: 'Детали рассылки', auth: 'admin' },
      { method: 'DELETE', path: '/api/broadcasts/[id]', description: 'Удалить рассылку', auth: 'admin' },
    ],
  },
  {
    group: 'Настройки и Команды',
    icon: Database,
    endpoints: [
      { method: 'GET', path: '/api/settings', description: 'Настройки бота', auth: 'admin' },
      { method: 'PUT', path: '/api/settings', description: 'Обновить настройки', auth: 'admin' },
      { method: 'GET', path: '/api/commands', description: 'Команды бота', auth: 'public' },
      { method: 'POST', path: '/api/commands', description: 'Создать команду', auth: 'admin' },
      { method: 'PUT', path: '/api/commands/[id]', description: 'Обновить команду', auth: 'admin' },
      { method: 'DELETE', path: '/api/commands/[id]', description: 'Удалить команду', auth: 'admin' },
      { method: 'GET', path: '/api/search?q=X', description: 'Глобальный поиск', auth: 'admin' },
    ],
  },
]

const AUTH_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  public: { label: 'public', variant: 'outline' },
  admin: { label: 'admin', variant: 'secondary' },
  super_admin: { label: 'super_admin', variant: 'destructive' },
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-600',
  POST: 'text-blue-600',
  PUT: 'text-amber-600',
  DELETE: 'text-red-600',
}

export default function ApiDocsPage() {
  const totalEndpoints = ENDPOINTS.reduce((sum, g) => sum + g.endpoints.length, 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-muted/30">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              На главную
            </Link>
            <Badge variant="secondary">{totalEndpoints} endpoints</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">API Documentation</h1>
          <p className="text-sm text-muted-foreground">
            Справочник по всем endpoints чат-бота Maestro7IT.
            Авторизация через cookie-сессию (кроме public endpoints).
          </p>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
        {ENDPOINTS.map((group) => (
          <section key={group.group}>
            <div className="flex items-center gap-2 mb-3">
              <group.icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{group.group}</h2>
              <Badge variant="outline" className="text-xs">{group.endpoints.length}</Badge>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {group.endpoints.map((ep) => (
                    <div
                      key={`${ep.method}-${ep.path}`}
                      className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                    >
                      <span className={`font-mono font-bold text-xs w-14 shrink-0 ${METHOD_COLORS[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono flex-1 min-w-0 truncate">{ep.path}</code>
                      <span className="text-xs text-muted-foreground hidden sm:block flex-1 min-w-0 truncate">
                        {ep.description}
                      </span>
                      <Badge variant={AUTH_BADGES[ep.auth].variant} className="text-[10px] shrink-0">
                        {AUTH_BADGES[ep.auth].label}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        ))}

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">Уровни доступа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">public</Badge>
              <span className="text-muted-foreground">— доступ без авторизации</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="text-xs">admin</Badge>
              <span className="text-muted-foreground">— требуется сессия администратора</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="text-xs">super_admin</Badge>
              <span className="text-muted-foreground">— только для super_admin (управление аккаунтами)</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
