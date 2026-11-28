# Бронирование комнат

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=go-room-booking)**

Бронирует комнату на интервал и отклоняет пересекающиеся заявки.

[Инструкция на GitHub Pages](https://mainstarkov.github.io/portfolio/go-room-booking/) · [Скачать ZIP](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip)

## Скачать и запустить

Нужен Go 1.22+. Команды работают в терминале macOS и Linux и в PowerShell Windows.

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/go/go-room-booking
go version
go run .
```

Для ZIP распакуйте архив, откройте терминал в папке `portfolio-main/projects/go/go-room-booking` и выполните `go run .`.

## Проверить работу

Оставьте сервер на `http://127.0.0.1:8085` и откройте второй терминал.

### macOS и Linux

```sh
curl -i http://127.0.0.1:8085/bookings -H 'Content-Type: application/json' --data '{"room":"Atlas","start":"2026-12-01T10:00:00Z","end":"2026-12-01T11:00:00Z"}'
curl -sS http://127.0.0.1:8085/bookings
```

### Windows PowerShell

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8085/bookings' -ContentType 'application/json' -Body '{"room":"Atlas","start":"2026-12-01T10:00:00Z","end":"2026-12-01T11:00:00Z"}'
Invoke-RestMethod -Uri 'http://127.0.0.1:8085/bookings'
```

Поля start и end принимают RFC 3339. Соседние интервалы допустимы. Повторное бронирование пересекающегося интервала возвращает 409.

`GET /healthz` возвращает `ok`. Данные находятся в памяти и очищаются при остановке. Сервер слушает только локальный адрес.
