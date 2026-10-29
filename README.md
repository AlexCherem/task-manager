# Task Manager

Тестовое задание для Middle Frontend-разработчика: приложение для управления списками и задачами.

Архитектурные решения и их причины описаны в [документе решений](docs/decisions.md).

## Запуск

Требуются Node.js 22.12+ и pnpm 11.19.0.

```bash
pnpm install
pnpm dev
```

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

## Ant Design

В корневом layout подключён один `AntdRegistry`: он добавляет стили Ant Design в HTML при серверном рендеринге. Клиентский `Providers` задаёт русскую локализацию, общую тему и контекст Ant Design.

Токены темы находятся в `src/shared/config/antd.ts`. Storybook использует тот же `Providers`, что и приложение.

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

Пока добавлена одна проверочная история `UI/Ant Design`: нажатие кнопки вызывает переданный обработчик. Она проверяет подключение Ant Design, общего provider и браузерного запуска тестов. Сценарии входа, валидации и смены статуса будут добавляться вместе с соответствующими функциями приложения.

Юнит-тестов пока нет: бизнес-логика ещё не реализована. Поэтому отдельный `pnpm test:unit` сообщает `No test files found`; для однократной проверки конфигурации без тестов можно выполнить `pnpm test:unit --passWithNoTests`. Требуемые заданием минимум восемь юнит-тестов на сортировку и счётчики ещё предстоит написать.

В задании указан пакет `@storybook/test`. В установленном Storybook 10 его функции доступны через `storybook/test`: именно оттуда импортируются `expect`, `fn` и инструменты взаимодействия. Используем актуальный API, описанный в [документации Storybook](https://storybook.js.org/docs/writing-tests/interaction-testing).

## Структура

- `src/app/layout.tsx` — общий HTML-каркас, метаданные и Ant Design registry.
- `src/app/providers.tsx` — клиентские React/Ant Design providers.
- `src/app/page.tsx` — начальная страница `/`, серверный компонент.
- `src/app/globals.css` — общие стили и оформление начальной страницы.
- `src/shared/config/antd.ts` — типизированная тема Ant Design.
- `src/stories/antd.stories.tsx` — проверочная история с `play`.
- `.storybook` — настройки Storybook и общего окружения тестов.
- `vitest.config.ts` — конфигурация юнит- и браузерных тестов.
- `@/*` — сокращённый путь к файлам внутри `src`.

Вход, списки, задачи, слой данных и переключение темы пока не реализованы.
