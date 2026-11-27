# Query Card

Преобразует строку параметров URL в JSON, который удобно читать и обрабатывать.

[Открыть демо](https://mainstarkov.github.io/portfolio/node-query-card/)

## Возможности

- Разбирает символы с процентным кодированием.
- Преобразует знак `+` в пробел.
- Повторяющиеся параметры записывает массивом в исходном порядке.

## Скачать и запустить

**Требования.** Node.js 22+. Устанавливать пакеты не нужно.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/nodejs/node-query-card` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/nodejs/node-query-card
```

Выполните в этой папке:

```sh
node main.mjs 'tag=go&tag=rust&q=hello+world'
```

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

В JSON у `tag` будут значения `go` и `rust`, а `q` станет строкой `hello world`.

## Как устроено

`main.mjs` использует `URLSearchParams` и группирует значения.
