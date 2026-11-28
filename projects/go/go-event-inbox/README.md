# Go Event Inbox

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=go-event-inbox)**

HTTP API с журналом последних 100 событий и защитой от повторной записи одного события.

[Инструкция на GitHub Pages](https://mainstarkov.github.io/portfolio/go-event-inbox/) · [Скачать исходники ZIP](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip)

## Что установить

Нужен [Go 1.22 или новее](https://go.dev/doc/install). Откройте новый терминал после установки и выполните `go version`. Git нужен для клонирования. С ZIP-архивом достаточно распаковать его и открыть папку `portfolio-main/projects/go/go-event-inbox`.

Сервер слушает `http://127.0.0.1:8084` на вашем компьютере. В первом терминале оставьте его запущенным. Для остановки нажмите Ctrl+C. Данные хранятся в памяти и сбрасываются при остановке.

## macOS и Linux

В терминале:

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/go/go-event-inbox
go run .
```

Во втором терминале:

```sh
curl -sS http://127.0.0.1:8084/healthz
curl -i http://127.0.0.1:8084/events \
  -H 'Content-Type: application/json' \
  -d '{"id":"demo-1","type":"order.created"}'
curl -sS http://127.0.0.1:8084/events
```

## Windows

В PowerShell:

```powershell
git clone https://github.com/mainstarkov/portfolio.git
Set-Location .\portfolio\projects\go\go-event-inbox
go run .
```

Во втором окне PowerShell:

```powershell
$base = 'http://127.0.0.1:8084'
Invoke-RestMethod "$base/healthz"
$event = @{ id = 'demo-1'; type = 'order.created' } | ConvertTo-Json -Compress
(Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$base/events" -ContentType 'application/json' -Body $event).StatusCode
(Invoke-WebRequest -UseBasicParsing -Uri "$base/events").Content
```

## Ожидаемый результат

| Запрос | Ответ |
| --- | --- |
| `GET /healthz` | `ok` |
| Первый `POST /events` с новым ID | `201 Created` |
| Повтор с тем же ID и типом | `200 OK`, запись остаётся одна |
| Повтор с тем же ID и другим типом | `409 Conflict` |
| `GET /events` | `200 OK`, JSON-массив записей |

Защита от повторов действует, пока событие присутствует в журнале из последних 100 записей.

## Как устроено

`main.go` содержит обработчики `/events` и `/healthz`, ограничение размера JSON и журнал в памяти под мьютексом. `go.mod` задаёт версию Go.
