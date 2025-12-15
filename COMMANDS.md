# Команды для запуска TaskTrove

## Быстрый запуск

### Вариант 1: Использование скриптов (рекомендуется)

```bash
# Запуск
./start.sh

# Остановка
./stop.sh
```

### Вариант 2: Ручной запуск

#### Запуск бэкенда

```bash
cd backend
mvn spring-boot:run
```

Или с использованием Maven wrapper (если настроен):
```bash
cd backend
./mvnw spring-boot:run
```

**Backend будет доступен на:** http://localhost:8080

#### Запуск фронтенда

В новом терминале:
```bash
cd frontend
npm run dev
```

**Frontend будет доступен на:** http://localhost:5173

#### Остановка

Нажмите `Ctrl+C` в каждом терминале, или используйте:

```bash
# Остановка по портам
lsof -ti:8080 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Или остановка по процессам
pkill -f "spring-boot:run"
pkill -f "vite"
```

## Запуск в фоновом режиме

### Backend
```bash
cd backend
./mvnw spring-boot:run > ../backend.log 2>&1 &
```

### Frontend
```bash
cd frontend
npm run dev > ../frontend.log 2>&1 &
```

## Проверка статуса

```bash
# Проверка портов
lsof -i:8080  # Backend
lsof -i:5173  # Frontend

# Проверка процессов
ps aux | grep "spring-boot:run"
ps aux | grep "vite"
```

## Требования

- **Java 21+** (для бэкенда)
- **Node.js 18+** (для фронтенда)
- **MySQL 8.0+** (должна быть запущена)
- **Maven 3.8+** (или используйте ./mvnw)

## Первоначальная настройка

### 1. Установка зависимостей фронтенда
```bash
cd frontend
npm install
```

### 2. Настройка базы данных
Убедитесь, что MySQL запущен и база данных `tasktrove` создана:
```sql
CREATE DATABASE tasktrove CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Настройка application.properties
Проверьте настройки в `backend/src/main/resources/application.properties`:
- URL базы данных
- Имя пользователя и пароль БД
- JWT секрет
- Email настройки

## Полезные команды

### Просмотр логов
```bash
# Backend логи (если запущен в фоне)
tail -f backend.log

# Frontend логи (если запущен в фоне)
tail -f frontend.log
```

### Пересборка проекта

**Backend:**
```bash
cd backend
./mvnw clean package
```

**Frontend:**
```bash
cd frontend
npm run build
```

### Очистка
```bash
# Очистка скомпилированных файлов бэкенда
cd backend
./mvnw clean

# Очистка node_modules фронтенда
cd frontend
rm -rf node_modules
npm install
```

