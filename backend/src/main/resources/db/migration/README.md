# Database Migrations

Этот проект использует Flyway для управления миграциями базы данных.

## Структура миграций

Миграции находятся в директории `src/main/resources/db/migration/` и следуют соглашению об именовании Flyway:

```
V{version}__{description}.sql
```

Где:
- `V` - префикс для версионных миграций
- `{version}` - номер версии (например, 1, 2, 3 или 1.1, 1.2)
- `__` - два подчеркивания (разделитель)
- `{description}` - описание миграции (используйте snake_case)

## Существующие миграции

- **V1__Initial_schema.sql** - Базовая миграция (пустая, так как схема уже существовала)
- **V2__Add_is_deleted_by_customer_to_orders.sql** - Добавление поля для мягкого удаления заказов

## Как создать новую миграцию

1. Создайте новый SQL файл в этой директории
2. Используйте следующий номер версии (например, V3, V4 и т.д.)
3. Дайте описательное имя миграции
4. Напишите SQL команды для изменения схемы

Пример:
```sql
-- V3__Add_user_avatar_field.sql
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
```

## Важные замечания

- Миграции выполняются автоматически при запуске приложения
- Никогда не изменяйте уже выполненные миграции
- Flyway отслеживает выполненные миграции в таблице `flyway_schema_history`
- Если миграция не удалась, исправьте ошибку и перезапустите приложение

## Настройки Flyway

Настройки находятся в `application.properties`:

```properties
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-version=0
```

## Полезные команды

Проверить статус миграций:
```bash
mvn flyway:info
```

Выполнить миграции вручную:
```bash
mvn flyway:migrate
```

Откатить последнюю миграцию (требует Flyway Teams):
```bash
mvn flyway:undo
```
