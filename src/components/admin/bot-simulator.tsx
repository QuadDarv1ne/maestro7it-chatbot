'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, Bot, User, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'bot'
  text: string
  source?: string
  faqItemId?: string
  isOffTopic?: boolean
  buttons?: { text: string; payload: string }[][]
  timestamp: number
}

const SOURCE_BADGES: Record<string, { label: string; variant: any }> = {
  faq: { label: 'FAQ', variant: 'default' },
  llm: { label: 'LLM', variant: 'secondary' },
  command: { label: 'Команда', variant: 'secondary' },
  callback: { label: 'Callback', variant: 'outline' },
  offtopic: { label: 'Off-topic', variant: 'destructive' },
  unknown: { label: 'Нет ответа', variant: 'destructive' },
}

const QUICK_PROMPTS = [
  'Какие у вас есть курсы?',
  'Сколько стоит обучение?',
  'Как записаться на курс?',
  'Расскажи про Docker',
  'Какие контакты?',
  'Кто преподаватель?',
  '/menu',
  '/help',
]

export function BotSimulator() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Приветствие
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'bot',
      text: '👋 Я бот школы программирования Maestro7IT. Чем могу помочь?\n\nЭто симулятор — напишите любой вопрос или выберите подсказку ниже.',
      source: 'command',
      timestamp: Date.now(),
    }])
  }, [])

  // Авто-scroll вниз
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await api.simulate(text)
      const botMsg: Message = {
        id: `b_${Date.now()}`,
        role: 'bot',
        text: res.reply.text,
        source: res.reply.source,
        faqItemId: res.reply.faqItemId,
        isOffTopic: res.reply.isOffTopic,
        buttons: res.reply.inlineKeyboard,
        timestamp: Date.now(),
      }
      setMessages((m) => [...m, botMsg])
    } catch (e: any) {
      toast.error('Ошибка симуляции', { description: e?.message })
      setMessages((m) => [...m, {
        id: `e_${Date.now()}`,
        role: 'bot',
        text: '⚠️ Ошибка: ' + (e?.message || 'неизвестная'),
        source: 'unknown',
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  async function clickButton(payload: string, label: string) {
    // Добавляем визуально клик как сообщение пользователя
    setMessages((m) => [...m, {
      id: `u_${Date.now()}`,
      role: 'user',
      text: `🔘 ${label}`,
      timestamp: Date.now(),
    }])
    setLoading(true)
    try {
      const res = await api.simulateCallback(payload)
      setMessages((m) => [...m, {
        id: `b_${Date.now()}`,
        role: 'bot',
        text: res.reply.text,
        source: res.reply.source,
        faqItemId: res.reply.faqItemId,
        isOffTopic: res.reply.isOffTopic,
        buttons: res.reply.inlineKeyboard,
        timestamp: Date.now(),
      }])
    } catch (e: any) {
      toast.error('Ошибка', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMessages([{
      id: 'welcome',
      role: 'bot',
      text: '👋 Я бот школы программирования Maestro7IT. Чем могу помочь?',
      source: 'command',
      timestamp: Date.now(),
    }])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Симулятор бота
          </h1>
          <p className="text-sm text-muted-foreground">
            Тестируйте логику бота без подключения к MAX. Все сообщения логируются.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Очистить
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chat */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" /> Чат с ботом
            </CardTitle>
            <CardDescription>Введите вопрос как сделал бы пользователь MAX</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={scrollRef}
              className="h-[500px] overflow-y-auto p-4 space-y-3 bg-muted/20 border-y"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'bot' && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${m.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-card border border-border rounded-tl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.role === 'bot' && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {m.source && SOURCE_BADGES[m.source] && (
                          <Badge variant={SOURCE_BADGES[m.source].variant} className="text-[9px]">
                            {SOURCE_BADGES[m.source].label}
                          </Badge>
                        )}
                        {m.isOffTopic && (
                          <Badge variant="destructive" className="text-[9px]">off-topic</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(m.timestamp).toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                    )}
                    {m.buttons && m.buttons.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {m.buttons.map((row, i) => (
                          <div key={i} className="flex flex-wrap gap-1">
                            {row.map((b, j) => (
                              <button
                                key={j}
                                onClick={() => clickButton(b.payload, b.text)}
                                disabled={loading}
                                className="px-2 py-1 text-xs rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50"
                              >
                                {b.text}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 order-2">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl px-3 py-2 bg-card border border-border">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите сообщение…"
                disabled={loading}
              />
              <Button onClick={() => send(input)} disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Быстрые запросы
            </CardTitle>
            <CardDescription>Кликните, чтобы отправить боту</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                disabled={loading}
                className="w-full text-left p-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
              >
                {p.startsWith('/') ? (
                  <code className="text-primary font-mono">{p}</code>
                ) : (
                  p
                )}
              </button>
            ))}
            <div className="pt-3 mt-3 border-t border-border text-xs text-muted-foreground space-y-1">
              <div className="font-medium text-foreground">Подсказка:</div>
              <div>• Симулятор использует ту же логику, что и реальный бот</div>
              <div>• Сообщения логируются в общий лог</div>
              <div>• LLM-fallback работает если включён в настройках</div>
              <div>• Inline-кнопки кликабельны</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
