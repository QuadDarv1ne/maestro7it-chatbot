'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { LoginScreen } from '@/components/admin/login-screen'
import { AdminShell, type TabId } from '@/components/admin/admin-shell'
import { Dashboard } from '@/components/admin/dashboard'
import { FaqManager } from '@/components/admin/faq-manager'
import { CategoryManager } from '@/components/admin/category-manager'
import { TagManager } from '@/components/admin/tag-manager'
import { LogManager } from '@/components/admin/log-manager'
import { RealtimeLogs } from '@/components/admin/realtime-logs'
import { AnalyticsPage } from '@/components/admin/analytics-page'
import { UnansweredPage } from '@/components/admin/unanswered-page'
import { BroadcastsPage } from '@/components/admin/broadcasts-page'
import { CommandsPage } from '@/components/admin/commands-page'
import { AdminActionsPage } from '@/components/admin/admin-actions-page'
import { SettingsPage } from '@/components/admin/settings-page'
import { BotSimulator } from '@/components/admin/bot-simulator'
import { AccountsManager } from '@/components/admin/accounts-manager'

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [tab, setTab] = useState<TabId>('dashboard')

  useEffect(() => {
    api.me()
      .then((r) => setAuthed(r.authenticated))
      .catch(() => setAuthed(false))
  }, [])

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />
  }

  return (
    <AdminShell
      tab={tab}
      onTabChange={setTab}
      onLogout={() => setAuthed(false)}
    >
      {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
      {tab === 'faq' && <FaqManager />}
      {tab === 'categories' && <CategoryManager />}
      {tab === 'tags' && <TagManager />}
      {tab === 'logs' && <LogManager />}
      {tab === 'realtime' && <RealtimeLogs />}
      {tab === 'analytics' && <AnalyticsPage />}
      {tab === 'unanswered' && <UnansweredPage />}
      {tab === 'broadcasts' && <BroadcastsPage />}
      {tab === 'commands' && <CommandsPage />}
      {tab === 'simulator' && <BotSimulator />}
      {tab === 'accounts' && <AccountsManager />}
      {tab === 'actions' && <AdminActionsPage />}
      {tab === 'settings' && <SettingsPage />}
    </AdminShell>
  )
}
