'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Send, Loader2, Bot, User, RotateCcw, Sparkles, Zap,
  CornerDownRight, Check, AlertCircle, AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

// --- Types ---

interface InlineButton {
  text: string
  payload: string
}

type MessageRole = 'user' | 'bot' | 'system'

interface Message {
  id: string
  role: MessageRole
  text: string
  source?: string
  faqItemId?: string
  isOffTopic?: boolean
  buttons?: InlineButton[][]
  /** Кнопки скрыты после клика */
  buttonsUsed?: boolean
  /** Какая кнопка нажата (для подсветки) */
  clickedButton?: string
  /** Feedback подтверждение */
  feedbackGiven?: 'positive' | 'negative'
  /** Признак ошибки при клике на кнопку — позволяет повторить */
  buttonsError?: boolean
  timestamp: number
}

// --- Constants ---

const SOURCE_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  faq: { label: 'FAQ', variant: 'default' },
  llm: { label: 'LLM', variant: 'secondary' },
  command: { label: 'Команда', variant: 'secondary' },
  callback: { label: 'Callback', variant: 'outline' },
  offtopic: { label: 'Off-topic', variant: 'destructive' },
  unknown: { label: 'Нет ответа', variant: 'destructive' },
}

const QUICK_PROMPTS: ReadonlyArray<{ text: string; hint: string }> = [
  { text: 'Расскажи про Docker', hint: 'Конкретный курс' },
  { text: 'Какие курсы по программированию?', hint: 'Поиск по направлению' },
  { text: 'Курс по Python', hint: 'Поиск по языку' },
  { text: 'Курсовые и дипломные', hint: 'Академическое' },
  { text: 'SQL курс', hint: 'Базы данных' },
  { text: 'Кибербезопасность', hint: 'Безопасность' },
  { text: '/menu', hint: 'Команда: меню категорий' },
  { text: '/help', hint: 'Команда: помощь' },
  { text: '/start', hint: 'Команда: приветствие' },
]

const WELCOME_TEXT =
  '👋 Я бот школы программирования Maestro7IT.\n\nЧем могу помочь? Выберите подсказку справа или напишите свой вопрос.'

const MAX_INPUT_LENGTH = 2000

// --- Helpers ---

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// --- Component ---

export function BotSimulator() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAtBottomRef = useRef(true)

  // --- Приветствие при монтировании ---
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'bot',
      text: WELCOME_TEXT,
      timestamp: Date.now(),
      // намеренно без source — welcome не является ответом на команду
    }])
  }, [])

  // --- Авто-скролл вниз — только если пользователь был у дна ---
  useEffect(() => {
    if (scrollRef.current && isAtBottomRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, loading, pendingPayload])

  // --- Фокус на input при монтировании ---
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // --- Возврат фокуса после завершения loading / pendingPayload ---
  useEffect(() => {
    if (!loading && !pendingPayload) {
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [loading, pendingPayload])

  // --- Send message ---

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = {
      id: makeId('u'),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    isAtBottomRef.current = true

    try {
      const res = await api.simulate(trimmed)
      const botMsg: Message = {
        id: makeId('b'),
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
      // Восстанавливаем текст в input — пользователь может отредактировать и повторить
      setInput(trimmed)
      setMessages((m) => [...m, {
        id: makeId('e'),
        role: 'system',
        text: `Ошибка: ${e?.message || 'неизвестная'}`,
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading])

  // --- Click inline button ---

  const clickButton = useCallback(async (messageId: string, button: InlineButton) => {
    if (loading || pendingPayload) return

    // Помечаем исходное сообщение: кнопки использованы, запоминаем какую нажали
    setMessages((m) => m.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            buttonsUsed: true,
            buttonsError: false, // сбрасываем предыдущую ошибку
            clickedButton: button.text,
            ...(button.payload.startsWith('feedback:')
              ? {
                  feedbackGiven: button.payload.endsWith(':1')
                    ? ('positive' as const)
                    : ('negative' as const),
                }
              : {}),
          }
        : msg,
    ))

    // --- Feedback-кнопки: НЕ показываем новое сообщение бота ---
    // Сервер вернёт "💚 Спасибо" что загромождает чат.
    // Вместо этого показываем подтверждение под кнопками.
    if (button.payload.startsWith('feedback:')) {
      // Отправляем запрос в background (для записи в БД), без ожидания
      api.simulateCallback(button.payload).catch((e) => {
        toast.error('Ошибка записи оценки', { description: e?.message })
      })
      // Возвращаем фокус на input (loading не менялся, useEffect не сработает)
      queueMicrotask(() => inputRef.current?.focus())
      return
    }

    // --- Остальные callback'и: системное сообщение + запрос ---
    setMessages((m) => [...m, {
      id: makeId('s'),
      role: 'system',
      text: `Нажата кнопка: ${button.text}`,
      timestamp: Date.now(),
    }])

    setLoading(true)
    setPendingPayload(button.payload)
    isAtBottomRef.current = true

    try {
      const res = await api.simulateCallback(button.payload)
      const botMsg: Message = {
        id: makeId('b'),
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
      // ВОССТАНАВЛИВАЕМ кнопки — пользователь может повторить клик
      setMessages((m) => m.map((msg) =>
        msg.id === messageId
          ? { ...msg, buttonsUsed: false, buttonsError: true, clickedButton: undefined }
          : msg,
      ))
      setMessages((m) => [...m, {
        id: makeId('e'),
        role: 'system',
        text: `Ошибка: ${e?.message || 'неизвестная'}`,
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
      setPendingPayload(null)
    }
  }, [loading, pendingPayload])

  // --- Reset chat ---

  const reset = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'bot',
      text: WELCOME_TEXT,
      timestamp: Date.now(),
    }])
    setInput('')
    setLoading(false)
    setPendingPayload(null)
  }, [])

  // --- Keyboard ---

  function handleKeyDown(e: React.KeyboardEvent) {
    // Enter — отправить. Shift+Enter в single-line input всё равно срабатывает,
    // но мы не даём вставить перенос — поэтому обрабатываем только Enter.
    if (e.key === 'Enter') {
      e.preventDefault()
      send(input)
    }
  }

  // --- Scroll tracking ---

  function handleScroll() {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 80
  }

  const canSend = input.trim().length > 0 && !loading

  // --- Render ---

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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reset}
          disabled={loading || !!pendingPayload}
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Очистить
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chat */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" /> Чат с ботом
            </CardTitle>
            <CardDescription>Введите вопрос как сделал бы пользователь MAX</CardDescription>
          </CardHeader>

          {/* Messages area */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-[520px] overflow-y-auto px-4 py-3 space-y-4 bg-muted/20 border-y"
            style={{ scrollbarGutter: 'stable' }}
            role="log"
            aria-live="polite"
            aria-label="История чата"
          >
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onButtonClick={(btn) => clickButton(m.id, btn)}
                disabled={loading || !!pendingPayload}
                activePayload={pendingPayload ?? undefined}
              />
            ))}

            {loading && (
              <TypingIndicator />
            )}
          </div>

          {/* Input area */}
          <div className="p-3 flex gap-2 bg-card items-center">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение…"
              disabled={loading}
              maxLength={MAX_INPUT_LENGTH}
              aria-label="Сообщение для бота"
              className="flex-1 h-10"
            />
            <Button
              type="button"
              onClick={() => send(input)}
              disabled={!canSend}
              size="icon"
              className="h-10 w-10 shrink-0"
              title="Отправить (Enter)"
              aria-label="Отправить сообщение"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>

        {/* Quick prompts sidebar */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Быстрые запросы
            </CardTitle>
            <CardDescription>Кликните, чтобы отправить боту</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 flex-1 overflow-y-auto max-h-[480px]">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.text}
                type="button"
                onClick={() => send(p.text)}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-lg border border-border hover:bg-accent hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm ${p.text.startsWith('/') ? 'font-mono text-primary' : ''}`}>
                    {p.text}
                  </span>
                  <CornerDownRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.hint}</div>
              </button>
            ))}

            <Separator className="my-3" />

            <div className="text-xs text-muted-foreground space-y-1.5 pt-1">
              <div className="font-medium text-foreground text-sm mb-2">Как пользоваться:</div>
              <div className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                <span>Симулятор использует ту же логику, что и реальный бот</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                <span>Inline-кнопки кликабельны, после клика — гаснут</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                <span>LLM-fallback работает если включён в настройках</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                <span>Все запросы логируются в общий лог</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                <span><kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px]">Enter</kbd> — отправить сообщение</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// --- Typing Indicator ---

function TypingIndicator() {
  return (
    <div
      className="flex gap-2 justify-start animate-in fade-in slide-in-from-bottom-1 duration-200"
      aria-label="Бот печатает"
    >
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl px-4 py-3 bg-card border border-border rounded-tl-sm shadow-sm">
        <div className="flex gap-1.5 items-center">
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}

// --- Message Bubble ---

function MessageBubble({
  message,
  onButtonClick,
  disabled,
  activePayload,
}: {
  message: Message
  onButtonClick: (btn: InlineButton) => void
  disabled: boolean
  activePayload?: string
}) {
  // --- System message (errors, action labels) ---
  if (message.role === 'system') {
    const isError = message.text.startsWith('Ошибка')
    return (
      <div className="flex justify-center animate-in fade-in duration-200 px-4">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs max-w-full ${
            isError
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-muted text-muted-foreground border border-border'
          }`}
        >
          {isError ? <AlertCircle className="h-3 w-3 shrink-0" /> : <CornerDownRight className="h-3 w-3 shrink-0" />}
          <span className="break-words">{message.text}</span>
        </div>
      </div>
    )
  }

  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Bot avatar (left) */}
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Bubble + buttons */}
      <div className={`max-w-[80%] min-w-0 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line break-words min-w-0 ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border rounded-tl-sm shadow-sm'
          }`}
        >
          {message.text}
        </div>

        {/* Metadata: badges + timestamp */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {message.source && SOURCE_BADGES[message.source] && (
              <Badge variant={SOURCE_BADGES[message.source].variant} className="text-[10px] py-0 px-1.5 h-4 leading-none">
                {SOURCE_BADGES[message.source].label}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}
        {isUser && (
          <span className="text-[10px] text-muted-foreground mt-1 mr-1">
            {formatTime(message.timestamp)}
          </span>
        )}

        {/* Inline buttons — attachment to bubble */}
        {!isUser && message.buttons && message.buttons.length > 0 && (
          <InlineButtons
            buttons={message.buttons}
            message={message}
            onButtonClick={onButtonClick}
            disabled={disabled}
            activePayload={activePayload}
          />
        )}
      </div>

      {/* User avatar (right) */}
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

// --- Inline Buttons ---

function InlineButtons({
  buttons,
  message,
  onButtonClick,
  disabled,
  activePayload,
}: {
  buttons: InlineButton[][]
  message: Message
  onButtonClick: (btn: InlineButton) => void
  disabled: boolean
  activePayload?: string
}) {
  // --- Feedback already given — show confirmation ---
  if (message.feedbackGiven) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span>
          {message.feedbackGiven === 'positive'
            ? 'Спасибо за положительную оценку!'
            : 'Спасибо, постараемся улучшить ответ.'}
        </span>
      </div>
    )
  }

  // --- Buttons used successfully — show "Нажато: ..." ---
  if (message.buttonsUsed && !message.buttonsError) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 shrink-0" />
        <span>
          Нажато: <span className="font-medium text-foreground">{message.clickedButton}</span>
        </span>
      </div>
    )
  }

  // --- Buttons error — show retry hint ---
  const errorBanner = message.buttonsError ? (
    <div className="mb-1.5 flex items-center gap-1.5 text-xs text-destructive">
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>Ошибка запроса — повторите клик</span>
    </div>
  ) : null

  return (
    <>
      {errorBanner}
      <div className="mt-2 space-y-1">
        {buttons.map((row, i) => (
          <div key={i} className="flex flex-wrap gap-1">
            {row.map((b, j) => {
              const isPending = activePayload === b.payload
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => onButtonClick(b)}
                  disabled={disabled}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPending
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50'
                  }`}
                >
                  {isPending && <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />}
                  {b.text}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
