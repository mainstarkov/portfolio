# Week Grid

Генерирует Markdown-таблицу привычек с ячейками для отметок на семь дней.

[Открыть демо](https://mainstarkov.github.io/portfolio/rs-week-grid/)

## Возможности

- Создаёт строку для каждого переданного названия.
- Поддерживает названия из нескольких слов в кавычках.
- Пишет готовую таблицу в терминал.

## Скачать и запустить

**Требования.** Rust и Cargo. Внешних crates нет.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/rust/rs-week-grid` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/rust/rs-week-grid
```

Выполните в этой папке:

```sh
cargo run -- Walk "Read a book"
```

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

В таблице появятся две привычки и столбцы с понедельника по воскресенье. Чтобы сохранить её, добавьте `> week.md`.

## Как устроено

`src/main.rs` проверяет названия и формирует Markdown.
