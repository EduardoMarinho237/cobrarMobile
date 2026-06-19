#!/usr/bin/env bash
set -e

echo "======================================"
echo "  GERADOR DE APK DEBUG - COBRAR MOBILE"
echo "======================================"
echo ""

read -p "Digite a versão (ex: 1.0.0): " VERSAO
read -p "Digite o código da versão/versionCode (ex: 2): " CODE
if [ -z "$VERSAO" ] || [ -z "$CODE" ]; then
  echo "❌ Erro: versão e código são obrigatórios."
  exit 1
fi

echo "Versão: $VERSAO"
echo "VersionCode: $CODE"
echo ""

# Caminhos do APK (modo debug, sem assinatura)
APK_SIGNED="android/app/build/outputs/apk/debug/cobrar-mobile-debug.apk"
APK_FINAL="android/app/build/outputs/apk/debug/cobrar-app-v$VERSAO-debug.apk"

echo "======================================"
echo "Atualizando versão no build.gradle..."
echo "======================================"
# Atualiza versionCode e versionName no build.gradle
sed -i "s/versionCode [0-9]*/versionCode $CODE/" android/app/build.gradle
sed -i "s/versionName \"[^\"]*\"/versionName \"$VERSAO\"/" android/app/build.gradle
echo "✅ VersionCode=$CODE, VersionName=$VERSAO"
echo ""

echo "======================================"
echo "Atualizando .env com versão..."
echo "======================================"
if [ -f ".env" ]; then
  sed -i "s/^VITE_APP_VERSION=.*/VITE_APP_VERSION=$VERSAO/" .env
  grep VITE_APP_VERSION .env
  echo "✅ .env atualizado"
else
  echo "⚠️  .env não encontrado, criando..."
  echo "VITE_APP_VERSION=$VERSAO" > .env
  echo "✅ .env criado"
fi
echo ""

echo "======================================"
echo "Instalando dependências e buildando..."
echo "======================================"
npm install
npm run build

echo ""
echo "======================================"
echo "Sincronizando Capacitor..."
echo "======================================"
npx cap sync android

echo ""
echo "======================================"
echo "Gerando APK Debug (rápido, sem assinatura)..."
echo "======================================"
cd android
./gradlew assembleDebug
cd ..

echo ""
echo "Verificando APK gerado..."
if [ ! -f "$APK_SIGNED" ]; then
  echo "❌ Erro: APK não encontrado em: $APK_SIGNED"
  echo "Verificando arquivos gerados:"
  ls -lh android/app/build/outputs/apk/debug/ || true
  exit 1
fi

echo "✅ APK gerado:"
ls -lh "$APK_SIGNED"
echo ""

echo "======================================"
echo "Renomeando APK final..."
echo "======================================"
cp "$APK_SIGNED" "$APK_FINAL"
echo "✅ APK final:"
ls -lh "$APK_FINAL"
echo ""

echo "======================================"
echo "FINALIZADO!"
echo "======================================"
echo ""
echo "📱 APK debug gerado: $(pwd)/$APK_FINAL"
echo ""

explorer.exe android\\app\\build\\outputs\\apk\\debug
