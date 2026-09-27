'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app-error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-destructive/5 via-background to-background">
      <Card className="w-full max-w-md shadow-2xl border-border/60">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-9 w-9 text-destructive" />
            </div>
          </div>

          <h1 className="text-xl font-semibold">Что-то пошло не так</h1>

          <p className="text-sm text-muted-foreground">
            Произошла ошибка при загрузке страницы.
            Попробуйте обновить страницу или вернуться позже.
          </p>

          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Код ошибки: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Попробовать снова
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                На главную
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
