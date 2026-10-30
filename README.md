# Task Manager

Тестовое задание для Middle Frontend-разработчика: приложение для управления списками и задачами.

Архитектурные решения и их причины описаны в [документе решений](docs/decisions.md).

## Запуск

Требуются Node.js 22.12+ и pnpm 11.19.0.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Перед запуском заполните `SESSION_SECRET` в `.env.local`: случайная строка длиной не менее 32 символов. Сгенерировать её можно командой `openssl rand -hex 32`. Реальный ключ не коммитится. При публикации задайте отдельный ключ в переменных окружения Vercel.

Откройте адрес из вывода терминала: обычно http://localhost:3000. Если порт занят, Next.js выберет следующий свободный.

## Проверки

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm build-storybook
```

Перед первым запуском браузерных тестов установите Chromium:

```bash
pnpm test:install-browser
```

Для автоматического форматирования используйте `pnpm format`, для исправления ошибок линтера — `pnpm lint:fix`.

## Вход

- Страница входа: `/login`. Главная страница перенаправляет на `/lists`, а без сессии — на `/login`.
- Проверочная учётная запись: `admin@example.com` / `Admin123!`. Регистрация не предусмотрена заданием.
- Данные проверяются серверным действием; пароль не передаётся в cookie. Подписанная через `jose` сессия хранится 8 часов в HttpOnly cookie с SameSite=Lax и Secure в production.
- `/lists` проверяет подпись и срок действия сессии перед отображением. Общий хедер показывает пользователя, переключатель темы и кнопку выхода; реестр списков ещё не реализован.
- После выхода cookie удаляется, а доступ к `/lists` снова требует входа. Во всех будущих операциях с данными также потребуется серверная проверка сессии.

## Ant Design

Корневой layout подключает `AppProviders` из `src/app/providers`. Он собирает один `AntdRegistry` для серверных стилей, `ThemeProvider` для выбора темы и `AntdProvider` для русской локализации, темы и контекста Ant Design.

Токены темы находятся в `src/shared/config/antd.ts`. Storybook использует тот же `AppProviders`, что и приложение.

## Тема и хедер

На рабочих страницах общий хедер содержит ссылку на списки, email пользователя, выход и переключатель «Светлая / Тёмная / Системная». Он подключён в layout группы `(workspace)`.

По умолчанию используется системная тема. `next-themes` сохраняет выбор в localStorage под ключом `task-manager-theme` и отслеживает изменения темы ОС в системном режиме. Ant Design переключается между `defaultAlgorithm` и `darkAlgorithm`; фон и собственные стили используют CSS-переменные. Выбранная тема применяется и к странице входа.

## Vitest и Storybook

В Vitest настроены два проекта:

- `unit` — юнит-тесты бизнес-логики в файлах `src/**/*.test.ts`, среда Node.js.
- `storybook` — истории компонентов и их `play`-сценарии в Chromium через Playwright.

```bash
pnpm test                  # все существующие тесты, один прогон
pnpm test:watch            # наблюдение за изменениями
pnpm test:unit             # только юнит-тесты
pnpm test:storybook        # только истории и interaction tests
pnpm storybook            # Storybook на http://localhost:6006
pnpm build-storybook      # статическая сборка в storybook-static
```

История `UI/Ant Design` проверяет инфраструктуру. Продуктовые истории `Features/Auth/LoginForm` проверяют отправку формы, обязательные поля, некорректный email, ошибку учётных данных, сетевую ошибку, повторную отправку и блокировку полей во время запроса. В Storybook обработчик входа заменяется контролируемой функцией; реальные cookie проверяются в приложении. История `Features/Theme/ThemeSwitcher` проверяет выбор трёх режимов, применённую тему и сохранение настройки. Сценарий смены статуса будет добавлен вместе с интерфейсом задач.

Юнит-тесты модели задач проверяют сортировку, счётчики, прогресс, преимущество просрочки и границы интервала 48 часов. Время передаётся в функции явно и зафиксировано в тестах. Запуск: `pnpm test:unit`.

В задании указан пакет `@storybook/test`. В установленном Storybook 10 его функции доступны через `storybook/test`: именно оттуда импортируются `expect`, `fn` и инструменты взаимодействия. Используем актуальный API, описанный в [документации Storybook](https://storybook.js.org/docs/writing-tests/interaction-testing).

## Структура

- `src/app/layout.tsx` — общий HTML-каркас, метаданные и Ant Design registry.
- `src/app/providers/app-providers.tsx` — сборка общих провайдеров приложения и Storybook.
- `src/app/providers/antd-provider.tsx` — локализация, тема и контекст Ant Design.
- `src/app/providers/index.ts` — публичный экспорт `AppProviders`.
- `src/app/page.tsx` — перенаправление на `/lists`.
- `src/app/(auth)/login` и `src/app/(workspace)/lists` — маршруты входа и защищённого рабочего экрана.
- `src/app/(workspace)/layout.tsx` — проверка сессии и общий каркас рабочих страниц.
- `src/widgets/app-header` — общий хедер.
- `src/features/theme` — переключатель темы и его история.
- `src/views/login` и `src/views/lists` — композиция экранов.
- `src/features/auth` — форма, её типы, истории и Server Actions входа/выхода. `api/actions.ts` содержит серверные действия; публичный серверный вход — `api/index.ts`.
- `src/server/auth/session.ts` — проверочная учётная запись, подпись и проверка сессии, cookie.
- `src/app/globals.css` — общие стили и оформление начальной страницы.
- `src/shared/config/antd.ts` — типизированная тема Ant Design.
- `src/entities/task` — модель задачи, функции `sortTasks` и `getTaskStats`, их юнит-тесты и публичный API.
- `src/stories/antd.stories.tsx` — проверочная история с `play`.
- `.storybook` — настройки Storybook и общего окружения тестов.
- `vitest.config.ts` — конфигурация юнит- и браузерных тестов.
- `@/*` — сокращённый путь к файлам внутри `src`.

Вход и выход реализованы. Общий хедер и переключение темы реализованы. Реестр списков, CRUD задач и подключение PostgreSQL пока не реализованы.
