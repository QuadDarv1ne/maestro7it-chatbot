'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  GraduationCap, Loader2, Lock, Eye, EyeOff, AlertCircle,
  ArrowUpCircle, Server, MessageSquare, BookOpen, FolderTree,
  ExternalLink, Sparkles, Shield, Mail, ArrowLeft,
} from 'lucide-react'
import { api } from '@/lib/api-client'

interface PublicStats {
  faqCount: number
  categoryCount: number
  messageCount24h: number
}

const FEATURES = [
  { icon: BookOpen, title: 'База знаний', desc: 'Управление FAQ и ответами бота' },
  { icon: MessageSquare, title: 'Логи и аналитика', desc: 'Real-time мониторинг обращений' },
  { icon: FolderTree, title: '23 курса', desc: '7 направлений обучения' },
  { icon: Sparkles, title: 'LLM-fallback', desc: 'ИИ обрабатывает нестандартные вопросы' },
] as const

const SOCIAL_LINKS = [
  { label: 'MAX', href: 'https://max.ru/u/f9LHodD0cOLxcVXpSMqTSZLCFG_q6uz0QRQKOhGSBc5RIx4h-KYqVRvzW3k' },
  { label: 'Telegram', href: 'https://t.me/quadd4rv1n7' },
  { label: 'Сайт школы', href: 'https://school-maestro7it.ru' },
  { label: 'Научные работы', href: 'https://science-maestro-maestro7it.amvera.io' },
] as const

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Подгружаем публичную статистику
  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const res = await api.publicStats()
        if (mounted && res.ok && res.stats) {
          setStats(res.stats)
          setServerOnline(true)
        } else if (mounted) {
          setServerOnline(false)
        }
      } catch {
        if (mounted) setServerOnline(false)
      }
    }
    loadStats()
    const interval = setInterval(loadStats, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (typeof e.getModifierState === 'function') {
        setCapsLockOn(e.getModifierState('CapsLock'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await api.login(email, password, remember)
      if (res.ok) {
        onSuccess()
      } else {
        setError(res.error || 'Ошибка входа')
        setPassword('')
        setTimeout(() => passwordRef.current?.focus(), 0)
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка входа')
      setPassword('')
      setTimeout(() => passwordRef.current?.focus(), 0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* === Левая панель: брендовая === */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-amber-700 text-primary-foreground">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <div className="text-lg font-bold leading-tight">Maestro7IT</div>
                <div className="text-xs text-primary-foreground/70 leading-tight">
                  Школа программирования
                </div>
              </div>
            </Link>

            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
                Чат-бот<br />для мессенджера MAX
              </h1>
              <p className="text-base text-primary-foreground/80 max-w-md leading-relaxed">
                Информационная поддержка студентов по 23 курсам на платформе Stepik.
                Управление базой знаний, аналитика и рассылки — в одной панели.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-lg">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors"
              >
                <f.icon className="h-5 w-5 mb-2 opacity-90" />
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-primary-foreground/70 mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Состояние системы в реальном времени</span>
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-lg">
              <StatCard icon={BookOpen} value={stats?.faqCount} label="Курсов" />
              <StatCard icon={FolderTree} value={stats?.categoryCount} label="Направлений" />
              <StatCard icon={MessageSquare} value={stats?.messageCount24h} label="За 24ч" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-xs transition-colors"
              >
                {link.label}
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            ))}
          </div>
        </div>
      </aside>

      {/* === Правая панель: форма входа === */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-amber-500/5 pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-3">
            <Link href="/" className="flex flex-col items-center space-y-2">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <GraduationCap className="h-9 w-9 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">Maestro7IT Bot</div>
                <div className="text-sm text-muted-foreground">Админ-панель</div>
              </div>
            </Link>
          </div>

          {/* Back to home */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <Link href="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              На главную
            </Link>
            <ServerStatus online={serverOnline} />
          </div>

          <Card className="shadow-2xl border-border/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="space-y-1 text-center pb-2">
              <CardTitle className="text-2xl">Вход для администратора</CardTitle>
              <CardDescription>
                Войдите по email и паролю
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit} autoComplete="on">
              <CardContent className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input
                    ref={emailRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@maestro7it.ru"
                    autoComplete="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={loading}
                    className="h-10"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-sm">
                    <Lock className="h-3.5 w-3.5" />
                    Пароль
                  </Label>
                  <div className="relative">
                    <Input
                      ref={passwordRef}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyUp={(e) => {
                        if (typeof e.getModifierState === 'function') {
                          setCapsLockOn(e.getModifierState('CapsLock'))
                        }
                      }}
                      placeholder="Введите пароль"
                      autoComplete="current-password"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      disabled={loading}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {capsLockOn && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 animate-in fade-in slide-in-from-top-1 duration-200">
                      <ArrowUpCircle className="h-3.5 w-3.5" />
                      <span>Caps Lock включён</span>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {/* Remember + reset link */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={remember}
                      onCheckedChange={(v) => setRemember(v === true)}
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                      Запомнить меня
                    </Label>
                  </div>
                  <Link
                    href="/admin/reset"
                    className="text-xs text-primary hover:underline"
                  >
                    Забыли пароль?
                  </Link>
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading || !email || !password}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Вход…
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Войти
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <footer className="text-center text-xs text-muted-foreground space-y-1">
            <div>© 2026 Maestro7IT · Дуплей Максим Игоревич</div>
          </footer>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  value?: number
  label: string
}) {
  return (
    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
      <Icon className="h-4 w-4 mb-1 opacity-80" />
      <div className="text-xl font-bold leading-tight">
        {value !== undefined ? value : <Loader2 className="h-4 w-4 animate-spin inline" />}
      </div>
      <div className="text-[10px] text-primary-foreground/70 uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}

function ServerStatus({ online }: { online: boolean | null }) {
  if (online === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Проверка…
      </span>
    )
  }
  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Сервер онлайн
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-destructive">
      <span className="h-2 w-2 rounded-full bg-destructive" />
      Сервер недоступен
    </span>
  )
}
