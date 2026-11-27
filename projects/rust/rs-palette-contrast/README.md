# Palette Contrast

Вычисляет контраст двух цветов sRGB по их относительной яркости.

[Открыть демо](https://mainstarkov.github.io/portfolio/rs-palette-contrast/)

## Возможности

- Принимает два шестизначных HEX-цвета с решёткой или без неё.
- Считает одинаковое отношение независимо от порядка цветов.
- Выводит результат с двумя десятичными знаками.

## Скачать и запустить

**Требования.** Rust и Cargo. Внешних crates нет.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/rust/rs-palette-contrast` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/rust/rs-palette-contrast
```

Выполните в этой папке:

```sh
cargo run -- '#202020' '#ffffff'
```

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

В примере ожидается `16.29:1`. Для белого и чёрного получится `21.00:1`.

## Как устроено

`src/main.rs` разбирает HEX, вычисляет яркость и печатает результат.
