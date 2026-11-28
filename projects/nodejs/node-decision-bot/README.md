# Decision Bot

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=node-decision-bot)**

Случайно выбирает один вариант из нескольких. Подходит для быстрых решений, когда каждый вариант равнозначен.

[Открыть демо](https://mainstarkov.github.io/portfolio/node-decision-bot/)

## Возможности

- Удаляет дубликаты и пустые значения.
- Принимает варианты с пробелами в кавычках.
- Выводит один выбор через генератор случайных чисел Node.js.

## Скачать и запустить

**Требования.** Node.js 22+. Устанавливать пакеты не нужно.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/nodejs/node-decision-bot` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/nodejs/node-decision-bot
```

Выполните в этой папке:

```sh
node main.mjs "Чай" "Кофе" "Какао"
```

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

Увидите одно из трёх названий. Передайте минимум два разных значения.

## Как устроено

`main.mjs` обрабатывает аргументы и печатает выбор.
