# Проекты Алексея Старкова

API на Go, Telegram-боты и небольшие инструменты на Go, Python, Node.js и Rust.

**[Открыть сайт портфолио](https://mainstarkov.github.io/portfolio-projects/)** · [Попробовать примеры API](https://mainstarkov.github.io/portfolio-projects/#lab) · [Весь каталог](https://mainstarkov.github.io/portfolio-projects/#projects)

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="assets/hedgehog.png">
  <img src="assets/hedgehog.gif" alt="mainstarkov — пиксельный ёжик на фиолетовом фоне. Go, Python, Node.js и Rust." width="960">
</picture>

## Бэкенд на Go

| Сервис | Что делает | Локальный адрес | Демо |
| :--- | :--- | :--- | :--- |
| [Ссылки с TTL](projects/go/go-expiring-links) | Выдаёт короткую ссылку и перенаправляет до окончания срока | `http://127.0.0.1:8081` | [Запрос и ответ](https://mainstarkov.github.io/portfolio-projects/go-expiring-links/) |
| [Очередь задач](projects/go/go-job-queue) | Выполняет задачи в фоновом воркере и выдаёт результат по ID | `http://127.0.0.1:8083` | [Запрос и ответ](https://mainstarkov.github.io/portfolio-projects/go-job-queue/) |
| [Приём событий](projects/go/go-event-inbox) | Ведёт журнал событий, распознаёт повторы и конфликты | `http://127.0.0.1:8084` | [Запрос и ответ](https://mainstarkov.github.io/portfolio-projects/go-event-inbox/) |

Для запуска сервиса перейдите в его папку и выполните `go run .` (Go 1.22+). Примеры `curl` находятся в README каждого сервиса.

## Запустить витрину локально

```sh
git clone https://github.com/mainstarkov/portfolio-projects.git
cd portfolio-projects
python3 -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Откройте http://127.0.0.1:8000. Интернет нужен для перехода к отдельным репозиториям и опубликованным демо.

## Мини-проекты

### Go

- [go-dir-weight](https://github.com/mainstarkov/go-dir-weight) — Показывает размер файлов по папкам первого уровня. Символические ссылки пропускаются.
- [go-file-fingerprint](https://github.com/mainstarkov/go-file-fingerprint) — Вычисляет SHA-256 файла и умеет сверять его с ожидаемой контрольной суммой.
- [go-csv-columns](https://github.com/mainstarkov/go-csv-columns) — Извлекает выбранные столбцы CSV в заданном порядке и пишет результат в стандартный вывод.
- [go-text-tally](https://github.com/mainstarkov/go-text-tally) — Считает строки, слова и символы Unicode в UTF-8-файле.
- [go-timer-board](https://github.com/mainstarkov/go-timer-board) — Терминальный таймер обратного отсчёта с поддержкой секунд и минут.
- [go-url-batch](https://github.com/mainstarkov/go-url-batch) — Разбирает список URL из файла и группирует адреса по домену.

### Python

- [py-subscription-ledger](projects/python/py-subscription-ledger) — Сводит месячные и годовые подписки к годовому бюджету. Суммы считаются через Decimal.
- [py-markdown-index](projects/python/py-markdown-index) — Строит Markdown-каталог заметок из заголовков и относительных ссылок.
- [py-focus-pick](projects/python/py-focus-pick) — Выбирает, за какую задачу взяться, с учётом важности и оценки времени.
- [py-srt-shift](projects/python/py-srt-shift) — Сдвигает временные метки субтитров SRT на указанное число миллисекунд. Результат выводится в терминал.
- [py-study-telegram](projects/python/py-study-telegram) — Telegram-бот для повторения карточек. Команда /card выдаёт вопрос, /answer показывает ответ последней карточки в чате.
- [py-rss-digest](projects/python/py-rss-digest) — Собирает заголовки из локального RSS или Atom в компактную текстовую ленту.

### Node.js

- [node-decision-bot](projects/nodejs/node-decision-bot) — Терминальный бот для равновероятного выбора из нескольких вариантов.
- [node-dev-port](projects/nodejs/node-dev-port) — Проверяет, доступна ли локальная TCP-связь с приложением на указанном порту.
- [node-query-card](projects/nodejs/node-query-card) — Преобразует параметры строки запроса в JSON. Повторяющиеся ключи сохраняются как массивы.
- [node-coffee-ratio](https://github.com/mainstarkov/node-coffee-ratio) — Лендинг с калькулятором пропорций для фильтр-кофе. [Открыть демо](https://mainstarkov.github.io/node-coffee-ratio/)
- [node-reading-pace](https://github.com/mainstarkov/node-reading-pace) — Лендинг-планировщик чтения по оставшимся страницам и дням. [Открыть демо](https://mainstarkov.github.io/node-reading-pace/)
- [node-team-split](https://github.com/mainstarkov/node-team-split) — Лендинг для деления общего счёта с распределением остатка по копейкам. [Открыть демо](https://mainstarkov.github.io/node-team-split/)

### Rust

- [rs-pomodoro-plan](projects/rust/rs-pomodoro-plan) — Рассчитывает расписание фокус-сессий и перерывов по минутам от начала.
- [rs-log-count](projects/rust/rs-log-count) — Считает события INFO, WARN, ERROR и прочие уровни по первому полю каждой непустой строки.
- [rs-line-dedupe](projects/rust/rs-line-dedupe) — Удаляет повторяющиеся строки UTF-8, сохраняя порядок первых вхождений.
- [rs-unit-counter](projects/rust/rs-unit-counter) — Переводит размер в байтах в двоичные единицы IEC.
- [rs-palette-contrast](projects/rust/rs-palette-contrast) — Считает коэффициент контраста двух цветов sRGB по формуле относительной яркости.
- [rs-week-grid](projects/rust/rs-week-grid) — Генерирует Markdown-таблицу на семь дней для списка привычек.
