# Jewelry Salon (Course Work)

Технологии: Node.js, Express, MySQL, Handlebars, HTML/CSS/JS/jQuery, AJAX, Mocha, Chai.

## Запуск

1. Установить зависимости:
   npm install

2. Пересоздать БД и заполнить тестовыми данными:
   npm run db:reset

3. Запустить сервер:
   npm start

4. Открыть в браузере:
   http://localhost:3000

## Тестовые пользователи

- admin@aurum.local / 123456
- manager@aurum.local / 123456
- courier@aurum.local / 123456
- client@aurum.local / 123456

## Структура

- src/config - конфиги
- src/models - работа с БД
- src/services - бизнес-логика (скидки/checkout)
- src/controllers - контроллеры
- src/routes - роуты
- src/views - Handlebars шаблоны
- public - статика
- uploads - загруженные изображения
- sql - SQL-скрипты для БД
- tests - тесты Mocha + Chai
