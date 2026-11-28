# Объединение интервалов

Сортирует интервалы и объединяет пересечения и соседние отрезки.

[Попробовать в браузере](https://mainstarkov.github.io/portfolio/play/?project=go-slot-merge) · [Инструкция по запуску](https://mainstarkov.github.io/portfolio/go-slot-merge/)

## Скачать и запустить

Установите Go 1.22+. В macOS, Windows PowerShell или Linux выполните:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/go/go-slot-merge
go version
go run .
```

Для [ZIP-архива](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip) откройте распакованную папку `portfolio-main/projects/go/go-slot-merge` и выполните `go run .`.

## Проверить API

Сервер слушает `http://127.0.0.1:8088`. Оставьте его запущенным и откройте второй терминал.

macOS и Linux:

```sh
curl -i 'http://127.0.0.1:8088/merge' -H 'Content-Type: application/json' --data '[[1,3],[2,5],[8,10],[10,11]]'
```

Windows PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8088/merge' -ContentType 'application/json' -Body '[[1,3],[2,5],[8,10],[10,11]]'
```

Ожидаемый JSON:

```json
[[1,5],[8,11]]
```

Массив пар целых чисел. Начало каждой пары должно быть меньше конца.

`GET /healthz` возвращает `ok`. Запросы обрабатываются локально и не сохраняются.
