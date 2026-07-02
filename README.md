# Beauty CRM

MVP веб-приложения для бьюти-мастера: клиенты, услуги, записи, оплаты, напоминания, простая аналитика и блок “Кому написать сегодня” для повторных визитов.

## Стек

- Next.js + React + TypeScript
- Next.js server actions
- PostgreSQL
- Prisma
- Zod
- React Hook Form
- Tailwind CSS
- date-fns
- httpOnly cookie session

## Функции MVP

- Регистрация, вход, выход и protected routes.
- Профиль мастера: контакты, валюта, рабочие дни и время.
- CRUD услуг с архивированием через `isActive`.
- CRUD клиентов с поиском, фильтром, карточкой, заметками и историей.
- Создание, перенос и смена статусов записей.
- Проверка рабочего графика и пересечений записей.
- Оплаты, частичные оплаты, возвраты и пересчет `paymentStatus`.
- Dashboard с записями на сегодня, выручкой, напоминаниями и блоком “Кому написать сегодня”.
- Calendar в режимах день, неделя, месяц.
- Finance и Analytics.
- Шаблоны сообщений.
- Seed-данные для быстрой проверки.

## Установка

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

На Windows вместо `cp` можно выполнить:

```powershell
Copy-Item .env.example .env
```

## Настройка .env

```env
DATABASE_URL="postgresql://user:password@localhost:5432/beauty_crm"
AUTH_SECRET="change-me"
```

`AUTH_SECRET` нужен для подписи session cookie. В локальной разработке замените `change-me` на любую длинную строку.

## Миграции

```bash
npx prisma migrate dev
```

## Seed

```bash
npx prisma db seed
```

Демо-аккаунт:

```text
Email: demo@beautycrm.app
Password: password123
Name: Demo Master
```

Seed создает 1 мастера, 8 клиентов, 6 услуг, 15 записей, оплаты, заметки, напоминания и шаблоны сообщений.

## Dev-сервер

```bash
npm run dev
```

Откройте `http://localhost:3000`.

## Структура проекта

```text
prisma/
  schema.prisma
  seed.ts
src/
  app/
    actions.ts
    (auth)/
    (app)/
  components/
  lib/
```

## Основные бизнес-правила

- Все сущности, кроме `User`, связаны с `userId`.
- Серверные операции всегда берут `userId` из текущей сессии.
- `passwordHash` никогда не возвращается на клиент.
- Нельзя создать запись вне рабочих часов мастера.
- Нельзя создать запись поверх активной записи со статусом `New` или `Confirmed`.
- `endTime` рассчитывается автоматически по длительности услуги.
- Оплаты пересчитывают `appointment.paymentStatus`.
- После завершения записи создается follow-up напоминание через 25 дней.
- Блок “Кому написать сегодня” показывает клиентов, у которых последний завершенный визит был 25+ дней назад и нет будущей активной записи.
## Railway deploy

Проект подготовлен для Railway через `railway.json`.

1. В Railway создайте новый Project и подключите GitHub repo `AmirSTR/Beauty-CRM`.
2. Добавьте сервис PostgreSQL: `+ New` -> `Database` -> `PostgreSQL`.
3. В Variables веб-сервиса удалите `DATABASE_URL`, если он смотрит на `localhost`, и добавьте reference variable `DATABASE_URL` из PostgreSQL-сервиса, например `${{Postgres.DATABASE_URL}}` или выберите его через autocomplete.
4. Добавьте `AUTH_SECRET` со случайной длинной строкой.
5. Railway возьмет команды из `railway.json`:
   - build: `npm run build`
   - pre-deploy: `npm run db:deploy`
   - start: `npm run start`
6. После первого успешного деплоя можно заполнить демо-данные вручную из Railway shell:

```bash
npm run seed
```

Важно: `DATABASE_URL` на Railway не должен содержать `localhost:5432`. Он должен ссылаться на Railway PostgreSQL service. `prisma/migrations` уже содержит initial migration, поэтому таблицы создаются через `prisma migrate deploy` перед запуском приложения.

