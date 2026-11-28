# Unit Counter

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=rs-unit-counter)**

Переводит число байтов в двоичные единицы IEC, например KiB, MiB и GiB.

[Открыть демо](https://mainstarkov.github.io/portfolio/rs-unit-counter/)

## Возможности

- Выбирает подходящую единицу автоматически.
- Принимает целое неотрицательное число байтов.
- Форматирует результат до двух знаков, когда значение достигает 1 KiB.

## Скачать и запустить

**Требования.** Rust и Cargo. Внешних crates нет.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/rust/rs-unit-counter` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/rust/rs-unit-counter
```

Выполните в этой папке:

```sh
cargo run -- 1572864
```

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

Для примера результат — `1.50 MiB`.

## Как устроено

`src/main.rs` выполняет пересчёт через степени 1024.
