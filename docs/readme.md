# UniMap - інструкція запуску

Репозиторій містить:

- `apps/server` - backend API (.NET)
- `apps/admin-web` - адмін-панель (React + Vite)
- `apps/mobile-app` - мобільний застосунок (Expo / React Native)

Основна частина системи запускається через Docker Compose: API, адмін-панель, PostgreSQL і Redis.

---

## 1) Що потрібно встановити

### Для запуску API та адмін-панелі

- Docker Desktop

### Для запуску мобільного застосунку

- Node.js LTS
- Expo Go на телефоні, або Android Studio / Xcode для емулятора

---

## 2) Запуск через Docker Compose

Виконайте з кореня репозиторію:

```bash
cd apps
docker compose up --build
```

Після запуску будуть доступні:

- API: `http://localhost:5286`
- Swagger: `http://localhost:5286/swagger`
- Адмін-панель: `http://localhost:5173`

Compose піднімає сервіси:

- `server` - backend API
- `admin-panel` - веб-адмінка
- `postgres` - база даних PostgreSQL
- `redis` - кеш Redis

Міграції бази даних застосовуються сервером під час старту, окремо запускати `dotnet ef database update` не потрібно.

---

## 3) Зупинка

Зупинити сервіси:

```bash
cd apps
docker compose down
```

Зупинити сервіси і видалити дані PostgreSQL, Redis та завантажені зображення:

```bash
cd apps
docker compose down -v
```

Використовуйте `down -v` тільки якщо потрібно повністю очистити локальні дані.

---

## 4) Debug-запуск

Для debug-конфігурації використовуйте окремий compose-файл:

```bash
cd apps
docker compose -f compose.debug.yaml up --build
```

У debug-режимі додатково відкриваються порти:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Це зручно, якщо потрібно підключитися до бази або Redis з локальних інструментів.

---

## 5) Мобільний застосунок

Мобільний застосунок запускається окремо, тому що він не входить до Docker Compose.

### Налаштувати адресу API

Файл налаштувань: `apps/mobile-app/.env`

Якщо застосунок запускається на телефоні або емуляторі, не використовуйте `localhost`. Потрібен IP вашого комп'ютера у локальній мережі.

Приклад:

```env
EXPO_PUBLIC_UNIMAP_SERVER_API_LINK=http://192.168.0.107:5286/api
EXPO_PUBLIC_UNIMAP_SERVER_DEV_HOST=192.168.0.107
```

Як дізнатися IP:

- macOS: `System Settings -> Network`
- Windows: `ipconfig`

### Запустити Expo

В окремому терміналі:

```bash
cd apps/mobile-app
npm install
npm run start
```

Далі відкрийте Expo Go на телефоні і відскануйте QR-код з термінала.

Якщо після зміни `.env` застосунок не підхопив нові значення:

```bash
cd apps/mobile-app
npx expo start -c
```

---

## 6) Часті проблеми

### Порт зайнятий

Перевірте, чи не зайняті порти:

- `5286` - API
- `5173` - адмін-панель
- `5432` - PostgreSQL у debug-режимі
- `6379` - Redis у debug-режимі

Зупиніть процес, який використовує потрібний порт, або змініть порт у compose-файлі.

### API не стартує через базу даних

Перевірте стан контейнерів:

```bash
cd apps
docker compose ps
```

Подивитися логи сервера:

```bash
cd apps
docker compose logs server
```

Повністю перестворити контейнери без видалення даних:

```bash
cd apps
docker compose up --build --force-recreate
```

### Мобільний застосунок не бачить API

- У `apps/mobile-app/.env` має бути IP комп'ютера, а не `localhost`.
- Телефон і комп'ютер мають бути в одній Wi-Fi мережі.
- API має відкриватися з телефону за адресою `http://<IP>:5286/swagger`.

---

## 7) Ключі зовнішніх API

Для Docker-запуску ключ MapTiler задається в `apps/compose.yaml` через змінну:

```yaml
ExternalApis__MapTiler__ApiKey: "..."
```

За потреби змініть її у `apps/compose.yaml` або `apps/compose.debug.yaml`.
