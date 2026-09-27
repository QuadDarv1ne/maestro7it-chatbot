'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  GraduationCap, LayoutDashboard, BookOpen, FolderTree, Tag,
  ScrollText, BarChart3, Settings, Megaphone, HelpCircle, Terminal,
  History, Search, LogOut, Menu, X, Loader2, ExternalLink, Sparkles,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { ThemeToggle } from './theme-toggle'
import { toast } from 'sonner'

export type TabId =
  | 'dashboard'
  | 'faq'
  | 'categories'
  | 'tags'
  | 'logs'
  | 'realtime'
  | 'analytics'
  | 'unanswered'
  | 'broadcasts'
  | 'commands'
  | 'accounts'
  | 'simulator'
  | 'settings'
  | 'actions'

interface NavItem {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
  group?: string
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, group: 'Обзор' },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3, group: 'Обзор' },
  { id: 'realtime', label: 'Real-time логи', icon: ScrollText, group: 'Обзор' },

  { id: 'faq', label: 'База знаний', icon: BookOpen, group: 'Контент' },
  { id: 'categories', label: 'Категории', icon: FolderTree, group: 'Контент' },
  { id: 'tags', label: 'Теги', icon: Tag, group: 'Контент' },
  { id: 'unanswered', label: 'Без ответа', icon: HelpCircle, group: 'Контент' },
  { id: 'commands', label: 'Команды бота', icon: Terminal, group: 'Контент' },

  { id: 'logs', label: 'Логи обращений', icon: ScrollText, group: 'Операции' },
  { id: 'broadcasts', label: 'Рассылки', icon: Megaphone, group: 'Операции' },
  { id: 'actions', label: 'Журнал действий', icon: History, group: 'Операции' },

  { id: 'simulator', label: 'Симулятор бота', icon: Sparkles, group: 'Система' },
  { id: 'accounts', label: 'Администраторы', icon: Users, group: 'Система' },
  { id: 'settings', label: 'Настройки', icon: Settings, group: 'Система' },
]

interface AdminShellProps {
  tab: TabId
  onTabChange: (t: TabId) => void
  onLogout: () => void
  children: React.ReactNode
}

export function AdminShell({ tab, onTabChange, onLogout, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [unansweredCount, setUnansweredCount] = useState<number>(0)
  const [currentAccount, setCurrentAccount] = useState<{ email: string; name: string | null; role: string } | null>(null)

  // Загружаем текущий аккаунт для шапки
  useEffect(() => {
    let mounted = true
    async function loadAccount() {
      try {
        const res = await api.me()
        if (mounted && res.authenticated && res.account) {
          setCurrentAccount({
            email: res.account.email,
            name: res.account.name,
            role: res.account.role,
          })
        }
      } catch {}
    }
    loadAccount()
    return () => { mounted = false }
  }, [])

  // Загружаем счётчик "без ответа" для бейджа в навигации
  useEffect(() => {
    let mounted = true
    async function loadCount() {
      try {
        const res = await api.listUnanswered()
        if (mounted) setUnansweredCount(res.items?.length || 0)
      } catch {}
    }
    loadCount()
    const interval = setInterval(loadCount, 60_000) // обновляем каждую минуту
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Cmd/Ctrl + K — глобальный поиск
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const runSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) {
      setSearchResults(null)
      return
    }
    setSearchLoading(true)
    try {
      const res = await api.search(q)
      setSearchResults(res.results)
    } catch {
      // ignore
    } finally {
      setSearchLoading(false)
    }
  }, [])

  async function handleLogout() {
    if (!confirm('Выйти из админ-панели?')) return
    try {
      await api.logout()
    } catch {}
    onLogout()
  }

  // Группировка навигации
  const groups = NAV.reduce((acc, item) => {
    const g = item.group || 'Прочее'
    if (!acc[g]) acc[g] = []
    acc[g].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 shrink-0 border-r border-border bg-sidebar transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <a href="https://school-maestro7it.ru" target="_blank" rel="noopener" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Maestro7IT</div>
              <div className="text-xs text-muted-foreground leading-tight">Bot Admin</div>
            </div>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-3 space-y-5">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <div className="px-2 mb-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                {group}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      tab === item.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.id === 'unanswered' && unansweredCount > 0 && (
                      <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full ${
                        tab === item.id
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-destructive text-destructive-foreground'
                      }`}>
                        {unansweredCount > 99 ? '99+' : unansweredCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
          <div className="h-full px-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex-1 max-w-md flex items-center gap-2 px-3 h-9 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Поиск по базе…</span>
              <kbd className="px-1.5 py-0.5 text-[10px] rounded border border-border bg-background">⌘K</kbd>
            </button>

            <div className="flex-1" />

            <a
              href="https://school-maestro7it.ru"
              target="_blank"
              rel="noopener"
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Сайт школы <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <ThemeToggle />

            {currentAccount && (
              <div className="hidden md:flex items-center gap-2 px-3 h-8 rounded-md border border-border bg-muted/30 text-xs">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                  {(currentAccount.name || currentAccount.email)[0].toUpperCase()}
                </div>
                <div className="leading-tight">
                  <div className="font-medium">{currentAccount.name || currentAccount.email}</div>
                  <div className="text-[10px] text-muted-foreground">{currentAccount.role}</div>
                </div>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={handleLogout} title="Выйти">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Выйти</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-border bg-background/60 py-3 px-6 text-xs text-muted-foreground flex flex-wrap items-center gap-3">
          <span>© 2026 Maestro7IT · Дуплей М. И.</span>
          <span className="opacity-50">·</span>
          <a href="https://school-maestro7it.ru" target="_blank" rel="noopener" className="hover:text-foreground">school-maestro7it.ru</a>
          <span className="opacity-50">·</span>
          <a href="https://science-maestro-maestro7it.amvera.io" target="_blank" rel="noopener" className="hover:text-foreground">научные работы</a>
        </footer>
      </div>

      {/* Global search modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-[15vh]"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => runSearch(e.target.value)}
                placeholder="Искать: вопрос, ответ, категория, лог…"
                className="flex-1 bg-transparent border-0 outline-none text-sm h-12"
              />
              {searchLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <button
                onClick={() => setSearchOpen(false)}
                className="text-muted-foreground hover:text-foreground px-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {!searchResults && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Начните вводить запрос…
                </div>
              )}
              {searchResults && (
                <>
                  {searchResults.faq.length === 0 && searchResults.categories.length === 0 && searchResults.logs.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Ничего не найдено
                    </div>
                  )}
                  {searchResults.faq.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">База знаний</div>
                      {searchResults.faq.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onTabChange('faq')
                            setSearchOpen(false)
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-accent"
                        >
                          <div className="text-sm font-medium truncate">{item.question}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.answer.slice(0, 100)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.categories.length > 0 && (
                    <div className="p-2 border-t border-border">
                      <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">Категории</div>
                      {searchResults.categories.map((c: any) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onTabChange('categories')
                            setSearchOpen(false)
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-accent"
                        >
                          <div className="text-sm font-medium">{c.emoji} {c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.slug}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.logs.length > 0 && (
                    <div className="p-2 border-t border-border">
                      <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">Логи</div>
                      {searchResults.logs.map((l: any) => (
                        <button
                          key={l.id}
                          onClick={() => {
                            onTabChange('logs')
                            setSearchOpen(false)
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-accent"
                        >
                          <div className="text-sm truncate">{l.text}</div>
                          <div className="text-xs text-muted-foreground">{l.source} · {new Date(l.createdAt).toLocaleString('ru-RU')}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
