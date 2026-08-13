#!/bin/bash
echo "========================================================================="
echo "🐅 Pench Tiger Reserve Intelligence Platform - Automated Setup Script"
echo "========================================================================="
echo ""

echo "[1/3] Installing root dependencies..."
npm install

echo "[2/3] Installing Express REST API server dependencies..."
cd server && npm install && cd ..

echo "[3/3] Installing Vite Local HTTPS UI client dependencies..."
cd client && npm install && cd ..

echo ""
echo "========================================================================="
echo "✅ Setup Complete!"
echo "To launch both Express Backend API & Vite HTTPS Frontend, run:"
echo "   npm run dev"
echo "========================================================================="
