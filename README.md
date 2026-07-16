# eCars Scout

Локальная персональная лента автомобилей. Интерфейс работает на 15 реалистичных mock-объявлениях; решения, оценки характеристик и позиция ленты сохраняются в локальной SQLite-базе.

## Запуск

Требуется Node.js 20 или новее.

```bash
npm install
npm run app
```

Приложение откроется на `http://127.0.0.1:4317`.

## Управление

- `←` / `→` — не нравится / нравится
- `↑` — возможно
- `W` — следить
- `S` — пропустить
- `Cmd+Z` (или `Ctrl+Z`) — отменить последнее решение

Команда запускает frontend на `127.0.0.1:4317` и локальный API на `127.0.0.1:4318`. Данные находятся в `data/ecars-scout.db`; файл исключён из Git.

## Проверка

```bash
npm run test
```

Следующие этапы — ручная авторизация и реальный сбор eCarsTrade, ранжирование, LLM и расчёт импорта.

# eCarsTrade

## GitHub Actions authentication

The hourly session workflow expects the repository Actions secrets
`ECARSTRADE_LOGIN` and `ECARSTRADE_PASSWORD`. The Playwright session is cached
only after AES-256 encryption. Before every run the fixed-price section is used
to verify authentication; an expired session is restored automatically.
