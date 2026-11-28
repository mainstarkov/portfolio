# Study Telegram

**[Открыть чат бота](https://mainstarkov.github.io/telegram-preview/?demo=study)**

Telegram-бот для повторения учебных карточек. Его можно попробовать в терминале без подключения к Telegram.

[Открыть демо](https://mainstarkov.github.io/portfolio/py-study-telegram/)

## Возможности

- Команда `/card` выбирает случайный вопрос.
- Команда `/answer` показывает ответ на последнюю карточку в этом чате.
- Набор карточек хранится в JSON. Активная карточка сбрасывается при перезапуске.

## Скачать и запустить

**Требования.** Python 3.10+. Внешние пакеты не требуются. Для реального Telegram нужен токен BotFather.

Скачайте [ZIP исходников](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) и откройте папку `portfolio-main/projects/python/py-study-telegram` **или** клонируйте репозиторий:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/python/py-study-telegram
```

Выполните в этой папке:

```sh
python3 main.py --demo
```

В Windows PowerShell замените `python3` на `py -3`, если используете стандартный установщик Python.

Для запуска с токеном в macOS/Linux используйте `export TELEGRAM_BOT_TOKEN="ваш_токен"`. В PowerShell задайте `$env:TELEGRAM_BOT_TOKEN = "ваш_токен"`.

Бот делает исходящие запросы в Telegram. Входящий HTTP-порт не нужен.

## Проверить работу

Демо покажет вопрос о столице Японии и ответ. Для запуска в Telegram задайте `TELEGRAM_BOT_TOKEN` в окружении и выполните `python3 main.py`.

## Как устроено

`main.py` обслуживает команды, `cards.json` содержит вопросы и ответы.
