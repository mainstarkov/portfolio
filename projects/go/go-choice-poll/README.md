# Голосование

Принимает один голос от участника и показывает результаты по вариантам.

[Инструкция на GitHub Pages](https://mainstarkov.github.io/portfolio/go-choice-poll/) · [Скачать ZIP](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip)

## Скачать и запустить

Нужен Go 1.22+. Команды работают в терминале macOS и Linux и в PowerShell Windows.

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/go/go-choice-poll
go version
go run .
```

Для ZIP распакуйте архив, откройте терминал в папке `portfolio-main/projects/go/go-choice-poll` и выполните `go run .`.

## Проверить работу

Оставьте сервер на `http://127.0.0.1:8087` и откройте второй терминал.

### macOS и Linux

```sh
curl -i http://127.0.0.1:8087/votes -H 'Content-Type: application/json' --data '{"voter":"demo-1","option":"Go"}'
curl -sS http://127.0.0.1:8087/results
```

### Windows PowerShell

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8087/votes' -ContentType 'application/json' -Body '{"voter":"demo-1","option":"Go"}'
Invoke-RestMethod -Uri 'http://127.0.0.1:8087/results'
```

Допустимые варианты: Go, Python и Rust. Повтор от того же voter возвращает 409. Идентификатор учебный, без авторизации участника.

`GET /healthz` возвращает `ok`. Данные находятся в памяти и очищаются при остановке. Сервер слушает только локальный адрес.
