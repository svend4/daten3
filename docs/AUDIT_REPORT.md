# Технический аудит репозитория `svend4/daten3`

**Ветка аудита:** `audit/code-review` (ответвлена от `main`, базовый коммит `52282fdc54b8641fdc41a648453a02bc432b22fb`)  
**Незатронутые ветки:** `main`, `docs/add-readme-ru`, `copilot/*`, `claude/*`, `svend4-patch-1`

---

## 1. Сосуществование legacy PHP и платформы `travelhub-ultimate/`

Репозиторий `daten3` совмещает в ветке `main` несколько исторических слоёв:

1. **Legacy PHP-сайт (корень репозитория):**
   - Файлы `index.php`, `common.php`, `top.php`, `start.php`, `redirect.php`, `styles.css`, каталоги `images/`, `setup/`.
   - `index.php` использует устаревшую HTML4-разметку `<frameset>` с загрузкой партнёрского фрейма `http://www.travelnow.com/hotels/searchframe.jsp?cid=<? echo $travel_id ?>` по незашифрованному HTTP (`charset=iso-8859-1`) и PHP short tags (`<?`).
   - В `common.php` зашиты статические значения партнёра (`$travel_id = "83700"`, `$email = "jennifer@alnicoproducts.com"`, `$site_url = "http://www.urnthecountryof.com/"`).
2. **Архивы, исторические снимки и Python-инструменты миграции (корень):**
   - Каталоги ранних версий и выгрузок: `travelagency-1/`, `travelagency-2/`, `travelagency-organized/`, `travelhub-v1.0/`, `travelhub-v1.1/`, `travelhub-data/`, `travelhub-extracted-organized/`, `travelhub-full-extracted/`.
   - 7 бинарных `.zip`-архивов в корне (`data-2025-12-19-20-25-41-batch-0000.zip`, `daten-Travelagency (1).zip`, `daten-claude-organize-travel-agency-files-o4QiM.zip`, `daten-travelagency (2).zip`, `travel1blue.zip`, `travelhub-complete.zip`, `travelhub-v1.1-complete.zip`), несвязанный файл `flower-shop (2).html` (487 КБ), а также скрипты `extract_travelhub_code.py` и `merge_travelhub_versions.py`.
   - В корне до текущего аудита отсутствовали `.gitignore`, `.env.example` и каталог `docs/`.
3. **Современная платформа `travelhub-ultimate/`:**
   - Корневой `travelhub-ultimate/package.json` (`"private": true`, `engines.node >= 18.0.0`, `concurrently`) координирует скрипты `backend` и `frontend`.
   - `travelhub-ultimate/backend/package.json` (`travelhub-backend`, `"type": "module"`): Express `4.18.2`, TypeScript `5.3.3`, Prisma `5.22.0`, `@apollo/server` `5.2.0` + `graphql` `16.12.0`, `socket.io` `4.8.1`, `redis` `4.6.11`, `bullmq` `5.66.2`, `jsonwebtoken`, `bcrypt`, `helmet`, `zod`, `winston`, `prom-client`, OpenTelemetry, Vitest `4.0.16`, Playwright `1.57.0`.
   - `travelhub-ultimate/frontend/package.json` (`travelhub-frontend`, `"private": true`, `"type": "module"`): React `18.2.0`, TypeScript `5.3.3`, Vite `7.3.0`, Tailwind CSS `3.3.6`, `@tanstack/react-query`, `zustand`, `axios`, `react-router-dom`, `recharts`, `vitest`, `@playwright/test`.
   - **Архитектурный риск сосуществования:** в `.github/workflows/static.yml` (активен на `push` в `main`) шаг `upload-pages-artifact` выгружает `path: '.'` — то есть весь корень репозитория целиком, включая PHP-исходники, бинарные `.zip`-архивы, `backend/` и `.env.production`.

---

## 2. Аудит CI/CD-конфигураций (`.github/workflows/`)

В корневом `.github/workflows/` находятся 6 workflow-файлов; ещё 3 устаревших/неактивных файла лежат во вложенном `travelhub-ultimate/.github/workflows/` (`ci.yml`, `cd.yml`, `deploy.yml`), которые GitHub Actions **не запускает** (GitHub Actions читает только `.github/workflows/` в корне репозитория).

### Выявленные проблемы в CI/CD
1. **Недостающие переменные окружения в `.github/workflows/test.yml`:**
   - В задачах `integration-tests` и `coverage` передаются `DATABASE_URL` и `REDIS_URL`, но **не заданы** `JWT_SECRET` и `JWT_REFRESH_SECRET`.
   - При этом `travelhub-ultimate/backend/src/config/index.ts` вызывает `getEnvVar('JWT_SECRET')` и `getEnvVar('JWT_REFRESH_SECRET')` без fallback-значения — даже при `NODE_ENV=test` функция `getEnvVar` бросает `Error`, если переменная отсутствует (в отличие от `.github/workflows/backend-tests.yml`, где оба секрета переданы явно).
2. **Расхождение учётных данных PostgreSQL между workflow:**
   - `.github/workflows/test.yml` и `.github/workflows/e2e.yml` используют `postgresql://test:test@localhost:5432/travelhub_test`.
   - `.github/workflows/backend-tests.yml` использует `postgresql://travelhub_test:test_password@localhost:5432/travelhub_test` (integration) и `postgresql://travelhub_e2e:e2e_password@localhost:5432/travelhub_e2e` (e2e).
3. **Дублирование и расхождение E2E-конфигураций (`e2e.yml` vs `backend-tests.yml`):**
   - `e2e.yml` запускает сервер на `PORT=5000` с `FRONTEND_URL: http://localhost:3000` и выполняет `npm run test:e2e` (Playwright).
   - `backend-tests.yml` (`e2e-tests`) запускает сервер с `NODE_ENV=production`, `PORT=3000`, `FRONTEND_URL: http://localhost:3001`, делает `sleep 10` и проверяет только `curl -f http://localhost:3000/health` без запуска Playwright.
4. **Отсутствие активного CI для фронтенда:**
   - Ни один workflow в корневом `.github/workflows/` не запускает `lint`, `type-check`, `test` или `build` для `travelhub-ultimate/frontend/` — эти шаги присутствуют только в неактивном `travelhub-ultimate/.github/workflows/ci.yml`.
5. **Конфликт публикаций GitHub Pages:**
   - Оба файла `.github/workflows/static.yml` и `.github/workflows/jekyll-gh-pages.yml` запускаются при `push` в `main` и деплоятся в одно и то же окружение `github-pages` с одинаковой группой `concurrency: group: "pages"`.
6. **Ошибки во вложенном `travelhub-ultimate/.github/workflows/deploy.yml`:**
   - Используются устаревшие экшены `actions/checkout@v3`, `setup-node@v3`, `upload-artifact@v3` и неверные пути `working-directory: ./frontend` и `./backend` (без префикса `travelhub-ultimate/`).

---

## 3. Сравнение устаревших веток (`copilot/update-ci-workflow-variables`, `svend4-patch-1`)

1. **`copilot/update-ci-workflow-variables` (`0e8fb3ae74122550f3068398e164c17d3e139e9d`, 2025-12-24):**
   - Содержит 1 коммит от `copilot-swe-agent[bot]` поверх merge PR #168 (`2a522b148...`): добавляет 1 строку в `.github/workflows/backend-tests.yml` (`FRONTEND_URL: http://localhost:5173,http://localhost:3001` в шаге `Start backend server`).
   - В `main` (`52282fdc...`) в `.github/workflows/backend-tests.yml` уже присутствует `FRONTEND_URL: http://localhost:3001`. Таким образом, ветка функционально устарела и не требует слияния (при необходимости поддержки обоих локальных портов в E2E достаточно перенести `http://localhost:5173,http://localhost:3001` точечно).
2. **`svend4-patch-1` (`da752dc54bf4667e811efa3d972a2ea9ffcb9c53`, 2025-12-19):**
   - Ответвлена напрямую от первого коммита репозитория (`8f145bbcf...`) и полностью разошлась с `main`.
   - Добавляет 9 загруженных файлов (`+4606` строк): `001_Travel_program_.json`, `travel1blue.zip` (архив уже присутствует в `main`), 3 идентичные копии `travel-agency-website*.html` (по 961 строке) и 4 идентичные копии `travel1blue_анализ*.md.txt` (по 427 строк).
   - Слияние с `main` нецелесообразно; ветка представляет собой ранний архивный снимок.

---

## 4. Prisma, Docker, Render и переменные окружения

### 4.1. Схема Prisma (`travelhub-ultimate/backend/prisma/schema.prisma`)
- Провайдер БД: `postgresql`, строка подключения `url = env("DATABASE_URL")`.
- Определены 12 моделей (`User`, `Booking`, `Favorite`, `PriceAlert`, `Affiliate`, `Referral`, `Commission`, `Payout`, `AffiliateClick`, `AffiliateSettings`, `RefreshToken`, `PasswordResetToken`), первичные ключи `uuid()` (кроме `AffiliateSettings` с `cuid()`).
- Несогласованность валют по умолчанию: в `schema.prisma` (`Booking`, `PriceAlert`, `Commission`, `Payout`) стоит `@default("RUB")`, тогда как в `travelhub-ultimate/backend/.env.example` (`DEFAULT_CURRENCY=USD`) и `travelhub-ultimate/frontend/.env.example` (`VITE_DEFAULT_CURRENCY=USD`) задан `USD`.

### 4.2. Docker и Render
1. **Риск сборки `travelhub-ultimate/backend/Dockerfile`:**
   - В multi-stage образе на этапе production выполняется `RUN npm ci --omit=dev`, а в `backend/package.json` задан `"postinstall": "npx prisma generate"`.
   - При этом сам пакет `"prisma": "^5.22.0"` находится в `devDependencies`, а не в `dependencies`. При чистой сборке с `--omit=dev` (и при запуске `CMD ["npm", "run", "start:render"]`, который вызывает `npx prisma migrate deploy` в `start-render.mjs`) `npx` вынужден скачивать CLI `prisma` из сети без фиксации или падает в изолированной среде.
2. **Валидация окружения (`backend/src/config/env.validator.ts` и `config/index.ts`):**
   - Обязательные в `production`: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`.
   - Рекомендуемые: `TRAVELPAYOUTS_TOKEN`, `TRAVELPAYOUTS_MARKER`, `PORT`, `NODE_ENV`.
   - При чтении конфигурации `config/index.ts` `getEnvVar('DATABASE_URL')`, `getEnvVar('JWT_SECRET')`, `getEnvVar('JWT_REFRESH_SECRET')` не имеют значений по умолчанию — при их отсутствии приложение падает при старте в любом режиме, кроме случаев, когда переменные переданы заранее.
3. **Небезопасные fallback-значения в `travelhub-ultimate/docker-compose.yaml`:**
   - Для `backend` прописаны `JWT_SECRET=${JWT_SECRET:-change-me-in-production}`, `JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-change-me-in-production}` и `POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password}`. Если запустить стек без явного `.env`, сервер в `NODE_ENV=production` поднимется с предсказуемыми секретами по умолчанию.
4. **Несоответствие имени файла и CORS в `travelhub-ultimate/docker-compose.dev.yml`:**
   - Комментарий в `docker-compose.dev.yml` указывал несуществующее имя `docker-compose.yml` вместо `docker-compose.yaml`, а сервис `backend` не задавал `FRONTEND_URL` с портом Vite `5173`.
5. **Расхождение имён SMTP-переменных в `travelhub-ultimate/backend/render.yaml`:**
   - `backend/render.yaml` описывает `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, тогда как `src/config/index.ts`, `src/services/email.service.ts` и `backend/.env.example` читают `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (а `.env.production.example` ошибочно упоминает `SMTP_PASSWORD` вместо `SMTP_PASS`).
6. **Несоответствие `swagger.config.ts` и `vite.config.ts`:**
   - В `travelhub-ultimate/backend/src/config/swagger.config.ts` (строка 30) в качестве `url` production-сервера API указано `process.env.FRONTEND_URL || 'https://daten3-1.onrender.com'`, хотя `FRONTEND_URL` — это origin фронтенда для CORS, а не URL API.
   - В `travelhub-ultimate/frontend/vite.config.ts` прокси `/api` использует `target: process.env.VITE_API_BASE_URL || 'http://localhost:3000'`, тогда как `frontend/.env.example` и `frontend/.env.production` задают `VITE_API_BASE_URL` уже с суффиксом `/api` (`http://localhost:3000/api`).
   - В Git уже закоммичен `travelhub-ultimate/frontend/.env.production` с URL `https://daten3-1.onrender.com/api`, жёстко привязывающий продакшен-сборки фронтенда к конкретному инстансу Render, если переменная не переопределена при сборке.

---

## 5. Согласованность лицензий (`AGPL-3.0` vs `MIT`)

В репозитории выявлен прямой конфликт лицензионных деклараций:

- **Корневой файл `LICENSE`:** содержит полный текст **GNU Affero General Public License v3.0 (AGPL-3.0)** (34 523 байта, SHA `0ad25db4bd1d86c452db3f9602ccdbe172438f52`).
- **Файлы `package.json`:** ни корневой `travelhub-ultimate/package.json`, ни `travelhub-ultimate/backend/package.json`, ни `travelhub-ultimate/frontend/package.json` не содержат поля `"license"`.
- **Упоминания `MIT` в коде и документации:**
  - `travelhub-ultimate/backend/src/config/swagger.config.ts` (`license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' }`);
  - `travelhub-ultimate/README.md` (`MIT License - см. LICENSE файл для деталей.`);
  - `travelhub-ultimate/backend/README.md` (`MIT License`);
  - `travelhub-ultimate/README_ULTIMATE.md`, `travelhub-ultimate/README_v1.1.md`, `README_v1.1.txt`, `travelhub-v1.0/travelhub-complete/README.md`, `travelhub-v1.1/travelhub-complete/README.md`.

**Рекомендация:** владельцу репозитория необходимо зафиксировать единую лицензию (привести `swagger.config.ts`, `README*.md` и `package.json` к `AGPL-3.0-only`, если каноничен корневой `LICENSE`, либо обновить корневой `LICENSE`, если проект распространяется под `MIT`).

---

## 6. Внесённые безопасные исправления в ветке `audit/code-review`

1. **Добавлен корневой `.gitignore`:** защищает корень репозитория от случайного коммита `.env`, `.env.local`, `.env.*.local`, `node_modules/`, `dist/`, `build/`, `coverage/`, логов и системных файлов (сохраняя шаблоны `.env.example`, `.env.*.example`, `.env.test`).
2. **Добавлен корневой `.env.example`:** единая входная точка для переменных окружения, согласованная с `travelhub-ultimate/docker-compose.yaml`, `backend/src/config/env.validator.ts`, `backend/src/config/index.ts`, `prisma/schema.prisma` и `frontend/vite.config.ts`, со ссылками на шаблоны в `travelhub-ultimate/`.
3. **Исправлен `travelhub-ultimate/docker-compose.dev.yml`:**
   - В комментарии исправлено имя базового файла (`docker-compose.yml` -> `docker-compose.yaml`).
   - В окружение `backend` добавлен `FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173,http://localhost:3001}` для корректной работы CORS при локальной разработке через Vite (`5173`) и Nginx/Docker (`3001`).

---

## 7. Приоритетные рекомендации (для последующих PR)

1. Добавить `JWT_SECRET` и `JWT_REFRESH_SECRET` в `.github/workflows/test.yml` (`integration-tests` и `coverage`), унифицировать БД-учётные данные и добавить фронтенд-проверки в корневой CI.
2. Отключить или сузить `.github/workflows/static.yml` (не выгружать весь корень с `.zip` и `backend/` в GitHub Pages) и разрешить конфликт с `jekyll-gh-pages.yml`.
3. В `travelhub-ultimate/backend/Dockerfile` либо перенести `prisma` в `dependencies` / убрать runtime-вызов `npx prisma` в `--omit=dev`, либо копировать сгенерированный `@prisma/client` из stage `builder` без `postinstall` загрузки.
4. Заменить `EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_USER`/`EMAIL_PASSWORD` на `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` в `travelhub-ultimate/backend/render.yaml` и `RENDER_DEPLOY_GUIDE.md` (а `SMTP_PASSWORD` -> `SMTP_PASS` в `.env.production.example`).
5. Устранить конфликт лицензий `AGPL-3.0` vs `MIT` и расхождение `FRONTEND_URL` в `swagger.config.ts`.
