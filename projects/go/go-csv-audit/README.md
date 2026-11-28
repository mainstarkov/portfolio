# Проверка CSV

Проверяет заголовки CSV и показывает номера записей с неверным числом колонок.

[Попробовать в браузере](https://mainstarkov.github.io/portfolio/play/?project=go-csv-audit) · [Инструкция по запуску](https://mainstarkov.github.io/portfolio/go-csv-audit/)

## Скачать и запустить

Установите Go 1.22+. В macOS, Windows PowerShell или Linux выполните:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/go/go-csv-audit
go version
go run .
```

Для [ZIP-архива](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) откройте распакованную папку `portfolio-main/projects/go/go-csv-audit` и выполните `go run .`.

## Проверить API

Сервер слушает `http://127.0.0.1:8089`. Оставьте его запущенным и откройте второй терминал.

macOS и Linux:

```sh
curl -i 'http://127.0.0.1:8089/audit' -H 'Content-Type: application/json' --data '{"csv":"name,city\nAda,London\nGrace\nLinus,Helsinki,extra","required":["name","city"]}'
```

Windows PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8089/audit' -ContentType 'application/json' -Body '{"csv":"name,city\nAda,London\nGrace\nLinus,Helsinki,extra","required":["name","city"]}'
```

Ожидаемый JSON:

```json
{"valid":false,"rows":3,"missing":[],"wrong_width":[3,4]}
```

Поле csv содержит текст таблицы, required — список обязательных заголовков. Нумерация записей начинается с заголовка.

`GET /healthz` возвращает `ok`. Запросы обрабатываются локально и не сохраняются.
