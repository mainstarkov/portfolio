# Складской учёт

Принимает поступления и списания товара и защищает остаток от ухода в минус.

[Инструкция на GitHub Pages](https://mainstarkov.github.io/portfolio/go-stock-counter/) · [Скачать ZIP](https://github.com/mainstarkov/portfolio/archive/refs/heads/main.zip)

## Скачать и запустить

Нужен Go 1.22+. Команды работают в терминале macOS и Linux и в PowerShell Windows.

```sh
git clone https://github.com/mainstarkov/portfolio.git
cd portfolio/projects/go/go-stock-counter
go version
go run .
```

Для ZIP распакуйте архив, откройте терминал в папке `portfolio-main/projects/go/go-stock-counter` и выполните `go run .`.

## Проверить работу

Оставьте сервер на `http://127.0.0.1:8086` и откройте второй терминал.

### macOS и Linux

```sh
curl -i http://127.0.0.1:8086/movements -H 'Content-Type: application/json' --data '{"sku":"coffee","delta":12}'
curl -sS http://127.0.0.1:8086/stock
```

### Windows PowerShell

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8086/movements' -ContentType 'application/json' -Body '{"sku":"coffee","delta":12}'
Invoke-RestMethod -Uri 'http://127.0.0.1:8086/stock'
```

Положительное delta пополняет остаток. Отрицательное списывает. Например, после поступления 12 единиц списание 5 оставит 7, а попытка списать 8 вернёт 409.

`GET /healthz` возвращает `ok`. Данные находятся в памяти и очищаются при остановке. Сервер слушает только локальный адрес.
