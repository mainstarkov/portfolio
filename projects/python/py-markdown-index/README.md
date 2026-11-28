# Markdown Index

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=py-markdown-index)**

Строит оглавление для папки с Markdown-заметками. Его можно сохранить в отдельный файл рядом с заметками.

[Открыть демо](https://mainstarkov.github.io/portfolio/py-markdown-index/)

## Возможности

- Ищет Markdown-файлы во вложенных папках.
- Берёт заголовок первого уровня или имя файла, если заголовка нет.
- Печатает относительные ссылки при запуске с относительным путём.

## Скачать и запустить

**Требования.** Python 3.10+. Внешние пакеты не требуются.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/python/py-markdown-index` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/python/py-markdown-index
```

Выполните в этой папке:

```sh
python3 main.py notes
```

В Windows PowerShell замените `python3` на `py -3`, если используете стандартный установщик Python.

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

В выводе появится ссылка на «Первую заметку». Добавьте `> index.md`, чтобы сохранить оглавление рядом с папкой `notes`.

## Как устроено

`main.py` строит каталог. `notes/` содержит тестовую заметку.
