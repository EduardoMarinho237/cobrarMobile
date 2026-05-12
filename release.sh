#!/usr/bin/env bash
set -e

echo "======================================"
echo "  GERADOR DE RELEASE - COBRAR MOBILE"
echo "======================================"
echo ""

read -p "Digite a versão (ex: 1.0.0): " VERSAO
read -p "Digite o código da versão (ex: 2): " CODE
read -p "Digite o email admin: " EMAIL
read -s -p "Digite a senha admin: " SENHA
echo ""
echo ""

if [ -z "$VERSAO" ] || [ -z "$CODE" ] || [ -z "$EMAIL" ] || [ -z "$SENHA" ]; then
  echo "❌ Erro: versão, código, email e senha são obrigatórios."
  exit 1
fi

echo "Versão: $VERSAO"
echo "Code: $CODE"
echo ""

APK_UNSIGNED="android/app/build/outputs/apk/release/cobrar-mobile-release-unsigned.apk"
APK_ALIGNED="android/app/build/outputs/apk/release/cobrar-mobile-release-aligned.apk"
APK_SIGNED="android/app/build/outputs/apk/release/cobrar-mobile-release-signed.apk"
APK_FINAL="android/app/build/outputs/apk/release/cobrar-app-v$VERSAO.apk"

ZIPALIGN="/c/Users/bisaw/AppData/Local/Android/Sdk/build-tools/36.1.0/zipalign.exe"
APKSIGNER="/c/Users/bisaw/AppData/Local/Android/Sdk/build-tools/36.1.0/apksigner.bat"

KEYSTORE="cobrarMobile.keystore"
ALIAS="cobrarMobile"

BASE_URL="http://187.127.30.189:8080"
LOGIN_URL="$BASE_URL/api/auth/login"
UPLOAD_URL="$BASE_URL/api/admin/upload/versions/latest"

echo "======================================"
echo "Atualizando .env com versão..."
echo "======================================"
sed -i "s/^VITE_APP_VERSION=.*/VITE_APP_VERSION=$VERSAO/" .env
grep VITE_APP_VERSION .env

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
echo "Gerando APK Debug..."
echo "======================================"
(cd android && ./gradlew assembleDebug)

echo ""
echo "APK Debug gerado:"
ls -lh android/app/build/outputs/apk/debug/*.apk || true

echo ""
echo "======================================"
echo "Gerando APK Release..."
echo "======================================"
(cd android && ./gradlew assembleRelease)

echo ""
echo "APK Release unsigned:"
ls -lh android/app/build/outputs/apk/release/*unsigned.apk

if [ ! -f "$APK_UNSIGNED" ]; then
  echo "❌ Erro: APK unsigned não encontrado em: $APK_UNSIGNED"
  exit 1
fi

echo ""
echo "======================================"
echo "Zipalign..."
echo "======================================"
"$ZIPALIGN" -v 4 "$APK_UNSIGNED" "$APK_ALIGNED"

echo ""
echo "======================================"
echo "Assinando APK..."
echo "======================================"
"$APKSIGNER" sign \
  --ks "$KEYSTORE" \
  --ks-key-alias "$ALIAS" \
  --out "$APK_SIGNED" \
  "$APK_ALIGNED"

echo ""
echo "======================================"
echo "Verificando assinatura..."
echo "======================================"
"$APKSIGNER" verify --verbose "$APK_SIGNED"

echo ""
echo "======================================"
echo "Renomeando APK final..."
echo "======================================"
mv -f "$APK_SIGNED" "$APK_FINAL"

echo "APK final gerado:"
ls -lh "$APK_FINAL"

echo ""
echo "======================================"
echo "FAZENDO LOGIN NA API..."
echo "======================================"

LOGIN_RESPONSE=$(curl.exe -s -X POST "$LOGIN_URL" \
  -H "Content-Type: application/json" \
  -d "{\"login\":\"$EMAIL\",\"password\":\"$SENHA\"}")

echo "Resposta login:"
echo "$LOGIN_RESPONSE"
echo ""

SUCCESS=$(echo "$LOGIN_RESPONSE" | grep -o '"success":[^,]*' | cut -d: -f2 | tr -d ' ')
ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*"' | cut -d: -f2 | tr -d '"')
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d: -f2 | tr -d '"')

if [ "$SUCCESS" != "true" ]; then
  echo "❌ Login falhou. Abortando."
  exit 1
fi

if [ "$ROLE" != "ADMIN" ]; then
  echo "❌ Usuário não é ADMIN (role=$ROLE). Abortando."
  exit 1
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Token não encontrado. Abortando."
  exit 1
fi

echo "✅ Login OK. Role=ADMIN"
echo ""

echo "======================================"
echo "ENVIANDO APK PARA API..."
echo "======================================"

curl.exe -X POST "$UPLOAD_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -F "apk=@$(pwd)/$APK_FINAL" \
  -F "version=$VERSAO" \
  -F "code=$CODE"

echo ""
echo "======================================"
echo "FINALIZADO!"
echo "======================================"

explorer.exe android\\app\\build\\outputs\\apk\\release
