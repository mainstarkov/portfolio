# Focus Pick

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=py-focus-pick)**

Выбирает задачу, которая укладывается в заданный бюджет времени и имеет высокий приоритет относительно длительности.

[Открыть демо](https://mainstarkov.github.io/portfolio/py-focus-pick/)

## Возможности

- Принимает CSV с полями `task`, `minutes`, `impact`.
- Учитывает только задачи, которые помещаются в заданное время.
- Сравнивает важность с длительностью и сообщает, если подходящих задач нет.

## Скачать и запустить

**Требования.** Python 3.10+. Внешние пакеты не требуются.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/python/py-focus-pick` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/python/py-focus-pick
```

Выполните в этой папке:

```sh
python3 main.py example.csv --minutes 30
```

В Windows PowerShell замените `python3` на `py -3`, если используете стандартный установщик Python.

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

На примере будет предложено `Reply to feedback`. Чтобы попробовать другой бюджет, измените значение `--minutes`.

## Как устроено

`main.py` читает таблицу и выбирает задачу. `example.csv` содержит готовый список.
