'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MessageSquare, Users, MessageCircle, ThumbsUp, ThumbsDown,
  Bot, AlertTriangle, HelpCircle, Loader2, RefreshCw, TrendingUp,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { DashboardSkeleton } from './skeletons'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

const SOURCE_LABELS: Record<string, string> = {
  faq: 'FAQ',
  llm: 'LLM',
  command: 'Команды',
  callback: 'Callback',
  broadcast: 'Рассылка',
  offtopic: 'Off-topic',
  unknown: 'Без ответа',
  user: 'Входящие',
}

export function Dashboard({ onNavigate }: { onNavigate?: (tab: any) => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await api.getAnalytics()
      setData(res)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  const m = data?.metrics || {}

  // График по дням
  const dayEntries = Object.entries(data?.recentByDay || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count: count as number }))

  // Pie по источникам
  const sourceEntries = Object.entries(data?.sourceBreakdown || {})
    .filter(([k]) => k !== 'user')
    .map(([k, v]) => ({ name: SOURCE_LABELS[k] || k, value: v as number }))

  const stats = [
    { label: 'Сообщений за 24ч', value: m.messages24h ?? 0, icon: MessageSquare, color: 'text-blue-500' },
    { label: 'Пользователей', value: m.userCount ?? 0, icon: Users, color: 'text-emerald-500', sub: `+${m.userCount24h ?? 0} за 24ч` },
    { label: 'FAQ-ответов', value: m.faqCount ?? 0, icon: MessageCircle, color: 'text-amber-500' },
    { label: 'Положительных оценок', value: m.feedbackPositive ?? 0, icon: ThumbsUp, color: 'text-green-500', sub: m.feedbackRate != null ? `${m.feedbackRate}% одобрения` : '' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
          <p className="text-sm text-muted-foreground">
            Сводка по работе бота Maestro7IT за последние 24 часа
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" /> Обновить
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  {s.sub && <div className="text-xs text-emerald-600 mt-1">{s.sub}</div>}
                </div>
                <div className={`h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-lg font-semibold">{m.llmAnswers24h ?? 0}</div>
                <div className="text-xs text-muted-foreground">LLM-ответов за 24ч</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-lg font-semibold">{m.feedbackNegative ?? 0}</div>
                <div className="text-xs text-muted-foreground">Негативных оценок</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-lg font-semibold">{m.offTopic24h ?? 0}</div>
                <div className="text-xs text-muted-foreground">Off-topic за 24ч</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 cursor-pointer hover:bg-accent/30 transition-colors"
            onClick={() => onNavigate?.('unanswered')}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-lg font-semibold">{m.unanswered ?? 0}</div>
                <div className="text-xs text-muted-foreground">Запросов без ответа</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Активность за 14 дней
            </CardTitle>
            <CardDescription>Количество сообщений по дням</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dayEntries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Сообщений"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Источники ответов</CardTitle>
            <CardDescription>Распределение по типам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {sourceEntries.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Пока нет данных
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceEntries}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      fontSize={11}
                    >
                      {sourceEntries.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Краткое саммари */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Воронка ответов за 24 часа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">FAQ-ответов</div>
              <div className="text-xl font-bold">{m.faqAnswers24h ?? 0}</div>
              {m.faqShare != null && <Badge variant="secondary" className="mt-1">{m.faqShare}% от отвеченных</Badge>}
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">LLM-ответов</div>
              <div className="text-xl font-bold">{m.llmAnswers24h ?? 0}</div>
              {m.llmShare != null && <Badge variant="secondary" className="mt-1">{m.llmShare}% от отвеченных</Badge>}
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Off-topic</div>
              <div className="text-xl font-bold">{m.offTopic24h ?? 0}</div>
              <Badge variant="outline" className="mt-1">не по теме</Badge>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Всего сообщений</div>
              <div className="text-xl font-bold">{m.messages24h ?? 0}</div>
              <Badge variant="outline" className="mt-1">за 24ч</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
