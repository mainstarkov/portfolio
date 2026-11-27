# Ссылки с TTL

HTTP API для временных ссылок. Создаёт случайный идентификатор и перенаправляет до истечения срока.

[Открыть пример в браузере](https://mainstarkov.github.io/portfolio/go-expiring-links/).

## Откуда скачать

Клонируйте Portfolio или распакуйте его [ZIP-архив](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip). Откройте папку `projects/go/go-expiring-links` внутри репозитория.

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/go/go-expiring-links
```

## Запуск

Требуется Go 1.22 или новее. Сервис слушает http://127.0.0.1:8081. Данные хранятся в памяти до остановки процесса.

```sh
go run .
```

## Проверка

Во втором терминале:

```sh
curl -i -X POST http://127.0.0.1:8081/links -H 'Content-Type: application/json' -d '{"url":"https://example.org","ttl":60}'
```

```text
201 Created
{"path":"/r/0123456789abcdef01234567"}

GET /r/{id} → 302 Found, после истечения → 404 Not Found
```

Подставьте `path` из ответа после `http://127.0.0.1:8081` и откройте адрес в браузере раньше, чем истечёт TTL. В PowerShell можно выполнить:

```powershell
$base = 'http://127.0.0.1:8081'
$link = Invoke-RestMethod -Method Post -Uri "$base/links" -ContentType 'application/json' -Body '{"url":"https://example.org","ttl":60}'
"$base$($link.path)"
```

Хранит до 1000 активных ссылок. GET /healthz возвращает ok.

## Как устроено

`main.go` проверяет адрес и TTL, создаёт случайный ID и регистрирует маршруты `POST /links`, `GET /r/{id}` и `GET /healthz`. Истёкшая ссылка перестаёт перенаправлять.
