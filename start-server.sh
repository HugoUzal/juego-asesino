#!/bin/bash

echo "🎮 ============================================"
echo "🔪 JUEGO ASESINO - INICIANDO SERVIDOR"
echo "🎮 ============================================"
echo ""

cd server

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  npm install
  echo ""
fi

echo "🚀 Iniciando servidor en http://localhost:3000"
echo ""

npm start
