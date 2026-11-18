# TravelHub (`daten3`) — Туристический агрегатор и платформа бронирования

## Назначение проекта

Репозиторий `daten3` объединяет эволюцию туристического веб-проекта **TravelHub** — от ранних PHP-страниц с партнёрской интеграцией и статических HTML-макетов через Python-инструменты извлечения и объединения версий до современной full-stack платформы **TravelHub Ultimate** в каталоге [`travelhub-ultimate/`](travelhub-ultimate/).

Платформа предназначена для поиска и бронирования отелей, авиабилетов, автомобилей и турпакетов, управления избранным и ценовыми уведомлениями, а также ведения многоуровневой партнёрской (affiliate) программы и панели администратора.

## Архитектура и основные компоненты

### 1. Современная платформа `travelhub-ultimate/`

Основная кодовая база сосредоточена в [`travelhub-ultimate/`](travelhub-ultimate/) (см. подробное описание в [`travelhub-ultimate/README.md`](travelhub-ultimate/README.md)):

- **Backend API (`travelhub-ultimate/backend/`):**
  - Сервер на **TypeScript + Express 4.18** с поддержкой **GraphQL (`@apollo/server` 5)** и **WebSocket (`socket.io`)**, конфигурируется через `src/index.ts`.
  - **База данных (Prisma ORM + PostgreSQL 15):** схема [`travelhub-ultimate/backend/prisma/schema.prisma`](travelhub-ultimate/backend/prisma/schema.prisma) описывает 12 моделей (`User`, `Booking`, `Favorite`, `PriceAlert`, `Affiliate`, `Referral`, `Commission`, `Payout`, `AffiliateClick`, `AffiliateSettings`, `RefreshToken`, `PasswordResetToken`), а также скрипт начального заполнения `prisma/seed.ts`.
  - **25 модулей маршрутов (`src/routes/`):** `auth`, `bookings`, `favorites`, `priceAlerts`, `hotels`, `flights`, `cars`, `groupBookings`, `affiliate`, `payout`, `loyalty`, `payment`, `review`, `recommendations`, `notifications`, `currency`, `analytics`, `report`, `admin`, `cron`, `gateway`, `serviceMesh`, `tenant`, `health`, `metrics`.
  - **Слои и инфраструктура:** `controllers/`, `services/`, `middleware/` (JWT, RBAC, Helmet, CORS, rate limiting, валидация), `validators/`, `gateway/`, `graphql/`, `mesh/`, `jobs/`, `monitoring/`, `tests/`.
  - **Наблюдаемость и очереди:** логирование `winston` (включая `winston-elasticsearch` и ротацию файлов), `morgan`, метрики Prometheus (`prom-client`), трассировка OpenTelemetry (`@opentelemetry/sdk-node`, Jaeger exporter), кеширование и очереди на `redis` и `bullmq`.

- **Frontend (`travelhub-ultimate/frontend/`):**
  - Приложение на **React 18 + TypeScript + Vite**, оформленное с помощью **Tailwind CSS 3**.
  - **Управление состоянием и сетью:** `@tanstack/react-query`, `zustand`, `axios`, `react-router-dom`, `zod`, `framer-motion`, `recharts`.
  - **33 страницы в `src/pages/`:** главная и витрина поиска (`Home`, `HotelSearch`, `HotelDetails`, `FlightSearch`), оформление и бронирования (`BookingPage`, `MyBookings`, `BookingDetails`, `Checkout`, `PaymentSuccess`), личный кабинет (`Dashboard`, `Profile`, `Settings`, `Favorites`, `PriceAlerts`, `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `EmailVerification`), партнёрская программа (`AffiliateDashboard`, `AffiliatePortal`, `AffiliateReferrals`, `AffiliatePayouts`, `AffiliateSettings`), администрирование (`AdminPanel`), вспомогательные и тестовые страницы (`AutomatedTestsPage`, `TestPage`, `CORSTestPage`, `Reviews`, `Support`, `Privacy`, `Terms`, `NotFound`).

- **Развёртывание и контейнеризация:**
  - [`travelhub-ultimate/docker-compose.yaml`](travelhub-ultimate/docker-compose.yaml) (сервисы `frontend`, `backend`, `db` на `postgres:15-alpine`, `redis` на `redis:7-alpine`).
  - Конфигурации деплоя на Render: корневой [`render.yaml`](render.yaml) и [`travelhub-ultimate/backend/render.yaml`](travelhub-ultimate/backend/render.yaml).

### 2. Legacy PHP, HTML-прототипы и Python-утилиты миграции (корень репозитория)

В корне `main` сохранены исторические слои и вспомогательные скрипты сборки кодовой базы:
- **Legacy PHP-портал:** `index.php` (frameset-интерфейс с подключением партнёрского поиска `travelnow.com` через `cid`), `common.php`, `top.php`, `start.php`, `redirect.php`, `styles.css`, `images/`, `setup/`.
- **Python-инструменты сборки проекта:**
  - [`extract_travelhub_code.py`](extract_travelhub_code.py) — извлечение блоков кода из JSON-истории переписки и их классификация по каталогам в `travelhub-full-extracted`;
  - [`merge_travelhub_versions.py`](merge_travelhub_versions.py) — реорганизация файлов и слияние версий `v1.1`, `extracted` и `v1.0` с дедупликацией по SHA-256 в `travelhub-ultimate`.
- **Исторические снимки и архивы:** каталоги `travelagency-1/`, `travelagency-2/`, `travelagency-organized/`, `travelhub-v1.0/`, `travelhub-v1.1/`, `travelhub-data/`, `travelhub-extracted-organized/`, `travelhub-full-extracted/`, а также резервные `.zip`-архивы и отчёты аудита (`AUDIT_REPORT.md`, `FINAL_REPORT.md`, `FINAL_COMPREHENSIVE_REPORT.md`, `PROJECT_AUDIT_2025-12-22.md`, `FRONTEND_BACKEND_AUDIT_2025-12-22.md`, `INTEGRATION_COMPLETION_REPORT_2025-12-22.md` и др.).

## Стек технологий и структура каталогов

### Технологический стек
- **Backend (`travelhub-ultimate/backend/`):** Node.js >= 18, TypeScript `5.3.3`, Express `4.18.2`, Prisma `5.22.0` (PostgreSQL 15), `@apollo/server` `5.2.0` / GraphQL `16.12.0`, Socket.IO `4.8.1`, Redis `4.6.11`, BullMQ `5.66.2`, JWT + bcrypt, Helmet, Zod, Winston, Prometheus, OpenTelemetry, Vitest `4.0.16`, Playwright `1.57.0`.
- **Frontend (`travelhub-ultimate/frontend/`):** React `18.2.0`, TypeScript `5.3.3`, Vite `7.3.0`, Tailwind CSS `3.3.6`, React Router `6.20.0`, TanStack Query `5.14.2`, Zustand `4.4.7`, Axios `1.13.2`, Framer Motion, Recharts, Vitest, Playwright.
- **Legacy и скрипты:** PHP (классический HTML4/frameset), Python 3 (`extract_travelhub_code.py`, `merge_travelhub_versions.py`), Docker Compose, GitHub Actions, Render.

### Структура каталогов (ветка `main`)

```text
daten3/
├── .github/workflows/             # CI/CD: backend-tests.yml, e2e.yml, test.yml, load-test.yml, static.yml, jekyll-gh-pages.yml
├── travelhub-ultimate/            # Основное full-stack приложение
│   ├── backend/                   # TypeScript / Express / Prisma / GraphQL / Socket.IO API
│   │   ├── prisma/                # schema.prisma, migrations/, seed.ts
│   │   ├── src/                   # routes/ (25), controllers/, services/, middleware/, validators/, gateway/, graphql/, mesh/, jobs/, __tests__/
│   │   └── package.json
│   ├── frontend/                  # React 18 / TypeScript / Vite / Tailwind CSS SPA
│   │   ├── src/                   # pages/ (33), components/, hooks/, store/, styles/, types/, utils/
│   │   └── package.json
│   ├── docker-compose.yaml        # frontend + backend + postgres:15-alpine + redis:7-alpine
│   ├── package.json               # Корневые скрипты (concurrently, тесты, сборка, линтинг)
│   └── README.md                  # Подробная документация TravelHub Ultimate
├── index.php, common.php, ...     # Legacy PHP-сайт и ресурсы (images/, setup/, styles.css)
├── extract_travelhub_code.py      # Python-скрипт извлечения кода из истории диалогов
├── merge_travelhub_versions.py    # Python-скрипт слияния версий с SHA-256 проверкой
├── travelhub-v1.0/, v1.1/, ...    # Архивные и промежуточные версии проекта + *.zip
├── render.yaml                    # Конфигурация деплоя на Render
├── LICENSE                        # Лицензия GNU AGPLv3
└── *.md / *.txt                   # Отчёты аудита, интеграции и инструкции по деплою
```

### Команды разработки (в `travelhub-ultimate/`)

```bash
cd travelhub-ultimate
npm run install:all    # установка зависимостей корневого пакета, backend и frontend
npm run dev            # одновременный запуск backend (tsx watch) и frontend (vite)
npm run build          # prisma generate + tsc (backend) и vite build (frontend)
npm run lint           # ESLint для backend и frontend
npm run test:backend   # тесты Vitest для backend
npm run test:frontend  # тесты Vitest для frontend
```

## Ветки и статус разработки

- **`main`** — основная ветка, объединяющая `travelhub-ultimate/`, legacy PHP-код, Python-утилиты миграции, архивы версий и отчёты.
- **Открытые Pull Requests:** отсутствуют (на момент проверки).
- **Рабочие ветки в репозитории (16 веток):**
  - `copilot/update-ci-workflow-variables` — обновление конфигураций CI/CD (`.github/workflows/backend-tests.yml`, `e2e.yml`) и `render.yaml` (в частности, в `backend-tests.yml` убрана зависимость от Redis в интеграционных/E2E шагах и скорректирован `FRONTEND_URL`).
  - `svend4-patch-1` — ветка с отдельным статическим прототипом `travel-agency-website.html` (и его копиями), `travel1blue.zip`, `001_Travel_program_.json` и материалами анализа `travel1blue_анализ*.md.txt`.
  - Ветки доработок и аудита: `copilot/fix-ci-cd-workflow-errors`, `copilot/fix-missing-env-variables`, `copilot/fix-redis-client-compatibility`, а также серия веток `claude/*` (`add-russian-language-WpZtp`, `audit-travel-hub-frontend-AnwYG`, `compare-feature-lists-7YzA2`, `extract-travel-agency-code-sdASp`, `fix-frontend-backend-connection-0Tn9i`, `fix-pr154-tests-6mhyP`, `fix-render-yaml-GMPrZ`, `project-audit-6mhyP`, `review-travel-agency-9A4Ks`, `test-frontend-backend-connection-GMPrZ`).

## Лицензия

В корне репозитория действует лицензия **GNU Affero General Public License v3.0 (AGPL-3.0)** — полный текст приведён в файле [`LICENSE`](LICENSE). (В документации внутри подкаталога `travelhub-ultimate/README.md` исторически указана MIT License.)
