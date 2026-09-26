'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, BarChart3 } from 'lucide-react'
import { api } from '@/lib/api-client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'

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

export function AnalyticsPage() {
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
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const m = data?.metrics || {}
  const dayEntries = Object.entries(data?.recentByDay || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30)
    .map(([date, count]) => ({ date: date.slice(5), count: count as number }))

  const sourceEntries = Object.entries(data?.sourceBreakdown || {})
    .filter(([k]) => k !== 'user')
    .map(([k, v]) => ({ name: SOURCE_LABELS[k] || k, value: v as number }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Аналитика</h1>
          <p className="text-sm text-muted-foreground">Детальные метрики по работе бота</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" /> Обновить
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Всего сообщений', value: m.totalMessages },
          { label: 'За 7 дней', value: m.messages7d },
          { label: 'За 24 часа', value: m.messages24h },
          { label: 'Пользователей всего', value: m.userCount },
          { label: 'Новых за 24ч', value: m.userCount24h },
          { label: 'FAQ-ответов', value: m.faqCount },
          { label: 'Положительных оценок', value: m.feedbackPositive },
          { label: 'Негативных оценок', value: m.feedbackNegative },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{s.value ?? 0}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Активность за 30 дней */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Активность за 30 дней
          </CardTitle>
          <CardDescription>Количество сообщений по дням</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayEntries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Сообщений" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Источники */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Источники ответов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {sourceEntries.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Нет данных
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceEntries}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      fontSize={11}
                      dataKey="value"
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

        {/* Воронка */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Воронка за 24 часа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Всего сообщений', value: m.messages24h, total: m.messages24h, color: 'var(--chart-1)' },
                { label: 'FAQ-ответов', value: m.faqAnswers24h, total: m.messages24h, color: 'var(--chart-2)' },
                { label: 'LLM-ответов', value: m.llmAnswers24h, total: m.messages24h, color: 'var(--chart-3)' },
                { label: 'Off-topic', value: m.offTopic24h, total: m.messages24h, color: 'var(--chart-5)' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{row.label}</span>
                    <span className="font-semibold">{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${row.total > 0 ? (row.value / row.total) * 100 : 0}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
