# 🤖 Чат-бот Maestro7IT — Админ-панель

[![Version](https://img.shields.io/badge/version-1.3.0-primary)](./CHANGELOG.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

Чат-бот для мессенджера **MAX** школы программирования **Maestro7IT** — информационная поддержка студентов по 23 курсам на платформе Stepik.

Создано по образцу [service-learning-max-chatbot](https://github.com/QuadDarv1ne/service-learning-max-chatbot).

📚 **[История версий](./CHANGELOG.md)** — все заметные изменения по версиям.

---

## 📖 О проекте

Бот помогает посетителям быстро найти ответ по курсам Maestro7IT: какой курс выбрать, как записаться, сколько стоит, где проходят занятия, какие контакты у школы.

**Ключевое требование** — возможность обновлять базу ответов силами сотрудников школы **без привлечения разработчиков**. Реализовано через визуальную админ-панель с полным CRUD.

### Как это работает

```
Пользователь (MAX) → webhook → bot-logic → поиск по FAQ → ответ
                                      ↘ LLM-фолбэк (если вопроса нет в базе, но он по теме)
```

1. Пользователь пишет боту или нажимает inline-кнопку.
2. MAX присылает событие на `POST /api/max/webhook`.
3. Бот ищет ответ в базе знаний (нормализация текста, стоп-слова, скоринг).
4. Если ответа нет, но вопрос относится к школе — подключается LLM-фолбэк.
5. Всё логируется для аналитики.

---

## ✨ Возможности

### Для пользователя в MAX

- 🔍 Поиск по ключевым словам с ранжированием релевантных ответов
- 📂 Навигация по категориям через inline-кнопки (7 направлений курсов)
- 📃 Закреплённые вопросы — важное всегда сверху
- 👍 Оценка ответа («Полезно» / «Не помогло»)
- 🤖 LLM-фолбэк через z-ai-web-dev-sdk
- 💬 Команды: `/start`, `/help`, `/menu`, `/faq`, `/contacts`, `/about`, `/search`, `/show`

### Для администратора

- 📊 Дашборд — ключевые метрики за 24 часа
- 📈 Аналитика — воронка ответов, доля FAQ/LLM, off-topic, графики (Recharts)
- 🗂️ База знаний (FAQ) — CRUD категорий и ответов, теги, закрепление, публикация
- ❓ Запросы без ответа — прямое добавление в базу в один клик
- 📝 Логи обращений — все входящие/исходящие с фильтрами и экспортом CSV
- 🔴 Real-time логи через SSE
- 🛡️ Журнал действий — аудит операций администратора
- ⚙️ Настройки — токен бота, webhook, тексты, проверка бота, health-статус
- 📣 Рассылки — мгновенные и отложенные сообщения пользователям
- 🔎 Глобальный поиск (`Ctrl+K` / `⌘K`) по всей базе
- 🌓 Светлая/тёмная тема

---

## 🛠️ Технологии

| Слой | Стек |
|------|------|
| Backend | Next.js 16 (App Router), TypeScript 5 |
| База данных | Prisma ORM 6 + SQLite |
| Frontend | React 19, shadcn/ui, Tailwind CSS 4, Recharts |
| Интеграция | MAX Bot API — `https://platform-api2.max.ru/` |
| ИИ-фолбэк | z-ai-web-dev-sdk (только backend) |
| Runtime | Bun (рекомендуется) или Node.js 18+ |

---

## Быстрый старт

### Требования

- **Bun** 1.0+ (рекомендуется) или **Node.js** 18+
- 256 MB RAM (dev) / 512 MB (prod)

### Установка

```bash
# 1. Установить зависимости
bun install

# 2. Настроить окружение
cp .env.example .env
# Отредактируйте .env: DATABASE_URL, ADMIN_PASSWORD

# 3. Создать схему БД и заполнить базу знаний
bun run db:push
bun run scripts/seed.ts

# 4. Запустить
bun run dev
```

Откройте **http://localhost:3000** — админ-панель. Пароль — это значение `ADMIN_PASSWORD` в вашем `.env`.

> **Совет:** сгенерируйте криптостойкий пароль командой
> ```bash
> openssl rand -base64 24 | tr -d '/+=' | head -c 32
> ```

### Подключение к боту MAX

1. Создайте и верифицируйте профиль на [Портале для бизнеса MAX](https://business.max.ru/self).
2. Раздел **«Чат-боты»** → создайте бота → пройдите модерацию (до 48 часов).
3. Скопируйте токен доступа.
4. В админ-панели: **«Настройки»** → вставьте токен → сохраните.
5. Укажите URL вебхука (`https://your-domain.ru/api/max/webhook`) → **«Подписать webhook»** → **«Проверить бота»**.

> Вебхук требует **HTTPS**. Для локальной разработки — `cloudflared tunnel --url http://localhost:3000` или `ngrok http 3000`.

---

## 📁 Структура проекта

```
.
├── prisma/
│   └── schema.prisma              # 11 моделей БД
├── scripts/
│   └── seed.ts                    # 23 курса + 12 общих FAQ + команды + настройки
├── src/
│   ├── app/
│   │   ├── api/                   # 22 API endpoints
│   │   │   ├── health/
│   │   │   ├── max/webhook/       # Webhook для MAX
│   │   │   ├── admin/{login,logout,me}/
│   │   │   ├── categories/        # CRUD
│   │   │   ├── faq/               # CRUD
│   │   │   ├── tags/              # CRUD
│   │   │   ├── logs/              # list + export CSV + stream SSE
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   ├── bot/{check, webhook/{subscribe,unsubscribe}}/
│   │   │   ├── broadcasts/        # CRUD + async send
│   │   │   ├── unanswered/        # list + convert to FAQ
│   │   │   ├── commands/          # CRUD
│   │   │   ├── admin-actions/
│   │   │   └── search/            # global
│   │   ├── layout.tsx             # Root layout с ThemeProvider
│   │   └── page.tsx               # SPA с auth gate
│   ├── components/
│   │   ├── admin/                 # 11 компонентов админки
│   │   ├── ui/                    # shadcn/ui компоненты
│   │   └── theme-provider.tsx
│   └── lib/
│       ├── db.ts                  # Prisma client
│       ├── max-api.ts             # MAX Bot API клиент
│       ├── bot-logic.ts           # Поиск + LLM fallback + callbacks
│       ├── llm.ts                 # z-ai-web-dev-sdk
│       ├── search.ts              # FAQ search engine + globalSearch
│       ├── auth.ts                # Cookie session auth
│       ├── api-helpers.ts         # requireAdmin, logAdminAction
│       └── api-client.ts          # Frontend API клиент
├── db/custom.db                   # SQLite (создаётся автоматически)
└── .env                           # DATABASE_URL, ADMIN_PASSWORD, MAX_BOT_TOKEN
```

### Модели базы данных

`Category`, `FaqItem`, `Tag`, `FaqTag`, `MaxUser`, `MessageLog`, `FaqFeedback`, `BotSetting`, `BotCommand`, `Broadcast`, `BroadcastRecipient`, `AdminActionLog`

---

## ⚙️ Переменные окружения

| Переменная | Обязательно | По умолчанию | Назначение |
|------------|:-----------:|--------------|------------|
| `DATABASE_URL` | Да | `file:./db/custom.db` | Путь к SQLite базе |
| `ADMIN_PASSWORD` | Да | — | Пароль админ-панели. Сгенерируйте: `openssl rand -base64 24 \| tr -d '/+=' \| head -c 32` |
| `MAX_BOT_TOKEN` | Нет | — | Токен бота (приоритет у значения из БД) |
| `NODE_ENV` | Нет | `development` | `production` для продакшена |
| `PORT` | Нет | `3000` | Порт HTTP-сервера |

---

## 📜 Скрипты

| Команда | Назначение |
|---------|-----------|
| `bun run dev` | Dev-сервер на `localhost:3000` |
| `bun run lint` | ESLint |
| `bun run db:push` | Применить схему к БД |
| `bun run db:generate` | Сгенерировать Prisma Client |
| `bun run scripts/seed.ts` | Заполнить базу знаний |
| `bun run archive` | Собрать архивы (версия из CHANGELOG.md) |
| `bash scripts/build-archives.sh 1.3.0` | Собрать архивы конкретной версии |

### 📦 Сборка архивов

Архивы версий создаются скриптом `scripts/build-archives.sh`:

```bash
# Авто-определение версии из CHANGELOG.md
./scripts/build-archives.sh

# Явная версия
./scripts/build-archives.sh 1.3.0

# Тихий режим (без вывода)
./scripts/build-archives.sh 1.3.0 quiet
```

**Результат** в папке `download/`:

- `maestro7it-chatbot-v1.3.0.tar.gz` — для Linux/macOS
- `maestro7it-chatbot-v1.3.0.zip` — для Windows
- `maestro7it-chatbot-v1.3.0.sha256` — контрольные суммы для проверки целостности

**Что исключается из архивов:**

- `node_modules/`, `.next/`, `.git/` (восстанавливаются из `bun install`)
- `.env` (секретный! только `.env.example` попадает в архив)
- `dev.log`, `research/`, `download/` (временные файлы)

**Проверка целостности:**

```bash
cd download/
shasum -a 256 -c maestro7it-chatbot-v1.3.0.sha256
```

---

## 🚢 Деплой

- **VPS** — systemd + Caddy (рекомендуется), требует HTTPS для webhook
- **Docker** — готовый `Dockerfile`
- ⚠️ **Vercel/Netlify не подходят** — SQLite не работает в serverless

**Проверка после деплоя:**

```bash
curl https://your-domain.ru/api/health
```

---

## 📞 Контакты

- **Школа**: [school-maestro7it.ru](https://school-maestro7it.ru)
- **Основатель**: Дуплей Максим Игоревич (ORCID: 0009-0007-7605-539X)
- **Научные работы**: [science-maestro-maestro7it.amvera.io](https://science-maestro-maestro7it.amvera.io)
- **MAX**: [профиль школы](https://max.ru/u/f9LHodD0cOLxcVXpSMqTSZLCFG_q6uz0QRQKOhGSBc5RIx4h-KYqVRvzW3k)
- **Telegram**: [@quadd4rv1n7](https://t.me/quadd4rv1n7)
- **WhatsApp**: +7 915 048-02-49
- **Email**: info@maestro7it.ru
- **Платформа курсов**: [Stepik](https://stepik.org)

---

## 📝 Лицензия

© 2026 Maestro7IT · Дуплей Максим Игоревич. 

Создано по образцу [service-learning-max-chatbot](https://github.com/QuadDarv1ne/service-learning-max-chatbot) (QuadDarv1ne).
