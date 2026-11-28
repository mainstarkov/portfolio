# Pomodoro Plan

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=rs-pomodoro-plan)**

Строит расписание фокус-сессий и перерывов, считая минуты от начала занятия.

[Открыть демо](https://mainstarkov.github.io/portfolio/rs-pomodoro-plan/)

## Возможности

- Принимает количество раундов, длительность работы и перерыва.
- Не добавляет перерыв после последнего раунда.
- Выводит только план, который можно сохранить в файл.

## Скачать и запустить

**Требования.** Rust и Cargo. Внешних crates нет.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/rust/rs-pomodoro-plan` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/rust/rs-pomodoro-plan
```

Выполните в этой папке:

```sh
cargo run -- 3 25 5
```

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

Три сессии по 25 минут с двумя перерывами по пять минут займут 85 минут.

## Как устроено

`src/main.rs` рассчитывает последовательность интервалов.
