'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap, Search, BookOpen, FolderTree, ArrowRight, ExternalLink,
  Loader2, Server, ServerCrash, Sparkles, MessageSquare, Zap, Send,
} from 'lucide-react'
import { api } from '@/lib/api-client'

// JSON-LD структурированные данные для SEO
const JSON_LD_DATA = {
  org: {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Maestro7IT',
    description: 'Школа программирования. 23 курса по программированию, DevOps, базам данных, AI и мультимедиа на платформе Stepik.',
    url: 'https://maestro7it-chatbot.space-z.ai',
    founder: {
      '@type': 'Person',
      name: 'Дуплей Максим Игоревич',
    },
  },
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Maestro7IT — Курсы программирования',
    inLanguage: 'ru-RU',
  },
}

interface PublicStats {
  faqCount: number
  categoryCount: number
  messageCount24h: number
}

interface Category {
  id: string
  name: string
  slug: string
  emoji: string | null
  _count?: { items: number }
}

interface FaqItem {
  id: string
  question: string
  answer: string
  keywords: string | null
  category?: { name: string; emoji: string | null } | null
}

export default function HomePage() {
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  const [visibleCount, setVisibleCount] = useState(12) // пагинация: по 12 за раз

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, catRes] = await Promise.all([
          api.publicStats(),
          api.listCategories(),
        ])
        if (statsRes.ok && statsRes.stats) {
          setStats(statsRes.stats)
          setServerOnline(true)
        }
        if (catRes.ok && catRes.categories) {
          setCategories(catRes.categories)
        }
      } catch {
        setServerOnline(false)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load FAQ when category changes
  useEffect(() => {
    async function loadFaqs() {
      try {
        const params: Record<string, string> = {}
        if (activeCategory) params.categoryId = activeCategory
        const res = await api.listFaq(params)
        if (res.ok && res.items) {
          setFaqs(res.items.slice(0, 50))
        }
      } catch {
        // ignore
      }
    }
    loadFaqs()
  }, [activeCategory])

  // Filter FAQ by search
  const filteredFaqs = search.trim()
    ? faqs.filter((f) => {
        const q = search.toLowerCase()
        return (
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          (f.keywords || '').toLowerCase().includes(q)
        )
      })
    : faqs

  // Сброс пагинации при смене фильтров
  useEffect(() => {
    setVisibleCount(12)
  }, [activeCategory, search])

  // Видимые карточки (пагинация)
  const visibleFaqs = filteredFaqs.slice(0, visibleCount)
  const hasMore = filteredFaqs.length > visibleCount

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* JSON-LD для SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_DATA.org) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_DATA.website) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">Maestro7IT</div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                Школа программирования
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ServerStatus online={serverOnline} />
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">
                Вход для администратора
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-amber-500/5 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="container mx-auto max-w-6xl px-4 py-16 lg:py-24 relative">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              {stats?.faqCount || '...'} курсов доступно
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Курсы программирования<br />
              <span className="text-primary">Maestro7IT</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Справочная информация по всем курсам школы на платформе Stepik.
              Найдите подходящий курс, изучите программу и записьтесь на обучение.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Смотреть курсы
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="https://school-maestro7it.ru" target="_blank" rel="noopener noreferrer">
                  Сайт школы
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="border-b border-border bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4 py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={BookOpen} value={stats.faqCount} label="Курсов" />
              <StatCard icon={FolderTree} value={stats.categoryCount} label="Направлений" />
              <StatCard icon={MessageSquare} value={stats.messageCount24h} label="Обращений за 24ч" />
              <StatCard icon={Server} value={null} label="Статус" online={serverOnline} />
            </div>
          </div>
        </section>
      )}

      {/* CTA — задать вопрос в MAX */}
      <section className="border-b border-border bg-primary/5">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-base mb-0.5">Не нашли ответ?</div>
              <div className="text-sm text-muted-foreground">
                Напишите боту в MAX — он подскажет курс и ответит на вопросы 24/7
              </div>
            </div>
            <Button asChild size="lg">
              <a
                href="https://max.ru/u/f9LHodD0cOLxcVXpSMqTSZLCFG_q6uz0QRQKOhGSBc5RIx4h-KYqVRvzW3k"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="h-4 w-4 mr-2" />
                Написать боту в MAX
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="flex-1 py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
                Каталог курсов
              </h2>
              <p className="text-sm text-muted-foreground">
                23 курса по 7 направлениям. Все на платформе Stepik.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск курса..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                !activeCategory
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-accent'
              }`}
            >
              Все ({categories.reduce((sum, c) => sum + (c._count?.items || 0), 0)})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  activeCategory === c.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {c.emoji} {c.name} ({c._count?.items || 0})
              </button>
            ))}
          </div>

          {/* FAQ list */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <div>Ничего не найдено</div>
                {search && (
                  <Button variant="link" onClick={() => setSearch('')}>
                    Сбросить поиск
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {visibleFaqs.map((faq) => (
                  <CourseCard key={faq.id} faq={faq} />
                ))}
              </div>

              {hasMore && (
                <div className="flex flex-col items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount((c) => c + 12)}
                  >
                    Показать ещё ({filteredFaqs.length - visibleCount})
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    Показано {visibleCount} из {filteredFaqs.length}
                  </div>
                </div>
              )}

              {!hasMore && filteredFaqs.length > 12 && (
                <div className="text-center text-xs text-muted-foreground mt-6">
                  Показаны все {filteredFaqs.length} курсов
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div className="font-semibold">Maestro7IT</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Школа программирования. Обучение разработке, ИИ и инженерным практикам.
              </p>
            </div>

            <div>
              <div className="text-sm font-semibold mb-3">Контакты</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><a href="https://school-maestro7it.ru" target="_blank" rel="noopener noreferrer" className="hover:text-foreground inline-flex items-center gap-1">school-maestro7it.ru <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://t.me/quadd4rv1n7" target="_blank" rel="noopener noreferrer" className="hover:text-foreground inline-flex items-center gap-1">Telegram <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://science-maestro-maestro7it.amvera.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground inline-flex items-center gap-1">Научные работы <ExternalLink className="h-3 w-3" /></a></li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold mb-3">Курсы на Stepik</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {categories.slice(0, 4).map((c) => (
                  <li key={c.id}>{c.emoji} {c.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold mb-3">Администратору</div>
              <div className="space-y-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin">
                    Вход в админ-панель
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
                <div>
                  <Link
                    href="/api-doc"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    API документация
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>© 2026 Maestro7IT · Дуплей Максим Игоревич</div>
            <div>Создано по образцу service-learning-max-chatbot</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// --- Components ---

function StatCard({
  icon: Icon,
  value,
  label,
  online,
}: {
  icon: React.ComponentType<{ className?: string }>
  value?: number | null
  label: string
  online?: boolean | null
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-tight">
              {value === null || value === undefined ? (
                online === true ? (
                  <span className="text-emerald-600 text-base font-semibold">онлайн</span>
                ) : online === false ? (
                  <span className="text-destructive text-base font-semibold">офлайн</span>
                ) : '—'
              ) : value}
            </div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CourseCard({ faq }: { faq: FaqItem }) {
  const [expanded, setExpanded] = useState(false)
  const categoryEmoji = faq.category?.emoji
  const categoryName = faq.category?.name

  // Извлекаем название курса из вопроса "Расскажи про курс «X»"
  const courseName = faq.question.replace(/^Расскажи про курс «/, '').replace(/»$/, '')

  // Парсим answer: "🐳 Docker для начинающих (DevOps)\n\n<description>\n\n<details>\n\n🔗 Все курсы..."
  // Формат: emoji + title + (category) + \n\n + description + \n\n + details + \n\n + link
  const answerLines = faq.answer.split('\n\n')
  // Первая строка — "emoji Title (Category)", пропускаем её (название уже есть в courseName)
  // description — 2-я строка
  // details — 3-я (если есть)
  // последняя — ссылка "🔗 Все курсы..."
  const description = answerLines[1] || ''
  const details = answerLines.slice(2, -1).join('\n\n')
  // Извлекаем эмодзи курса из первой строки
  const courseEmojiMatch = answerLines[0]?.match(/^(\S+)\s/)
  const courseEmoji = courseEmojiMatch ? courseEmojiMatch[1] : null

  // Полный текст для expanded view
  const fullText = [description, details].filter(Boolean).join('\n\n')

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-colors hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
            {courseEmoji || categoryEmoji || '📚'}
          </div>
          <div className="flex-1 min-w-0">
            {categoryName && (
              <Badge variant="secondary" className="text-[10px] mb-1.5">{categoryName}</Badge>
            )}
            <h3 className="font-semibold text-base leading-tight">{courseName}</h3>
          </div>
        </div>

        <div className={`text-sm text-muted-foreground ${expanded ? '' : 'line-clamp-3'}`}>
          {expanded ? fullText : description}
        </div>

        {expanded && details && (
          <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground/90">
            {details}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          {details && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Свернуть' : 'Подробнее'}
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a
              href="https://school-maestro7it.ru/courses/ru"
              target="_blank"
              rel="noopener noreferrer"
            >
              На Stepik
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ServerStatus({ online }: { online: boolean | null }) {
  if (online === null) return null
  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs">
      {online ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-emerald-600 dark:text-emerald-500">онлайн</span>
        </>
      ) : (
        <>
          <ServerCrash className="h-3 w-3 text-destructive" />
          <span className="text-destructive">офлайн</span>
        </>
      )}
    </div>
  )
}
