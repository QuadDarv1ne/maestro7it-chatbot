'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, Search, AlertCircle, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
      <Card className="w-full max-w-md shadow-2xl border-border/60">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <AlertCircle className="h-9 w-9 text-primary" />
            </div>
          </div>

          <div className="text-6xl font-bold text-primary">404</div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Страница не найдена</h1>
            <p className="text-sm text-muted-foreground">
              Возможно, страница была перемещена или удалена.
              Попробуйте начать с главной или поискать курс.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                На главную
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/#courses">
                <Search className="h-4 w-4 mr-2" />
                Каталог курсов
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
