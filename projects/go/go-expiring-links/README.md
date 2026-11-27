# Ссылки с TTL

HTTP API для временных ссылок. Создаёт случайный идентификатор и перенаправляет до истечения срока.

[Открыть пример в браузере](https://mainstarkov.github.io/portfolio-projects/go-expiring-links/).

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

Хранит до 1000 активных ссылок. GET /healthz возвращает ok.
