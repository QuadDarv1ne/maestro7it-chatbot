# История версий

Все заметные изменения проекта фиксируются в этом файле.

Формат версий: `vMAJOR.MINOR.PATCH` (SemVer)
- **MAJOR** — несовместимые изменения API/структуры БД
- **MINOR** — новая функциональность, обратная совместимость
- **PATCH** — исправления багов, без новой функциональности

Архивы каждой версии: `maestro7it-chatbot-vX.Y.Z.tar.gz` и `maestro7it-chatbot-vX.Y.Z.zip`
в папке `download/`.

---

## [v1.7.0] — 2026-09-26

### ✨ Добавлено
- **API документация** `/api-doc`:
  - Список всех 40+ endpoints сгруппированных по категориям
  - Цветовые метки методов (GET/POST/PUT/DELETE)
  - Бейжи доступа (public/admin/super_admin)
  - Ссылка из footer главной страницы
- **Кастомная 404 страница** `not-found.tsx`:
  - Брендинг Maestro7IT
  - Кнопки "На главную" и "Каталог курсов"
- **Кастомная error.tsx** для runtime ошибок:
  - Кнопка "Попробовать снова" (reset)
  - Код ошибки (digest) для отладки
- **Пагинация каталога курсов** на публичной странице:
  - По 12 карточек за раз
  - Кнопка "Показать ещё (N)" с счётчиком
  - Текст "Показано X из Y" / "Показаны все N курсов"
  - Авто-сброс при смене категории или поиска
- **Детальный health check** `/api/health`:
  - status: ok | degraded | error
  - version из package.json
  - uptime сервера
  - checks: db (faqCount, categoryCount, accountCount, activeSessions)
  - checks: bot (tokenConfigured)
  - checks: email (smtpConfigured)
  - checks: webhook (signatureVerification)
  - Cache-Control: no-store

### 🔧 Исправлено
- **sitemap.xml и robots.txt** теперь определяют base URL из request headers
  (x-forwarded-host) — на проде отдают корректный `https://maestro7it-chatbot.space-z.ai`
  вместо `http://localhost:3000`
- Удалён статичный `public/robots.txt` (конфликтовал с динамическим `app/robots.ts`)

### 📊 Статистика
- 24 unit-теста (password + search) — все проходят
- 213 файлов в архиве

---

## [v1.6.0] — 2026-09-26

### ✨ Добавлено
- **SEO оптимизация**:
  - Расширенные meta-теги в layout.tsx (title template, Open Graph, Twitter Cards)
  - `metadataBase` для корректных URL в OG-тегах
  - `viewport` с themeColor (amber для light, dark для dark)
  - `manifest.webmanifest` для PWA (установка на телефон как приложение)
  - `sitemap.xml` — автогенерация с главной + категориями
  - `robots.txt` — разрешает индексацию, запрещает /admin и /api/
  - JSON-LD структурированные данные: EducationalOrganization, WebSite, BreadcrumbList
- **Кэширование public stats**:
  - In-memory кэш на 30 секунд (уменьшает нагрузку на БД)
  - HTTP Cache-Control headers (`s-maxage=30, stale-while-revalidate=60`)
- **Webhook signature verification** (безопасность):
  - HMAC-SHA256 проверка через `WEBHOOK_SECRET` env variable
  - Заголовок `X-Max-Signature` проверяется с timing-safe comparison
  - Если секрет не задан — проверка пропускается (для dev)
- **Экспорт/импорт базы знаний**:
  - API: `GET /api/kb/export` — скачивание JSON с категориями, курсами, тегами
  - API: `POST /api/kb/import` — импорт с режимами `replace` (полная замена) или `merge` (добавить новые)
  - UI в Настройках: кнопки экспорта и импорта, выбор режима, файловый ввод
  - Полезно для backup и переноса между окружениями

### 🔧 Изменено
- `layout.tsx`: полная переработка metadata для SEO
- `webhook route`: читает raw body для проверки подписи перед парсингом JSON
- `.env.example`: добавлен `WEBHOOK_SECRET`

---

## [v1.5.0] — 2026-09-26

### ✨ Добавлено
- **Управление администраторами** (только для super_admin):
  - Раздел "Администраторы" в навигации
  - Список всех аккаунтов с ролью, статусом, последним входом
  - Создание новых аккаунтов (email + пароль + имя + роль)
  - Изменение роли (admin ↔ super_admin)
  - Активация/деактивация аккаунтов
  - Удаление аккаунтов (защита: нельзя удалить себя)
  - API: `GET/POST /api/admin/accounts`, `PUT/DELETE /api/admin/accounts/[id]`
- **Смена пароля в настройках**:
  - Секция "Смена пароля" на странице Настроек
  - Требует текущий пароль для подтверждения
  - Валидация силы нового пароля
  - После смены — инвалидация всех других сессий
  - API: `POST /api/admin/change-password`
- **Отображение текущего пользователя в шапке**:
  - Аватарка с первой буквой имени
  - Имя + роль
  - Видно на desktop (md+)
- **CTA "Написать боту в MAX"** на публичной странице
- **Карточки курсов улучшены**:
  - Парсинг ответа — чистое описание без технического мусора
  - Эмодзи курса извлекается из ответа
  - Expand/collapse с разделением description и details
  - Hover-эффект с тенью

### 🔒 Безопасность
- **Убрана подсказка** "Защищено rate-limiting и timing-safe сравнением пароля" со страницы логина
- **Public stats endpoint** больше не возвращает `userCount` (sensitive leakage)
- **Защита в accounts API**: нельзя удалить себя, нельзя деактивировать себя, нельзя снять с себя super_admin
- **Все accounts endpoints** требуют super_admin роль

### 🐛 Исправлено
- Баг: `currentAccount` не загружался в шапку из-за проверки `res.ok` вместо `res.authenticated`
- Карточки курсов показывали сырой ответ с "...🔗 Все курсы школы на Stepik:..."
- Login screen показывал `userCount` (sensitive) в брендовой панели

---

## [v1.4.0] — 2026-09-26

### ✨ Добавлено
- **Публичная справочная страница** `/` (без логина):
  - Hero с описанием школы и кнопками "Смотреть курсы" / "Сайт школы"
  - Живая статистика (курсы, направления, обращения, статус сервера)
  - Каталог 23 курсов с фильтрами по 7 категориям
  - Поиск по названию, описанию, ключевым словам
  - Карточки курсов с expand/collapse, ссылками на Stepik
  - Footer с контактами и ссылками на соцсети
  - Кнопка "Вход для администратора" в шапке
- **Система аккаунтов администратора**:
  - Логин по **email + пароль** (вместо единого ADMIN_PASSWORD)
  - Модель `AdminAccount` (email unique, passwordHash, name, role, isActive)
  - Роли: `super_admin` и `admin`
  - Поддержка нескольких администраторов
  - `lastLoginAt` — время последнего входа
- **Восстановление пароля по email**:
  - `/admin/reset` — форма запроса (ввод email)
  - `/admin/reset?token=...` — установка нового пароля
  - API: `POST /api/admin/reset-request`, `GET/POST /api/admin/reset-confirm`
  - Токен 32 байта crypto-random, TTL 1 час
  - После сброса — инвалидация всех сессий аккаунта
  - Безопасность: одинаковый ответ независимо от существования email
- **SMTP-отправка email** через nodemailer:
  - Поддержка любого SMTP (Gmail, Yandex, Mailtrap)
  - HTML-шаблон письма восстановления
  - Dev-режим: если SMTP не настроен, ссылка логируется в консоль
  - Переменные: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- **Password hashing** через scrypt (Node.js built-in, без внешних зависимостей):
  - `hashPassword()`, `verifyPassword()` (timing-safe)
  - `validatePasswordStrength()` — минимум 8 символов, буквы + цифры
  - `validateEmail()` — базовая валидация
- **Админ-панель перенесена** на `/admin`
- **Обновлённый login screen**:
  - Поле Email + Поле Пароль
  - Ссылка "Забыли пароль?" → `/admin/reset`
  - Ссылка "На главную" → `/`
- **Endpoint `/api/admin/me`** теперь возвращает данные аккаунта (email, name, role)

### 🔧 Изменено
- `auth.ts`: login(email, password, remember) — полная переработка под аккаунты
- `AdminSession`: добавлена связь `accountId` с `AdminAccount`
- `.env`: добавлены `ADMIN_EMAIL`, `ADMIN_NAME`, `SMTP_*`, `NEXT_PUBLIC_BASE_URL`
- `seed.ts`: создаёт super-admin аккаунт из .env (email + пароль + name)

### 🗑️ Удалено
- Хардкод `ADMIN_PASSWORD` как единственный способ входа (теперь только для seed)

---

## [v1.3.0] — 2026-09-26

### ✨ Добавлено
- **Симулятор бота** — интерактивный чат для тестирования логики без MAX
  - Quick prompts с подсказками
  - Inline-кнопки кликабельны, после клика гаснут
  - Typing indicator с анимированными точками
  - Системные сообщения для действий и ошибок
  - Восстановление кнопок при ошибке API
- **Двухпанельный login screen**:
  - Брендовая панель с градиентом Maestro7IT
  - Живая статистика (FAQ, категории, сообщения, пользователи)
  - Show/hide пароля
  - Caps Lock индикатор
  - "Запомнить меня на 30 дней" (продлённая сессия)
  - Статус сервера онлайн/офлайн
  - Анимации появления
- **Публичный API** `/api/public/stats` — статистика без авторизации для login screen
- **Бейдж "Без ответа"** в sidebar с автообновлением
- **Skeleton loaders** для dashboard
- **Logout confirmation** диалог
- **Persistent сессии** в БД (модель `AdminSession`) — переживают рестарт сервера
- **Rate limiting** на login (5 попыток / 15 минут)
- **Idempotency** в webhook (защита от дублей событий MAX)
- **Pagination metadata** в `/api/logs` (hasMore, nextOffset)

### 🔧 Исправлено
- **max-api.ts**: timeout 15s, кэширование токена, исправлен `subscribeWebhook`
- **search.ts**: Set-based O(1) lookup (было O(n²)), биграммы для фраз
- **bot-logic.ts**: payload parsing через indexOf, логирование `/show`
- **llm.ts**: retry с exponential backoff, валидация пустого ответа
- **broadcasts**: устранён N+1 query, batch-обработка, early termination
- **logs/stream**: критический баг сравнения CUID-строк как чисел
- **API routes**: валидация длин, whitelist ключей, проверка существования
- **Симулятор**: 15+ UX-багов (накопление кнопок, фейковые сообщения, фокус)

### 🔒 Безопасность
- **Пароль генерируется** через `openssl rand -base64 24`
- **Убран хардкод** `admin123` из всех файлов
- **Убраны подсказки** про `.env`/`ADMIN_PASSWORD` со страницы логина
- **`.env` исключён** из архивов (только `.env.example` с пустым паролем)
- **Timing-safe** сравнение пароля
- **Secure flag** на cookie в production

---

## [v1.2.0] — 2026-09-26

### ✨ Добавлено
- **22 API endpoints**: webhook, auth, CRUD, логи, аналитика, рассылки, поиск
- **Admin-панель** (11 компонентов):
  - Dashboard с метриками и графиками Recharts
  - FAQ Manager с CRUD, поиском, фильтрами
  - Category/Tag managers
  - LogManager с пагинацией и CSV-экспортом
  - RealtimeLogs через SSE
  - Analytics с воронкой и breakdown
  - Unanswered с one-click convert в FAQ
  - Broadcasts с async-отправкой
  - Commands manager
  - AdminActions аудит-журнал
  - Settings с webhook subscribe/unsubscribe
- **Глобальный поиск** `Ctrl+K` / `⌘K`
- **Светлая/тёмная тема** (next-themes)
- **Брендовая amber/orange палитра** Maestro7IT
- **LLM-fallback** через z-ai-web-dev-sdk
- **Inline-клавиатуры** в MAX Bot API

### 📚 База знаний
- 23 курса по 7 направлениям (DevOps, Безопасность, БД, AI, Программирование, Мультимедиа, Академическое)
- 7 категорий с эмодзи
- 6 команд бота
- 6 настроек по умолчанию

---

## [v1.1.0] — 2026-09-26

### ✨ Добавлено
- Базовая структура Next.js 16 + TypeScript + Prisma + SQLite
- Prisma-схема с 11 моделями
- Seed-скрипт с 23 курсами
- MAX Bot API клиент
- Cookie-based auth
- shadcn/ui компоненты
- Tailwind CSS 4 с кастомной палитрой

---

## [v1.0.0] — 2026-09-26

### 🎉 Initial release
- Создан по образцу [service-learning-max-chatbot](https://github.com/QuadDarv1ne/service-learning-max-chatbot)
- Базовая архитектура чат-бота для мессенджера MAX
- Адаптация под школу программирования Maestro7IT
- 23 курса из списка пользователя
- Контакты школы из school-maestro7it.ru
