# Приём событий

HTTP API с журналом последних 100 событий и защитой от повторной записи одного события.

[Открыть пример в браузере](https://mainstarkov.github.io/portfolio-projects/go-event-inbox/).

## Запуск

Требуется Go 1.22 или новее. Сервис слушает http://127.0.0.1:8084. Данные хранятся в памяти до остановки процесса.

```sh
go run .
```

## Проверка

Во втором терминале:

```sh
curl -i -X POST http://127.0.0.1:8084/events -H 'Content-Type: application/json' -d '{"id":"demo-1","type":"order.created"}'
curl -i http://127.0.0.1:8084/events
```

```text
Первый POST → 201 Created
Повтор с тем же типом → 200 OK
Тот же ID с другим типом → 409 Conflict
GET /events → 200 OK, JSON-массив записей
```

Хранит 100 последних событий. Повторный ID защищён от повторной записи, пока присутствует в журнале. GET /healthz возвращает ok.
