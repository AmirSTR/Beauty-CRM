# Моя CRM

Простая CRM для бьюти-мастера: записи, клиенты, услуги и оплаты.

## Что внутри

- Вход и регистрация
- Клиенты и карточка клиента
- Записи на день, неделю и месяц
- Услуги с ценой и длительностью
- Оплаты и долги
- Напоминания клиентам
- Настройки профиля мастера

## Локальный запуск

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

На Windows вместо `cp`:

```powershell
Copy-Item .env.example .env
```

## Переменные окружения

```env
DATABASE_URL="postgresql://user:password@localhost:5432/beauty_crm"
AUTH_SECRET="change-me"
```

`AUTH_SECRET` нужен для session cookie. В продакшене используйте длинную случайную строку.

## База данных

Создать таблицы локально:

```bash
npx prisma migrate dev
```

Заполнить начальными данными:

```bash
npm run seed
```

Seed создает пример мастера, клиентов, услуг, записей, оплат, заметок, напоминаний и шаблонов сообщений.

## Railway

Проект подготовлен для Railway через `railway.json`.

1. Создайте новый Railway Project и подключите GitHub repo `AmirSTR/Beauty-CRM`.
2. Добавьте PostgreSQL: `+ New` -> `Database` -> `PostgreSQL`.
3. В Variables веб-сервиса задайте `DATABASE_URL` как reference на PostgreSQL service, например `${{Postgres.DATABASE_URL}}`.
4. Добавьте `AUTH_SECRET` со случайной длинной строкой.
5. Railway возьмет команды из `railway.json`:
   - build: `npm run build`
   - pre-deploy: `npm run db:deploy`
   - start: `npm run start`

Важно: `DATABASE_URL` на Railway не должен ссылаться на `localhost:5432`; он должен вести на Railway PostgreSQL service.