# Очередь задач

**[Попробовать демо](https://mainstarkov.github.io/portfolio/play/?project=go-job-queue)**

HTTP API с фоновой очередью. Воркер вычисляет SHA-256 и сохраняет результат для запроса статуса.

[Открыть пример в браузере](https://mainstarkov.github.io/portfolio/go-job-queue/).

## Откуда скачать

Клонируйте Portfolio или распакуйте его [ZIP-архив](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip). Откройте папку `projects/go/go-job-queue` внутри репозитория.

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/go/go-job-queue
```

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

Используйте ID из ответа на POST. Если задача ещё в статусе `queued`, повторите GET. Для PowerShell можно выполнить:

```powershell
$base = 'http://127.0.0.1:8083'
$job = Invoke-RestMethod -Method Post -Uri "$base/jobs" -ContentType 'application/json' -Body '{"text":"hello"}'
Invoke-RestMethod "$base/jobs/$($job.id)"
```

Очередь ограничена 32 ожидающими задачами. Хранятся до 128 последних результатов. GET /healthz возвращает ok.

## Как устроено

`main.go` регистрирует `POST /jobs`, `GET /jobs/{id}` и `GET /healthz`. Буферизованный канал передаёт текст фоновому воркеру, мьютекс защищает результаты.
