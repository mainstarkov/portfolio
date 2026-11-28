# SRT Shift

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=py-srt-shift)**

Сдвигает границы субтитров SRT на нужное число миллисекунд. Подходит, когда субтитры запаздывают или появляются слишком рано.

[Открыть демо](https://mainstarkov.github.io/portfolio/py-srt-shift/)

## Возможности

- Принимает положительное или отрицательное смещение.
- Ограничивает отрицательные временные метки нулём.
- Выводит новые субтитры в терминал, сохраняя текст реплик.

## Скачать и запустить

**Требования.** Python 3.10+. Внешние пакеты не требуются.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/python/py-srt-shift` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/python/py-srt-shift
```

Выполните в этой папке:

```sh
python3 main.py example.srt 1500
```

В Windows PowerShell замените `python3` на `py -3`, если используете стандартный установщик Python.

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

Первая метка станет `00:00:02,500`. Чтобы сохранить результат отдельно, добавьте `> shifted.srt`.

## Как устроено

`main.py` преобразует таймкоды, `example.srt` содержит тестовые субтитры.
