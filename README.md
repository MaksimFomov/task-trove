# TaskTrove - Платформа для управления задачами и проектами

## Описание

TaskTrove - это веб-платформа для связи заказчиков и исполнителей различных задач и проектов. Система разработана в рамках дипломной работы и демонстрирует современные подходы к созданию полнофункциональных веб-приложений.

### Основные возможности

- **Многоязычность**: Поддержка 9 языков интерфейса
- **Ролевая система**: Заказчики, исполнители, администраторы и супер-администраторы
- **Система чатов**: Обмен сообщениями в реальном времени
- **Административная панель**: Управление пользователями и контентом
- **Безопасность**: JWT аутентификация и авторизация
- **Адаптивный дизайн**: Поддержка всех типов устройств

## Технологии

### Frontend
- React 18 с TypeScript
- Vite для разработки и сборки
- TailwindCSS для стилизации
- Zustand для управления состоянием
- React Query для работы с API
- React Router для навигации
- i18next для интернационализации
- WebSocket для real-time коммуникации

### Backend
- Spring Boot 3.5.6 с Java 21
- Spring Security для аутентификации
- Spring Data JPA для работы с базой данных
- Spring WebSocket для real-time коммуникации
- JWT для токенов доступа
- MapStruct для маппинга объектов
- Flyway для миграций базы данных
- Spring Mail для отправки email

### База данных
- MySQL 8.0
- Flyway для версионирования схемы

## Установка и запуск

### Требования

- Docker и Docker Compose
- Java 21 (для локальной разработки)
- Node.js 18+ (для локальной разработки)
- MySQL 8.0 (для локальной разработки)

### Запуск с Docker

1. Клонируйте репозиторий:
   ```bash
   git clone <repository-url>
   cd tasktrove
   ```

2. Запустите все сервисы:
   ```bash
   docker-compose up -d
   ```

3. Приложение будет доступно по адресам:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - MySQL: localhost:3306

### Локальная разработка

#### Backend

1. Настройте базу данных MySQL:
   ```sql
   CREATE DATABASE tasktrove;
   CREATE USER 'tasktrove'@'localhost' IDENTIFIED BY 'tasktrove';
   GRANT ALL PRIVILEGES ON tasktrove.* TO 'tasktrove'@'localhost';
   ```

2. Запустите backend:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

#### Frontend

1. Установите зависимости и запустите:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Откройте http://localhost:5173

## Роли пользователей

### Заказчик
- Создание и управление заказами
- Просмотр откликов исполнителей
- Выбор и утверждение исполнителей
- Общение через чат
- Оставление отзывов
- Управление портфолио

### Исполнитель
- Просмотр доступных заказов
- Подача откликов на заказы
- Управление профилем и портфолио
- Общение с заказчиками
- Уведомления о готовности работ
- Просмотр рейтинга и отзывов

### Администратор
- Модерация заказов и пользователей
- Управление контентом
- Просмотр статистики
- Активация/деактивация профилей
- Удаление неподходящего контента

### Супер-администратор
- Все права администратора
- Создание новых администраторов
- Полный доступ к системе

## Поддерживаемые языки

- Русский - основной язык
- English - английский
- Українська - украинский
- Беларуская - белорусский
- Қазақ - казахский
- Հայերեն - армянский
- Azərbaycan - азербайджанский
- ქართული - грузинский
- O'zbek - узбекский

## Основные функции

### Управление заказами
- Создание заказов с детальным описанием
- Категоризация по областям деятельности
- Система откликов и предложений
- Статусы заказов (активный, в работе, выполнен)
- Модерация администраторами

### Система коммуникации
- Real-time чаты между участниками
- Уведомления о новых сообщениях
- История переписки

### Профили и портфолио
- Детальные профили пользователей
- Портфолио с примерами работ
- Система рейтингов и отзывов
- Специализации и навыки

### Административная панель
- Управление пользователями
- Модерация контента
- Статистика и аналитика
- Системные настройки

## Конфигурация

### Переменные окружения Backend

```env
# База данных
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/tasktrove
SPRING_DATASOURCE_USERNAME=tasktrove
SPRING_DATASOURCE_PASSWORD=tasktrove

# JWT
APP_JWT_SECRET=your_jwt_secret_key_must_be_at_least_32_characters_long
APP_JWT_EXPIRATION_MINUTES=60

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Email
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=465
SPRING_MAIL_USERNAME=your_email@gmail.com
SPRING_MAIL_PASSWORD=your_app_password
```

## Структура проекта

```
tasktrove/
├── backend/                   # Spring Boot приложение
│   ├── src/main/java/         # Java исходники
│   ├── src/main/resources/    # Ресурсы и конфигурация
│   ├── pom.xml               # Maven конфигурация
│   └── Dockerfile            # Docker образ backend
├── frontend/                 # React приложение
│   ├── src/                  # TypeScript исходники
│   ├── public/               # Статические файлы
│   ├── package.json          # NPM зависимости
│   └── Dockerfile            # Docker образ frontend
├── diagrams/                 # UML диаграммы
│   ├── CLASS_DIAGRAM.puml    # Диаграмма классов
│   └── USE_CASE_DIAGRAM.puml # Диаграмма use case
├── docker-compose.yml       # Docker Compose конфигурация
└── README.md                # Документация проекта
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/refresh` - Обновление токена

### Заказы
- `GET /api/orders` - Список заказов
- `POST /api/orders` - Создание заказа
- `GET /api/orders/{id}` - Детали заказа
- `PUT /api/orders/{id}` - Обновление заказа
- `DELETE /api/orders/{id}` - Удаление заказа

### Пользователи
- `GET /api/users/profile` - Профиль пользователя
- `PUT /api/users/profile` - Обновление профиля
- `GET /api/users/{id}` - Публичный профиль

### Чаты
- `GET /api/chats` - Список чатов
- `GET /api/chats/{id}/messages` - Сообщения чата
- `POST /api/chats/{id}/messages` - Отправка сообщения

## Тестирование

### Backend тесты
```bash
cd backend
./mvnw test
```

### Frontend тесты
```bash
cd frontend
npm test
```

## Мониторинг

### Просмотр логов Docker
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Health checks
- Backend: http://localhost:8080/actuator/health
- Frontend: http://localhost:3000