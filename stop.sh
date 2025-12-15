#!/bin/bash

# Скрипт для остановки бэкенда и фронтенда

echo "🛑 Остановка TaskTrove..."

# Чтение PIDs из файлов
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend остановлен (PID: $BACKEND_PID)"
    else
        echo "⚠️  Backend процесс не найден"
    fi
    rm .backend.pid
else
    echo "⚠️  Файл .backend.pid не найден"
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend остановлен (PID: $FRONTEND_PID)"
    else
        echo "⚠️  Frontend процесс не найден"
    fi
    rm .frontend.pid
else
    echo "⚠️  Файл .frontend.pid не найден"
fi

# Дополнительная очистка по портам
echo "🧹 Очистка портов..."
lsof -ti:8080 | xargs kill -9 2>/dev/null && echo "✅ Порт 8080 освобожден" || echo "   Порт 8080 уже свободен"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "✅ Порт 5173 освобожден" || echo "   Порт 5173 уже свободен"

# Остановка процессов по имени
pkill -f "spring-boot:run" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo ""
echo "✅ Все процессы остановлены!"

