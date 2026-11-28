# Log Count

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=rs-log-count)**

Считает уровни событий в текстовом журнале по первому полю каждой непустой строки.

[Открыть демо](https://mainstarkov.github.io/portfolio/rs-log-count/)

## Возможности

- Распознаёт `INFO`, `WARN` и `ERROR`.
- Незнакомые значения считает в категории `OTHER`.
- Пропускает пустые строки.

## Скачать и запустить

**Требования.** Rust и Cargo. Внешних crates нет.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/rust/rs-log-count` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/rust/rs-log-count
```

Выполните в этой папке:

```sh
cargo run -- example.log
```

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

В примере получится `INFO: 2` и `WARN: 1`. Подставьте путь к своему журналу с уровнем в первом поле.

## Как устроено

`src/main.rs` подсчитывает уровни. `example.log` содержит тестовый журнал.
