'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  GraduationCap, Loader2, Mail, Lock, Eye, EyeOff, AlertCircle,
  CheckCircle2, ArrowLeft, Shield, ArrowUpCircle,
} from 'lucide-react'
import { api } from '@/lib/api-client'

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <ResetContent />
    </Suspense>
  )
}

function ResetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  if (token) {
    return <SetNewPassword token={token} onSuccess={() => router.push('/admin')} />
  }
  return <RequestReset />
}

// --- Request reset (email form) ---

function RequestReset() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await api.requestReset(email)
      if (res.ok) {
        setDone(true)
        setEmailConfigured(res.emailConfigured ?? null)
      } else {
        setError('Ошибка запроса')
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="flex flex-col items-center space-y-2">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <GraduationCap className="h-9 w-9 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">Maestro7IT Bot</div>
              <div className="text-sm text-muted-foreground">Восстановление пароля</div>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-between text-xs">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад ко входу
          </Link>
        </div>

        <Card className="shadow-2xl border-border/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {done ? (
            <>
              <CardHeader className="space-y-1 text-center pb-2">
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-xl">Запрос отправлен</CardTitle>
                <CardDescription>
                  Если аккаунт с таким email существует, инструкция отправлена.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {emailConfigured === false && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400">
                    <strong>Режим разработки:</strong> SMTP не настроен.
                    Ссылка восстановления залогирована в консоли сервера.
                  </div>
                )}
                <div className="text-sm text-muted-foreground text-center space-y-2">
                  <p>Проверьте почту <strong>{email}</strong></p>
                  <p className="text-xs">Ссылка действительна 1 час.</p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Вернуться ко входу
                  </Link>
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setDone(false)
                    setEmail('')
                    setTimeout(() => emailRef.current?.focus(), 0)
                  }}
                >
                  Отправить ещё раз
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 text-center pb-2">
                <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
                <CardDescription>
                  Введите email администратора — отправим ссылку для сброса пароля
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5" />
                      Email администратора
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
                    {error && (
                      <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Отправка…
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Отправить ссылку
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Ссылка восстановления действительна 1 час
                  </p>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

// --- Set new password (token form) ---

function SetNewPassword({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [tokenError, setTokenError] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [capsLockOn, setCapsLockOn] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Verify token on mount
  useEffect(() => {
    async function verify() {
      try {
        const res = await api.verifyResetToken(token)
        if (res.ok && res.email) {
          setTokenValid(true)
          setEmail(res.email)
          setTimeout(() => passwordRef.current?.focus(), 100)
        } else {
          setTokenValid(false)
          setTokenError(res.error || 'Неверный токен')
        }
      } catch (e: any) {
        setTokenValid(false)
        setTokenError(e?.message || 'Ошибка проверки токена')
      } finally {
        setVerifying(false)
      }
    }
    verify()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || !confirmPassword || loading) return
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов')
      return
    }
    if (!/[a-zA-Zа-яА-Я]/.test(password) || !/[0-9]/.test(password)) {
      setError('Пароль должен содержать буквы и цифры')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await api.resetPassword(token, password)
      if (res.ok) {
        onSuccess()
      } else {
        setError(res.error || 'Ошибка')
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Проверка токена…</p>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-destructive/5 via-background to-background">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Ссылка недействительна</CardTitle>
            <CardDescription>{tokenError}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground text-center space-y-2">
            <p>Возможные причины:</p>
            <ul className="text-xs text-left space-y-1 list-disc list-inside">
              <li>Срок действия ссылки истёк (1 час)</li>
              <li>Ссылка уже была использована</li>
              <li>Ссылка некорректна</li>
            </ul>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/admin/reset">
                <Mail className="h-4 w-4 mr-2" />
                Запросить новую ссылку
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ко входу
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="flex flex-col items-center space-y-2">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <GraduationCap className="h-9 w-9 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">Maestro7IT Bot</div>
              <div className="text-sm text-muted-foreground">Новый пароль</div>
            </div>
          </Link>
        </div>

        <Card className="shadow-2xl border-border/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-2xl">Установка нового пароля</CardTitle>
            <CardDescription>
              Для аккаунта <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm">
                  <Lock className="h-3.5 w-3.5" />
                  Новый пароль
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
                    placeholder="Минимум 8 символов, буквы и цифры"
                    autoComplete="new-password"
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
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                    <span>Caps Lock включён</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm">
                  <Lock className="h-3.5 w-3.5" />
                  Подтвердите пароль
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-10"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/50">
                <div className="font-medium text-foreground">Требования к паролю:</div>
                <div>• Минимум 8 символов</div>
                <div>• Хотя бы одна буква</div>
                <div>• Хотя бы одна цифра</div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Сохранение…
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Установить пароль
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                После установки пароля потребуется новый вход
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
