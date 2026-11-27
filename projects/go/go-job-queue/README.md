# Очередь задач

HTTP API с фоновой очередью. Воркер вычисляет SHA-256 и сохраняет результат для запроса статуса.

[Открыть пример в браузере](https://mainstarkov.github.io/portfolio/go-job-queue/).

## Запуск

Требуется Go 1.22 или новее. Сервис слушает http://127.0.0.1:8083. Данные хранятся в памяти до остановки процесса.

```sh
go run .
```

## Проверка

Во втором терминале:

```sh
curl -i -X POST http://127.0.0.1:8083/jobs -H 'Content-Type: application/json' -d '{"text":"hello"}'
curl -i http://127.0.0.1:8083/jobs/1
```

```text
202 Accepted
{"id":1,"status":"queued"}

200 OK
{"id":1,"status":"done","sha256":"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"}
```

Очередь ограничена 32 ожидающими задачами. Хранятся до 128 последних результатов. GET /healthz возвращает ok.
