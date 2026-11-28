# Dev Port

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=node-dev-port)**

Проверяет, принимает ли локальное приложение TCP-соединения на заданном порту.

[Открыть демо](https://mainstarkov.github.io/portfolio/node-dev-port/)

## Возможности

- Проверяет только адрес `127.0.0.1`.
- Принимает номер порта от 1 до 65535.
- Сообщает об ошибке или тайм-ауте и возвращает код 1.

## Скачать и запустить

**Требования.** Node.js 22+. Устанавливать пакеты не нужно.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/nodejs/node-dev-port` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/nodejs/node-dev-port
```

Выполните в этой папке:

```sh
node main.mjs 3000
```

Собственный HTTP-сервер отсутствует. Порт передаётся в аргументе.

## Проверить работу

Запустите проект «Кофе по весам» на порту 3000 и повторите команду. Для открытого порта появится `is listening`.

## Как устроено

`main.mjs` проверяет подключение через встроенный модуль Node.js.
