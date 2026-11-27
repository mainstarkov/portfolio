# Line Dedupe

Убирает повторяющиеся строки из UTF-8-файла, сохраняя порядок первых вхождений.

[Открыть демо](https://mainstarkov.github.io/portfolio/rs-line-dedupe/)

## Возможности

- Читает строки последовательно.
- Сравнивает строки целиком с учётом регистра и пробелов.
- Печатает уникальные строки в стандартный вывод.

## Скачать и запустить

**Требования.** Rust и Cargo. Внешних crates нет.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/rust/rs-line-dedupe` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/rust/rs-line-dedupe
```

Выполните в этой папке:

```sh
cargo run -- example.txt
```

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

Останутся `pear` и `apple`, каждая на своей строке. Для записи добавьте `> unique.txt`.

## Как устроено

`src/main.rs` обрабатывает файл. `example.txt` содержит повторы.
