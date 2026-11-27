# RSS Digest

Выводит заголовки и ссылки из локального RSS или Atom в читаемом виде.

[Открыть демо](https://mainstarkov.github.io/portfolio/py-rss-digest/)

## Возможности

- Читает XML с диска.
- Поддерживает элементы RSS и Atom.
- Позволяет ограничить число записей через `--limit`.

## Скачать и запустить

**Требования.** Python 3.10+. Внешние пакеты не требуются.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/python/py-rss-digest` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/python/py-rss-digest
```

Выполните в этой папке:

```sh
python3 main.py example.xml --limit 5
```

В Windows PowerShell замените `python3` на `py -3`, если используете стандартный установщик Python.

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

Пример покажет `First release` и его ссылку. Передайте свой предварительно сохранённый файл ленты для других данных.

## Как устроено

`main.py` разбирает XML, `example.xml` содержит пример RSS.
