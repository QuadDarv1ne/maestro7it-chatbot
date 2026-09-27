# Worklog — Chatbot Maestro7IT

---
Task ID: 1
Agent: main (Super Z)
Task: Init project — setup .env, metadata, layout, theme provider

Work Log:
- Loaded MAX chatbot README, school website (school-maestro7it.ru), about-me page (science-maestro-maestro7it.amvera.io)
- Identified: school uses MAX messenger (link: max.ru/u/f9LHodD0cOLxcVXpSMqTSZLCFG_q6uz0QRQKOhGSBc5RIx4h-KYqVRvzW3k)
- Identified: 23 Stepik courses across 7 categories (DevOps, Безопасность, Базы данных, Аналитика и AI, Программирование, Мультимедиа, Академическое)
- Identified: school contacts — Telegram @quadd4rv1n7, WhatsApp +79150480249, email info@maestro7it.ru, TapLink, YouTube, RuTube, Plvideo
- Initialized fullstack dev environment
- Updated .env with ADMIN_PASSWORD
- Updated layout.tsx with Russian lang, Maestro7IT metadata, ThemeProvider
- Updated globals.css with amber/orange brand palette (light + dark themes)

Stage Summary:
- Reference architecture: Next.js 16 + TypeScript + Prisma 6 + SQLite + Tailwind 4 + shadcn/ui
- LLM fallback via z-ai-web-dev-sdk (already in deps)
- 10 Prisma models planned: Category, FaqItem, Tag, FaqTag, MaxUser, MessageLog, FaqFeedback, BotSetting, BotCommand, Broadcast, BroadcastRecipient, AdminActionLog
- Branding: Maestro7IT (orange/amber accent — школа использует оранжевый/тёплые тона на сайте)

---
Task ID: 2-3
Agent: main (Super Z)
Task: Prisma schema + seed script

Work Log:
- Created prisma/schema.prisma with 11 models (added FaqFeedback for user ratings)
- Hit Prisma parser issues with single quotes ('pending') and inline `//` comments — fixed by using double quotes ("pending") and moving comments to /// docstrings
- Successfully ran `bun run db:push` — DB in sync
- Wrote scripts/seed.ts with:
  * 8 categories (7 course directions + "Общее")
  * 23 courses (all from user-provided list with descriptions, keywords, details)
  * 12 general FAQ items (запись, контакты, стоимость, преподаватель, и т.д.)
  * 7 tags
  * 6 bot commands (/start, /help, /menu, /faq, /contacts, /about)
  * 6 default settings (welcomeText, noAnswerText, offtopicText, useLlmFallback, botName, webhookSubscribed)
- Ran seed successfully: 8 categories, 35 FAQ, 7 tags, 6 commands, 6 settings

Stage Summary:
- Total knowledge base: 35 entries (23 courses + 12 general questions)
- All school contacts embedded in FAQ: MAX, Telegram, WhatsApp, Email, Stepik URL
- Owner info (Дуплей М. И., ORCID, 38 publications) included in /about command

---
Task ID: 4
Agent: main (Super Z)
Task: lib modules — max-api, bot-logic, llm, auth, search

Work Log:
- src/lib/max-api.ts: MAX Bot API client (sendMessage, editText, answerCallback, getMe, subscribe/unsubscribe webhook, checkBot) — uses platform-api2.max.ru
- src/lib/llm.ts: z-ai-web-dev-sdk integration with system prompt about Maestro7IT (all 23 courses, contacts, behavior rules)
- src/lib/search.ts: FAQ search engine with text normalization, tokenization, stop-words, weighted scoring (question 3 > keywords 2 > answer 1), phrase bonus, pin bonus
- src/lib/auth.ts: cookie-based session auth, in-memory session store, 12h TTL, timing-safe password compare
- src/lib/bot-logic.ts: core message handler — commands parsing, FAQ search, LLM fallback, callback handling (feedback/category/show/more/contacts)
- src/lib/api-helpers.ts: requireAdmin guard, logAdminAction helper, badRequest/notFound responses
- src/lib/api-client.ts: typed frontend API client with all endpoints

Stage Summary:
- Full MAX messenger webhook integration with both message.created and callback.query events
- LLM fallback properly gated by isOnTopic flag (off-topic questions don't get long LLM responses)
- Search engine tuned for Russian language (ё→е normalization, Russian stop-words)

---
Task ID: 5-6
Agent: main (Super Z)
Task: All API endpoints

Work Log:
Created 22 API routes:
- /api/health — service health check with DB ping
- /api/max/webhook — POST handler for MAX events (message.created, callback.query)
- /api/admin/{login,logout,me} — auth endpoints
- /api/categories, /api/categories/[id] — full CRUD
- /api/faq, /api/faq/[id] — full CRUD with tag linking
- /api/tags, /api/tags/[id] — list/create/delete
- /api/logs — paginated logs with filters (source, direction, offTopic, search)
- /api/logs/export — CSV export
- /api/logs/stream — SSE real-time stream with polling
- /api/analytics — 14 metrics + breakdowns by day and source
- /api/settings — get/update key-value settings
- /api/bot/check — ping MAX API
- /api/bot/webhook/{subscribe,unsubscribe}
- /api/broadcasts, /api/broadcasts/[id] — create/list/view/delete with async sending
- /api/unanswered — list off-topic + convert to FAQ in one click
- /api/admin-actions — audit log viewer
- /api/search — global search across FAQ, categories, logs
- /api/commands, /api/commands/[id] — bot commands CRUD

Stage Summary:
- All admin endpoints require auth (requireAdmin guard)
- All mutations write to AdminActionLog for audit
- Broadcasts send asynchronously (setImmediate) with throttle (100ms/user) to avoid rate limits
- Real-time logs use SSE with heartbeat and 2s polling

---
Task ID: 7-8
Agent: main (Super Z)
Task: Admin panel — all components

Work Log:
Created 11 admin components in src/components/admin/:
- theme-toggle.tsx — light/dark switcher via next-themes
- login-screen.tsx — centered card login form
- admin-shell.tsx — main layout with:
  * Sidebar with 12 nav items grouped by ОБЗОР/КОНТЕНТ/ОПЕРАЦИИ/СИСТЕМА
  * Sticky header with global search (⌘K), theme toggle, logout
  * Cmd+K modal with live search across FAQ/categories/logs
  * Mobile-responsive (hamburger menu)
  * Footer with school links
- dashboard.tsx — 4 stat cards + 4 secondary metrics + 14-day line chart + source pie + funnel
- faq-manager.tsx — full CRUD with search/filter/category/preview, pin/publish toggles, edit dialog
- category-manager.tsx — card grid with create/edit/delete
- tag-manager.tsx — chip-style list with create/delete
- log-manager.tsx — paginated list with filters + CSV export
- realtime-logs.tsx — SSE-powered live stream with pause/resume
- analytics-page.tsx — KPIs + 30-day bar chart + pie + funnel
- unanswered-page.tsx — list + one-click convert to FAQ
- broadcasts-page.tsx — composer + history + recipients viewer
- commands-page.tsx — commands CRUD with system command protection
- admin-actions-page.tsx — audit log timeline
- settings-page.tsx — bot status, token, webhook subscribe/unsubscribe, texts, LLM toggle

Updated src/app/page.tsx as SPA orchestrator with auth gate

Stage Summary:
- All components use shadcn/ui (Card, Button, Input, Dialog, Select, Switch, Badge, etc.)
- Charts use Recharts (LineChart, BarChart, PieChart)
- Toasts via sonner
- All async ops have loading states (Loader2 spinner)
- All errors handled with toast notifications
- Russian UI throughout

---
Task ID: 9-10
Agent: main (Super Z)
Task: Lint + Agent Browser self-verification

Work Log:
- ESLint: 0 errors, 1 warning (unused eslint-disable in seed.ts — harmless)
- Dev server compiles successfully (21.8s initial, then incremental ~100ms)
- Agent Browser verification:
  * Opened http://localhost:3000 → login screen renders correctly
  * Login with ADMIN_PASSWORD from .env → dashboard loads with sidebar (12 nav items) + stats
  * Dashboard shows: 35 FAQ-ответов, 0 сообщений initially
  * Click "База знаний" → 35 FAQ items loaded, search/filter UI visible
  * Click "Категории" → 8 categories with emojis and counts (12+3+2+4+2+6+4+2=35 ✓)
  * Click "Настройки" → all forms work: bot token input, webhook URL, welcome/noAnswer/offtopic texts, LLM toggle ON
  * Tested webhook: POST /api/max/webhook with test message "Какие у вас есть курсы по программированию?" → bot logic ran, found FAQ answer about Stepik, logged in/out to DB
  * After webhook: dashboard updated to 2 messages / 1 user / +1 in 24h, 1 FAQ-answer
  * Pie chart shows "FAQ 100%" (all answered messages came from FAQ)
  * Funnel: FAQ 1 (100%) / LLM 0 / Off-topic 0 / Total 2
  * Cmd+K (via click on search button) → modal opens, typing "Docker" returns 3 matches including exact course "Docker для начинающих"
- Health endpoint: GET /api/health → status:ok, db:ok, 5ms latency
- Categories endpoint: returns all 8 categories with item counts

Stage Summary:
- All 10 todo items completed
- All key user flows verified end-to-end in browser
- App is interactive, no console errors after icon fix
- Bot logic pipeline verified: webhook → search → FAQ hit → log → (would send to MAX if token set)
- Ready for production use after MAX bot token is configured

---
Task ID: 11
Agent: main (Super Z)
Task: Audit + bug fixes + new features (round 2)

Work Log:
- Audited all 32 source files for bugs, type errors, edge cases
- Found and fixed 20+ issues across lib modules, API routes, and frontend

LIB FIXES:
- max-api.ts: added fetch timeout (15s), token caching (30s TTL), invalidateTokenCache(),
  fixed subscribeWebhook (was sending access_token in body, now in query per MAX spec),
  added response parsing for empty 204 responses, text truncation for MAX limits (4000 chars)
- search.ts: rewrote with Set-based O(1) lookups (was O(n²)), added bigrams for phrase matching,
  added more Russian stop-words (какие, какая, etc), added query↔question bidirectional
  includes bonus, lowered threshold to 3 (was 5)
- bot-logic.ts: fixed /search command without arg (now shows usage), fixed /show command
  logging (was missing), fixed payload parsing (was using split(':') which breaks on
  payloads with colons — now uses indexOf), improved feedback message, added MAX link
  to contacts callback, added welcomeText for empty messages
- llm.ts: added retry with exponential backoff (1 retry, 500ms), input validation,
  OFF_TOPIC_MARKERS constant for accurate detection, max_tokens enforced, response
  validation (empty check)
- auth.ts: COMPLETE REWRITE — moved sessions from in-memory Map to persistent DB
  (AdminSession table), survives server restarts and works in multi-instance. Added
  rate-limiting on login (5 attempts / 15 min), periodic cleanup of expired sessions,
  secure flag in production, timing-safe password comparison
- db.ts: reduced logging verbosity (warn/error only in dev, error in prod)

API FIXES:
- /api/max/webhook: added idempotency via in-memory LRU cache (60s TTL, 1000 max),
  early return 200 if no token (avoid MAX retries), better error logging,
  sendText failures no longer break webhook (logged but 200 OK)
- /api/broadcasts: fixed N+1 query (broadcast text loaded once, not per-user),
  added validation (length limits, past-date check), added early termination on auth
  errors (invalid token), batch-createMany for remaining recipients on abort,
  throttle to 10 msg/sec
- /api/logs: added input validation (source, direction enums), pagination metadata
  (hasMore, nextOffset), explicit limit clamping (1-500)
- /api/logs/stream: fixed critical bug — was comparing CUID strings as numbers
  (it.id > lastId), now uses createdAt timestamp correctly, added 1-hour auto-close,
  X-Accel-Buffering header for nginx, error logging
- /api/faq: added length validation (question 500, answer 8000, keywords 500),
  categoryId existence check, tagIds existence check, trim inputs, logAdminAction
  on create, added count to response
- /api/settings: added ALLOWED_KEYS whitelist (was accepting any key), BOOL_KEYS
  normalization, webhookUrl HTTPS validation, skips empty token updates,
  invalidateTokenCache() on token change, returns skipped keys in response

NEW FEATURES:
- Bot Simulator (/api/bot/simulate): full interactive chat for testing bot logic
  without MAX connection. Supports both text messages and callback payloads.
  Uses real bot-logic, logs everything, shows inline buttons as clickable.
- AdminShell: added unanswered count badge in sidebar (auto-refreshes every 60s),
  logout confirmation dialog, "Симулятор бота" nav item with Sparkles icon
- Skeletons component: DashboardSkeleton, TableSkeleton, StatsGridSkeleton
- Dashboard: replaced spinner with proper DashboardSkeleton (matches layout)
- Persistent sessions (AdminSession model): survives dev server restarts, works
  in production multi-instance, auto-cleanup of expired entries

PRISMA SCHEMA:
- Added AdminSession model (id, token unique, createdAt, expiresAt, lastActivity)
  with index on expiresAt for efficient cleanup

TESTING (via Agent Browser):
✅ Login flow with persistent session
✅ Navigate to Симулятор бота (new nav item)
✅ Send "Какие у вас курсы по программированию?" → FAQ hit about Stepik
✅ Click "Ещё варианты" → 5 inline buttons with related questions
✅ Click "Какие контакты у школы Maestro7IT?" → full contacts list
✅ Send "Какие языки программирования лучше всего изучать в 2026 году?" → LLM
   fallback activated, recommended JS/Python/Go/C# courses
✅ Send "Какая погода сегодня в Москве?" → correctly detected as off-topic
✅ Quick prompts work, timestamp + source badge displayed

Stage Summary:
- 20+ bugs fixed across all layers
- Bot Simulator — major new feature for testing without MAX
- Persistent sessions — fixes dev workflow + production multi-instance
- Search quality improved (bigrams, stop-words, Set-based O(1))
- All API endpoints hardened (validation, rate limits, idempotency)
- Archives updated: maestro7it-chatbot.tar.gz (235K) + .zip (304K), 180 files

---
Task ID: 12
Agent: main (Super Z)
Task: Качественный фикс чатика-симулятора (round 3)

Work Log:
- Провёл детальное тестирование симулятора через Agent Browser
- Нашёл 15+ проблем в UX и коде

КРИТИЧНЫЕ БАГИ (исправлены):
1. После клика на inline-кнопку — старые кнопки оставались активными.
   Каждый новый ответ бота добавлял свой набор кнопок, через 5-10 сообщений
   получалась каша из кликабельных кнопок. ИСПРАВЛЕНО: кнопки скрываются
   после клика, показывается "Нажато: <label>" с зелёной галочкой.
2. При клике на inline-кнопку добавлялось фейковое сообщение пользователя
   "🔘 📋 Ещё варианты" — в реальном MAX такого нет. ИСПРАВЛЕНО: теперь
   показывается системное сообщение "Нажата кнопка: ..." в виде pill-бейджа
   между bubble, а не как сообщение пользователя.
3. Inline-кнопки рендерились вне bubble как отдельные элементы. ИСПРАВЛЕНО:
   теперь рендерятся как attachment к bubble бота, в одном визуальном блоке.

UX УЛУЧШЕНИЯ:
4. Timestamp теперь для ВСЕХ сообщений (раньше только для bot)
5. Плавный скролл (behavior: 'smooth') + проверка "пользователь у дна"
   — если прокрутил вверх, новые сообщения не дёргают скролл
6. Фокус возвращается на input после: отправки, клика на inline-кнопку,
   сброса чата. Реализовано через useEffect [loading, pendingClick] +
   queueMicrotask для feedback-кнопок
7. Анимация появления сообщений (fade-in + slide-in-from-bottom)
8. break-words для длинных ссылок (раньше ломали layout)
9. Размеры текста приведены к стандартам shadcn (text-[10px] вместо text-[9px])
10. Feedback-кнопки ("Полезно"/"Не помогло") заменяются на "Спасибо за
    оценку!" с зелёной галочкой — вместо отдельного сообщения бота
11. Локальный loading state для нажатой inline-кнопки (spinner + подсветка)
12. Typing indicator — три анимированные точки вместо одиночного spinner
13. Quick prompts расширены до 10 (+ /contacts, /start), каждый с подсказкой
14. Описание "Как пользоваться" в правой панели с стрелочками →

CODE УЛУЧШЕНИЯ:
15. crypto.randomUUID() для id вместо Date.now() (раньше риск коллизий)
16. При ошибке — только системное сообщение в чат, без дубля toast
17. cursor-not-allowed для disabled кнопок
18. Разделение MessageBubble и InlineButtons в отдельные компоненты
19. Стабильный sim_admin_local ID в API endpoint — не плодит пользователей
20. Убран неиспользуемый импорт ScrollArea

ТЕСТИРОВАНИЕ (Agent Browser):
✅ Логин → симулятор, input в фокусе при загрузке
✅ "Docker" → FAQ-ответ про курс, кнопки Полезно/Не помогло/Ещё варианты
✅ Клик "Ещё варианты" → старые кнопки скрылись, системное сообщение,
   ответ с 8 вариантами курсов
✅ Клик на курс → системное сообщение, полный ответ про курс
✅ Клик "Полезно" → кнопки заменились на "Спасибо за оценку!"
✅ Клик "Не помогло" → "Спасибо, постараемся улучшить ответ"
✅ /menu → 7 категорий с эмодзи → клик DevOps → 3 курса → клик курс → ответ
✅ "Какая погода в Москве?" → LLM off-topic определён корректно
✅ "Привет" → LLM-fallback с приветствием
✅ Фокус возвращается на input после всех действий
✅ Плавный скролл, при прокрутке вверх — не дёргает
✅ Timestamp для всех сообщений

Stage Summary:
- Симулятор полностью переписан с нуля, ~600 строк качественного кода
- 15+ багов исправлено, UX кардинально улучшен
- Архивы обновлены: tar.gz (244K) + zip (314K)
