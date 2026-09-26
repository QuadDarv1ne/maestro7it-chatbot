/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Seed script for Maestro7IT chatbot.
 *
 * Создаёт:
 *  - 7 категорий курсов
 *  - 23 курса (как на school-maestro7it.ru / Stepik)
 *  - Теги
 *  - Общие вопросы о школе (контакты, запись, стоимость, формат)
 *  - Команды бота
 *  - Настройки по умолчанию
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// --- slug helpers ---
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

interface CourseSeed {
  title: string
  category: string
  emoji: string
  description: string
  keywords: string
  details: string
}

const COURSES: CourseSeed[] = [
  // DevOps
  {
    title: 'Системное администрирование в Linux',
    category: 'DevOps',
    emoji: '🐧',
    description:
      'Курс по основам и продвинутому системному администрированию Linux: работа в терминале, управление пользователями, правами, процессами и службами, настройка сети и безопасности.',
    keywords: 'linux, сисадмин, системное администрирование, терминал, bash, systemd, ubuntu, debian, centos',
    details:
      'Вы научитесь: работать в командной строке Bash; управлять пользователями, группами и правами доступа; настраивать сетевые интерфейсы и фаерволы; администрировать службы через systemd; автоматизировать задачи через cron и скрипты; выполнять диагностику и мониторинг системы. Подходит для будущих DevOps-инженеров и системных администраторов.',
  },
  {
    title: 'Docker для начинающих',
    category: 'DevOps',
    emoji: '🐳',
    description:
      'Практический курс по контейнеризации приложений с помощью Docker: образы, контейнеры, тома, сети, Docker Compose и публикации образов в реестре.',
    keywords: 'docker, контейнеры, контейнеризация, docker compose, образы, devops',
    details:
      'Вы научитесь: создавать Dockerfile и собирать образы; запускать и управлять контейнерами; использовать тома для персистентных данных; настраивать сети между контейнерами; оркестрировать многоконтейнерные приложения через Docker Compose; публиковать образы в Docker Hub. Курс подходит разработчикам и DevOps-инженерам.',
  },
  {
    title: 'Мониторинг и аналитика в реальном времени',
    category: 'DevOps',
    emoji: '📊',
    description:
      'Курс по построению систем мониторинга: сбор метрик, логов и трейсов, визуализация дашбордов, настройка алертов и инцидент-менеджмент.',
    keywords: 'мониторинг, prometheus, grafana, алерты, метрики, логи, observability, devops',
    details:
      'Вы научитесь: разворачивать Prometheus и Grafana; собирать метрики с приложений и инфраструктуры; строить дашборды и настраивать алерты; работать с логами через Loki; организовывать observability-процессы в команде. Курс для DevOps и SRE.',
  },

  // Безопасность
  {
    title: 'Кибербезопасность',
    category: 'Безопасность',
    emoji: '🛡️',
    description:
      'Курс по основам информационной безопасности: угрозы, уязвимости, атаки, защита систем, криптография и этичный хакинг.',
    keywords: 'кибербез, безопасность, hacking, уязвимости, криптография, pentest, защита',
    details:
      'Вы узнаете: основные классы угроз (SQL-инъекции, XSS, CSRF, MITM и др.); методы защиты веб-приложений и сетей; основы криптографии и PKI; принципы этичного хакинга и pentest; нормативную базу (GDPR, 152-ФЗ). Курс подходит начинающим специалистам по ИБ.',
  },
  {
    title: 'Тестирование ПО',
    category: 'Безопасность',
    emoji: '🐞',
    description:
      'Курс по обеспечению качества ПО: виды тестирования, тест-кейсы, баг-репорты, автоматизация, инструменты QA.',
    keywords: 'тестирование, qa, тест-кейсы, баг-репорты, автоматизация, selenium, качество',
    details:
      'Вы научитесь: составлять тест-планы и тест-кейсы; писать понятные баг-репорты; проводить ручное и автоматизированное тестирование; использовать Selenium и Postman; работать в процессах CI/CD с QA-этапом. Курс для будущих QA-инженеров.',
  },

  // Базы данных
  {
    title: 'SQL: от основ до администрирования',
    category: 'Базы данных',
    emoji: '🗄️',
    description:
      'Полный курс по SQL: запросы, joins, индексы, транзакции, проектирование схем, администрирование PostgreSQL/MySQL.',
    keywords: 'sql, postgresql, mysql, базы данных, joins, индексы, транзакции, администрирование',
    details:
      'Вы освоите: SELECT, INSERT, UPDATE, DELETE; JOIN и подзапросы; индексы и оптимизацию; транзакции и уровни изоляции; нормализацию и проектирование схем; основы администрирования PostgreSQL и MySQL; резервное копирование и репликацию.',
  },
  {
    title: 'Redis для разработчиков',
    category: 'Базы данных',
    emoji: '⚡',
    description:
      'Курс по in-memory базе данных Redis: структуры данных, кэширование, очереди, pub/sub, кластеризация.',
    keywords: 'redis, кэш, in-memory, очереди, pub/sub, nosql',
    details:
      'Вы научитесь: работать со структурами Redis (strings, lists, sets, hashes, sorted sets); использовать Redis как кэш и очередь; настраивать pub/sub; проектировать отказоустойчивые кластеры; интегрировать Redis с приложениями.',
  },
  {
    title: 'Основы ClickHouse',
    category: 'Базы данных',
    emoji: '📈',
    description:
      'Курс по колоночной СУБД ClickHouse для аналитики больших данных: модель данных, движки таблиц, оптимизация запросов.',
    keywords: 'clickhouse, аналитика, olap, колочная бд, big data',
    details:
      'Вы изучите: архитектуру колоночных СУБД; движки таблиц MergeTree и семейство; парсинг и загрузку данных; оптимизацию запросов; интеграцию с Kafka, S3, PostgreSQL; построение аналитических дашбордов на данных ClickHouse.',
  },
  {
    title: 'MongoDB для начинающих',
    category: 'Базы данных',
    emoji: '🍃',
    description:
      'Курс по документоориентированной СУБД MongoDB: модель данных, запросы, агрегации, индексы, репликация.',
    keywords: 'mongodb, nosql, документоориентированная, json, агрегации, mongoose',
    details:
      'Вы освоите: модель данных BSON/JSON; CRUD-операции; aggregation pipeline; индексы и оптимизацию; репликацию и шардирование; работу с Mongoose в Node.js. Подходит для fullstack-разработчиков.',
  },

  // Аналитика и AI
  {
    title: 'Анализ данных с PowerBI',
    category: 'Аналитика и AI',
    emoji: '📉',
    description:
      'Курс по бизнес-аналитике с Power BI: подключение источников, моделирование данных, DAX, визуализации и дашборды.',
    keywords: 'powerbi, power bi, бизнес-аналитика, dax, дашборды, визуализация, bi',
    details:
      'Вы научитесь: подключать источники данных (SQL, Excel, REST API); моделировать данные и связи; писать меры на DAX; строить интерактивные дашборды; публиковать отчёты в Power BI Service. Курс для аналитиков и менеджеров.',
  },
  {
    title: 'Нейросети и N8N',
    category: 'Аналитика и AI',
    emoji: '🤖',
    description:
      'Курс по автоматизации workflows с n8n и интеграции нейросетей (LLM) в бизнес-процессы.',
    keywords: 'n8n, нейросети, llm, автоматизация, workflows, openai, ai, zapier',
    details:
      'Вы научитесь: строить визуальные workflow в n8n; интегрировать LLM (OpenAI, Anthropic и локальные модели); автоматизировать обработку документов, рассылки, парсинг; делать AI-агентов для типовых задач. Курс для тех, кто хочет применять AI без глубокого программирования.',
  },

  // Программирование
  {
    title: 'Программирование на JavaScript',
    category: 'Программирование',
    emoji: '🟨',
    description:
      'Курс по JavaScript: основы, ES6+, DOM, fetch, async/await, работа с API, основы Node.js.',
    keywords: 'javascript, js, es6, dom, fetch, async, nodejs, веб',
    details:
      'Вы освоите: типы данных, функции, замыкания; ES6+ (destructuring, spread, modules); DOM и события; fetch и async/await; основы Node.js и Express; работу с localStorage и API. Подходит для будущих фронтенд- и fullstack-разработчиков.',
  },
  {
    title: 'PHP с нуля до веб-приложений',
    category: 'Программирование',
    emoji: '🐘',
    description:
      'Курс по PHP: от синтаксиса до создания веб-приложений на Laravel, работа с БД, сессиями, REST API.',
    keywords: 'php, laravel, веб-разработка, backend, symfony, composer',
    details:
      'Вы изучите: синтаксис PHP 8+; ООП и PSR; работу с MySQL через PDO; сессии и аутентификацию; фреймворк Laravel (роутинг, Eloquent, Blade, очереди); создание REST API. Курс для backend-разработчиков.',
  },
  {
    title: 'Ассемблер для инженеров',
    category: 'Программирование',
    emoji: '⚙️',
    description:
      'Курс по языку ассемблера (x86/x86-64): регистры, инструкции, вызовы функций, работа с памятью, отладка.',
    keywords: 'ассемблер, assembly, asm, x86, low-level, реверс-инжиниринг, binary',
    details:
      'Вы освоите: архитектуру x86/x86-64; регистры и инструкции; работу со стеком и вызовы функций; системные вызовы Linux; основы реверс-инжиниринга через GDB; написание оптимизированных участков кода. Курс для системных программистов и инженеров по безопасности.',
  },
  {
    title: 'Программирование на Go',
    category: 'Программирование',
    emoji: '🐹',
    description:
      'Курс по языку Go: синтаксис, горутины, каналы, стандартная библиотека, микросервисы, gin.',
    keywords: 'go, golang, горутины, каналы, микросервисы, gin, backend',
    details:
      'Вы изучите: синтаксис Go; типы и интерфейсы; горутины и каналы; работу с HTTP и JSON; написание REST API на Gin; тестирование и контекст. Курс для backend-разработчиков и DevOps.',
  },
  {
    title: 'Программирование на C#',
    category: 'Программирование',
    emoji: '🔵',
    description:
      'Курс по C# и .NET: ООП, LINQ, async/await, ASP.NET Core, Entity Framework, юнит-тесты.',
    keywords: 'c#, csharp, dotnet, .net, asp.net, entity framework, linq',
    details:
      'Вы освоите: синтаксис C# 12; ООП и обобщённые типы; LINQ и async/await; ASP.NET Core Web API; Entity Framework Core; юнит-тесты xUnit. Подходит для backend-разработчиков и тех, кто хочет перейти в game dev на Unity.',
  },
  {
    title: 'React + React Native',
    category: 'Программирование',
    emoji: '⚛️',
    description:
      'Курс по React для веба и мобильной разработки на React Native: hooks, компоненты, состояние, навигация.',
    keywords: 'react, react native, hooks, redux, jsx, frontend, mobile, expo',
    details:
      'Вы научитесь: строить компоненты на JSX; использовать хуки (useState, useEffect, useMemo); управлять состоянием через Redux Toolkit; делать навигацию в React Native; работать с REST API; публиковать приложения. Курс для фронтенд- и мобильных разработчиков.',
  },

  // Мультимедиа
  {
    title: 'Режиссёр видеомонтажа',
    category: 'Мультимедиа',
    emoji: '🎬',
    description:
      'Курс по видеомонтажу как режиссуре: драматургия кадра, ритм, монтаж в DaVinci Resolve / Premiere Pro.',
    keywords: 'видеомонтаж, режиссура, davinci, premiere, монтаж, цветокоррекция',
    details:
      'Вы освоите: основы режиссуры и драматургии; монтаж в DaVinci Resolve и Adobe Premiere Pro; цветокоррекцию и звук; ритм и темп монтажа; экспорт под разные платформы. Курс для видеографов и контент-мейкеров.',
  },
  {
    title: 'Мастеринг звука',
    category: 'Мультимедиа',
    emoji: '🎧',
    description:
      'Курс по мастерингу аудио: эквализация, компрессия, лимитинг, подготовка треков к релизу на стриминговых площадках.',
    keywords: 'мастеринг, звук, аудио, эквализация, компрессия, mixing, daw',
    details:
      'Вы изучите: принципы мастеринга; эквализацию и мультiband-компрессию; лимитинг и loudness standards для стримингов; работу в Ableton Live / Reaper / FL Studio; подготовку мастер-файлов для дистрибуции. Курс для музыкантов и звукорежиссёров.',
  },
  {
    title: 'Саунд-дизайн',
    category: 'Мультимедиа',
    emoji: '🔊',
    description:
      'Курс по созданию звуковых эффектов и атмосферы для игр, видео и инсталляций: Foley, синтез, обработка.',
    keywords: 'саунд-дизайн, sound design, foley, sfx, игры, синтез, аудио',
    details:
      'Вы научитесь: записывать и обрабатывать Foley-эффекты; синтезировать звуки в Serum и Massive; создавать ambient-подушки и SFX для игр; работать с middleware (FMOD, Wwise); монтировать звук в видео. Курс для геймдизайнеров и звукорежиссёров.',
  },
  {
    title: '3D моделирование в Blender',
    category: 'Мультимедиа',
    emoji: '🧊',
    description:
      'Курс по 3D-моделированию в Blender: polygon modeling, скульптинг, текстуры, рендер Cycles/Eevee.',
    keywords: 'blender, 3d, моделирование, sculpt, cycles, eevee, render',
    details:
      'Вы освоите: интерфейс Blender; polygon modeling и модификаторы; скульптинг и ретопологию; UV-развёртку и текстуры (PBR); освещение и рендер в Cycles/Eevee; базовую анимацию. Курс для 3D-художников и геймдев-моделлеров.',
  },

  // Академическое
  {
    title: 'Написание научных статей',
    category: 'Академическое',
    emoji: '📝',
    description:
      'Курс по научной писательской практике: структура статьи, литобзор, методология, публикация в журналах и на Zenodo.',
    keywords: 'научная статья, публикация, zenodo, doi, литобзор, методология, академическое письмо',
    details:
      'Вы научитесь: выбирать тему и формулировать гипотезу; проводить литературный обзор; описывать методологию; оформлять статью по ГОСТ / APA; публиковаться в журналах ВАК / РИНЦ и на Zenodo с получением DOI. Курс для студентов, аспирантов и исследователей.',
  },
  {
    title: 'Курсовые и дипломные работы',
    category: 'Академическое',
    emoji: '🎓',
    description:
      'Курс по подготовке курсовых и дипломных работ: от выбора темы до защиты, ГОСТ-оформление, антиплагиат, презентация.',
    keywords: 'курсовая, диплом, вуз, гост, антиплагиат, защита, презентация',
    details:
      'Вы освоите: выбор и утверждение темы; планирование структуры работы; работу с источниками и цитированием; оформление по ГОСТ 7.32; прохождение антиплагиата; подготовку презентации и речь для защиты. Курс для студентов вузов и колледжей.',
  },
]

// --- General school FAQ ---
interface GeneralFaqSeed {
  question: string
  answer: string
  keywords: string
  category?: string
  pinned?: boolean
}

const GENERAL_FAQ: GeneralFaqSeed[] = [
  {
    question: 'Как записаться на пробное занятие?',
    answer:
      'Записаться на пробное занятие можно через форму на сайте school-maestro7it.ru (кнопка «Запишитесь на занятие»), либо написав нам в любой мессенджер: MAX, Telegram @quadd4rv1n7, WhatsApp +7 915 048-02-49. Первые 15 минут — тестирование, чтобы определить ваш уровень и подобрать курс.',
    keywords: 'запись, пробное занятие, тестирование, записаться, курс',
    category: 'Общее',
    pinned: true,
  },
  {
    question: 'Где проходят курсы?',
    answer:
      'Все 23 курса размещены на платформе Stepik — это крупнейшая образовательная IT-платформа в России. Вы учитесь в удобном темпе, материалы доступны 24/7. Часть курсов также дублируется на YouTube-канале Maestro7IT. Ссылки на конкретный курс можно получить у бота командой /menu или у преподавателя.',
    keywords: 'stepik, платформа, где учиться, онлайн, формат',
    category: 'Общее',
    pinned: true,
  },
  {
    question: 'Сколько стоят курсы?',
    answer:
      'Часть курсов на Stepik бесплатная, часть — платная. Уточнить стоимость конкретного курса и действующие скидки можно у администратора в Telegram @quadd4rv1n7 или WhatsApp +7 915 048-02-49. Также доступны индивидуальные занятия и наставничество — их стоимость договорная.',
    keywords: 'стоимость, цена, скидки, оплата, сколько стоит',
    category: 'Общее',
  },
  {
    question: 'Какие контакты у школы Maestro7IT?',
    answer:
      'Связаться со школой Maestro7IT можно несколькими способами:\n\n' +
      '• MAX — https://max.ru/u/f9LHodD0cOLxcVXpSMqTSZLCFG_q6uz0QRQKOhGSBc5RIx4h-KYqVRvzW3k\n' +
      '• Telegram — @quadd4rv1n7 (https://t.me/quadd4rv1n7)\n' +
      '• WhatsApp — +7 915 048-02-49 (https://wa.me/79150480249)\n' +
      '• Email — info@maestro7it.ru\n' +
      '• Телефон — +7 915 048-02-49\n' +
      '• TapLink — https://taplink.cc/maestro7it\n' +
      '• Сайт — https://school-maestro7it.ru',
    keywords: 'контакты, телефон, email, telegram, whatsapp, max, связь',
    category: 'Общее',
    pinned: true,
  },
  {
    question: 'Кто преподаватель?',
    answer:
      'Школу основал Дуплей Максим Игоревич — старший преподаватель информационных технологий, аналитик, философ, музыкант и DevOps-инженер. Автор 38 научных публикаций на Zenodo в области ИИ, образования, лингвистики и междисциплинарных исследований. ORCID: 0009-0007-7605-539X. Профиль научных работ: https://science-maestro-maestro7it.amvera.io',
    keywords: 'преподаватель, автор, дуплей, максим, основатель, orcid',
    category: 'Общее',
  },
  {
    question: 'Какие направления курсов есть?',
    answer:
      'В коллекции Maestro7IT 23 курса по 7 направлениям:\n\n' +
      '• DevOps — Linux, Docker, мониторинг\n' +
      '• Безопасность — кибербезопасность, тестирование ПО\n' +
      '• Базы данных — SQL, Redis, ClickHouse, MongoDB\n' +
      '• Аналитика и AI — Power BI, нейросети и n8n\n' +
      '• Программирование — JavaScript, PHP, Ассемблер, Go, C#, React\n' +
      '• Мультимедиа — видеомонтаж, мастеринг звука, саунд-дизайн, Blender\n' +
      '• Академическое — научные статьи, курсовые и дипломные',
    keywords: 'направления, категории, список курсов, направления курсов',
    category: 'Общее',
  },
  {
    question: 'Подходят ли курсы начинающим?',
    answer:
      'Да, большинство курсов рассчитаны на начинающих. Например, «Docker для начинающих», «MongoDB для начинающих», «Программирование на JavaScript», «3D моделирование в Blender» доступны с нуля. Для курсов с глубокой специализацией (Ассемблер, ClickHouse, мониторинг) желательно базовое понимание программирования и Linux — это указано в описании курса.',
    keywords: 'новичок, начинающий, с нуля, базовый,入门',
    category: 'Общее',
  },
  {
    question: 'Выдаёте ли вы сертификат?',
    answer:
      'После успешного прохождения курса на Stepik вы получаете электронный сертификат Stepik. Для индивидуальных занятий и наставничества выдаётся сертификат школы Maestro7IT. Сертификаты можно использовать в портфолио и при трудоустройстве.',
    keywords: 'сертификат, документ, подтверждение, портфолио',
    category: 'Общее',
  },
  {
    question: 'Можно ли получить помощь с курсовой или дипломом?',
    answer:
      'Да, в Maestro7IT есть курс «Курсовые и дипломные работы» и направление академического письма — «Написание научных статей». Преподаватель поможет с выбором темы, структурой, оформлением по ГОСТ, антиплагиатом и подготовкой к защите. Запись — через любой мессенджер школы.',
    keywords: 'курсовая, диплом, помощь, научная статья, гост, антиплагиат',
    category: 'Общее',
  },
  {
    question: 'Есть ли YouTube-канал?',
    answer:
      'Да, у школы есть канал на трёх видеоплатформах:\n\n' +
      '• YouTube — https://www.youtube.com/channel/UCqA5pl9NkVDrirMDlNVmU7g\n' +
      '• RuTube — https://rutube.ru/channel/4218729/\n' +
      '• Plvideo — https://plvideo.ru/@it-coders\n\n' +
      'Там публикуются бесплатные уроки, записи стримов и обзоры курсов.',
    keywords: 'youtube, rutube, plvideo, видео, канал, уроки',
    category: 'Общее',
  },
  {
    question: 'Что такое MAX и зачем чат-бот в нём?',
    answer:
      'MAX — это российский мессенджер от VK. Школа Maestro7IT использует MAX как один из основных каналов связи со студентами. Чат-бот в MAX помогает быстро найти ответ по курсам, стоимости, записи — без ожидания оператора. Если ответа нет в базе, бот подключает нейросетевой fallback, чтобы всё равно помочь вам.',
    keywords: 'max, мессенджер, бот, vk, зачем',
    category: 'Общее',
  },
  {
    question: 'Как начать обучение?',
    answer:
      'Просто напишите боту команду /start — он покажет главное меню. Дальше выбирайте интересующее направление: DevOps, Базы данных, Программирование и т.д. Бот подскажет, какой курс подходит под ваш уровень, и даст ссылку на Stepik. Для индивидуального плана обучения запишитесь на пробное занятие через сайт или мессенджеры.',
    keywords: 'начать, обучение, как начать, старт, /start',
    category: 'Общее',
    pinned: true,
  },
]

async function main() {
  console.log('🧹 Очистка старых данных...')
  await db.faqFeedback.deleteMany()
  await db.faqTag.deleteMany()
  await db.tag.deleteMany()
  await db.faqItem.deleteMany()
  await db.category.deleteMany()
  await db.botCommand.deleteMany()
  await db.botSetting.deleteMany()
  await db.adminActionLog.deleteMany()
  await db.messageLog.deleteMany()
  await db.broadcastRecipient.deleteMany()
  await db.broadcast.deleteMany()
  await db.maxUser.deleteMany()

  // --- Категории ---
  console.log('📂 Создание категорий...')
  const categoryNames = Array.from(new Set(['Общее', ...COURSES.map((c) => c.category)]))
  const categoryMap = new Map<string, string>()
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i]
    const c = await db.category.create({
      data: {
        name,
        slug: slugify(name),
        emoji: emojiForCategory(name),
        sortOrder: i,
      },
    })
    categoryMap.set(name, c.id)
  }

  // --- Теги ---
  console.log('🏷️ Создание тегов...')
  const tagNames = ['курс', 'запись', 'контакты', 'стоимость', 'начинающим', 'продвинутый', 'stepik']
  const tagMap = new Map<string, string>()
  for (const name of tagNames) {
    const t = await db.tag.create({ data: { name } })
    tagMap.set(name, t.id)
  }

  // --- Общие вопросы ---
  console.log(`📚 Создание ${GENERAL_FAQ.length} общих вопросов...`)
  for (let i = 0; i < GENERAL_FAQ.length; i++) {
    const f = GENERAL_FAQ[i]
    const categoryName = f.category || 'Общее'
    const faq = await db.faqItem.create({
      data: {
        question: f.question,
        answer: f.answer,
        keywords: f.keywords,
        isPinned: f.pinned ?? false,
        isPublished: true,
        sortOrder: i,
        categoryId: categoryMap.get(categoryName),
      },
    })
    // Привязываем тег "контакты" для контактного вопроса и т.д.
    if (/контакт|телефон|email|telegram/i.test(f.question)) {
      await db.faqTag.create({ data: { faqItemId: faq.id, tagId: tagMap.get('контакты')! } })
    }
    if (/стоим|цен/i.test(f.question)) {
      await db.faqTag.create({ data: { faqItemId: faq.id, tagId: tagMap.get('стоимость')! } })
    }
    if (/начинающ|с нуля|подходят/i.test(f.question)) {
      await db.faqTag.create({ data: { faqItemId: faq.id, tagId: tagMap.get('начинающим')! } })
    }
  }

  // --- Курсы ---
  console.log(`🎓 Создание ${COURSES.length} курсов...`)
  for (let i = 0; i < COURSES.length; i++) {
    const c = COURSES[i]
    const question = `Расскажи про курс «${c.title}»`
    const answer = `${c.emoji} ${c.title} (${c.category})\n\n${c.description}\n\n${c.details}\n\n🔗 Все курсы школы на Stepik: https://school-maestro7it.ru/courses/ru`
    await db.faqItem.create({
      data: {
        question,
        answer,
        keywords: c.keywords,
        isPinned: false,
        isPublished: true,
        sortOrder: 100 + i,
        categoryId: categoryMap.get(c.category),
      },
    })
  }

  // --- Команды бота ---
  console.log('⚙️ Создание команд бота...')
  await db.botCommand.createMany({
    data: [
      {
        command: 'start',
        description: 'Запуск бота и приветствие',
        response:
          '👋 Привет! Я бот школы программирования Maestro7IT.\n\n' +
          'Помогу подобрать курс, расскажу про стоимость и формат обучения, подскажу контакты.\n\n' +
          'Команды:\n/menu — категории курсов\n/faq — частые вопросы\n/contacts — контакты школы\n/about — о школе\n/search <текст> — поиск по базе\n\n❓ Просто напишите свой вопрос — я постараюсь ответить.',
        isEnabled: true,
      },
      {
        command: 'help',
        description: 'Список команд',
        response:
          '📖 Команды бота Maestro7IT:\n\n' +
          '/start — приветствие\n/menu — категории курсов\n/faq — частые вопросы\n/contacts — контакты\n/about — о школе\n/search <текст> — поиск\n/show <id> — показать ответ по ID\n\nИли просто задайте вопрос словами — я найду ответ в базе или подключу нейросеть.',
        isEnabled: true,
      },
      {
        command: 'menu',
        description: 'Категории курсов',
        response: '📂 Выберите направление курса:',
        isEnabled: true,
      },
      {
        command: 'faq',
        description: 'Частые вопросы',
        response: '📋 Частые вопросы:\n\n• Как записаться на пробное занятие?\n• Сколько стоят курсы?\n• Где проходят курсы?\n• Какие контакты?\n• Подходят ли курсы начинающим?\n\nЗадайте вопрос словами — отвечу подробно.',
        isEnabled: true,
      },
      {
        command: 'contacts',
        description: 'Контакты школы',
        response:
          '📞 Контакты Maestro7IT:\n\n' +
          '• MAX — https://max.ru/u/f9LHodD0cOLxcVXpSMqTSZLCFG_q6uz0QRQKOhGSBc5RIx4h-KYqVRvzW3k\n' +
          '• Telegram — @quadd4rv1n7\n' +
          '• WhatsApp — +7 915 048-02-49\n' +
          '• Email — info@maestro7it.ru\n' +
          '• Сайт — https://school-maestro7it.ru',
        isEnabled: true,
      },
      {
        command: 'about',
        description: 'О школе',
        response:
          '🏫 О школе Maestro7IT:\n\n' +
          'Школа программирования Maestro7IT — обучение разработке, ИИ и инженерным практикам.\n\n' +
          'Основатель — Дуплей Максим Игоревич, старший преподаватель ИТ, DevOps-инженер, автор 38 научных публикаций.\n\n' +
          'В коллекции 23 курса по 7 направлениям: DevOps, Безопасность, Базы данных, Аналитика и AI, Программирование, Мультимедиа, Академическое.\n\n' +
          'Сайт: https://school-maestro7it.ru',
        isEnabled: true,
      },
    ],
  })

  // --- Настройки по умолчанию ---
  console.log('🔧 Создание настроек...')
  await db.botSetting.createMany({
    data: [
      { key: 'welcomeText', value: '👋 Я бот школы программирования Maestro7IT. Чем могу помочь?' },
      { key: 'noAnswerText', value: '🤔 К сожалению, у меня нет точного ответа на этот вопрос. Попробуйте переформулировать или напишите в поддержку: Telegram @quadd4rv1n7, WhatsApp +7 915 048-02-49.' },
      { key: 'offtopicText', value: '⚠️ Я отвечаю только на вопросы о курсах и обучении в Maestro7IT. По другим темам лучше написать в Telegram @quadd4rv1n7.' },
      { key: 'useLlmFallback', value: 'true' },
      { key: 'botName', value: 'Maestro7IT Bot' },
      { key: 'webhookSubscribed', value: 'false' },
    ],
  })

  // --- Итоги ---
  const counts = {
    categories: await db.category.count(),
    faq: await db.faqItem.count(),
    tags: await db.tag.count(),
    commands: await db.botCommand.count(),
    settings: await db.botSetting.count(),
  }
  console.log('✅ Seed завершён:', counts)
}

function emojiForCategory(name: string): string {
  switch (name) {
    case 'DevOps': return '🛠️'
    case 'Безопасность': return '🛡️'
    case 'Базы данных': return '🗄️'
    case 'Аналитика и AI': return '🤖'
    case 'Программирование': return '💻'
    case 'Мультимедиа': return '🎬'
    case 'Академическое': return '🎓'
    case 'Общее': return '📚'
    default: return '📁'
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
