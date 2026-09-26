'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Loader2, Lock } from 'lucide-react'
import { api } from '@/lib/api-client'

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const res = await api.login(password)
      if (res.ok) {
        onSuccess()
      } else {
        setError(res.error || 'Ошибка входа')
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/30 via-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/60">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-9 w-9 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Maestro7IT Bot</CardTitle>
          <CardDescription>
            Админ-панель чат-бота школы программирования
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> Пароль администратора
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                autoFocus
                disabled={loading}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground">
                По умолчанию <code className="px-1 py-0.5 rounded bg-muted">admin123</code> — смените в <code className="px-1 py-0.5 rounded bg-muted">.env</code>.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !password}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Войти
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
