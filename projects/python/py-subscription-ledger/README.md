# Subscription Ledger

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=py-subscription-ledger)**

Подсчитывает годовую стоимость регулярных подписок и средний месячный расход.

[Открыть демо](https://mainstarkov.github.io/portfolio/py-subscription-ledger/)

## Возможности

- Читает название, сумму и период из CSV.
- Умножает месячные платежи на 12 и прибавляет годовые.
- Выполняет расчёты через `Decimal`. Все строки должны быть в одной валюте.

## Скачать и запустить

**Требования.** Python 3.10+. Внешние пакеты не требуются.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/python/py-subscription-ledger` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/python/py-subscription-ledger
```

Выполните в этой папке:

```sh
python3 main.py example.csv
```

В Windows PowerShell замените `python3` на `py -3`, если используете стандартный установщик Python.

Команды выполняются в терминале. Проект не запускает HTTP-сервер.

## Проверить работу

В примере общий расход составляет `180.00/year (15.00/month)`.

## Как устроено

`main.py` выполняет сводку. `example.csv` показывает формат строки подписки.
