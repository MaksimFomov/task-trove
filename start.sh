#!/bin/bash

# Скрипт для запуска бэкенда и фронтенда

echo "🚀 Запуск TaskTrove..."

# Запуск бэкенда
echo "📦 Запуск бэкенда (Spring Boot)..."
cd backend

# Проверка наличия Maven wrapper, иначе используем системный Maven
if [ -f "./mvnw" ] && [ -f ".mvn/wrapper/maven-wrapper.properties" ]; then
    MVN_CMD="./mvnw"
else
    MVN_CMD="mvn"
    echo "   Используется системный Maven"
fi

$MVN_CMD spring-boot:run > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Ожидание запуска бэкенда
sleep 5

# Запуск фронтенда
echo "⚛️  Запуск фронтенда (Vite)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo "✅ Приложения запущены!"
echo "📝 Backend PID: $BACKEND_PID (порт 8080)"
echo "📝 Frontend PID: $FRONTEND_PID (порт 5173)"
echo ""
echo "🌐 Backend: http://localhost:8080"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "📋 Логи:"
echo "   - Backend: backend.log"
echo "   - Frontend: frontend.log"
echo ""
echo "🛑 Для остановки используйте: ./stop.sh"
echo "   или сохраните PIDs и выполните: kill $BACKEND_PID $FRONTEND_PID"

# Сохранение PIDs в файл
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

