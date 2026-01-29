#!/bin/bash

# ============================================
# BUILD SCRIPT PARA HOSTING TRADICIONAL
# ============================================

echo "🎰 SlotMasters1K Loyalty - Build para cPanel"
echo "=============================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"
echo ""

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ npm $(npm --version) detectado"
echo ""

# Verificar archivo .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  Archivo .env.local no encontrado"
    echo "Creando desde .env.example..."
    cp .env.example .env.local
    echo ""
    echo "❗ IMPORTANTE: Edita .env.local con tus credenciales antes de continuar"
    echo "Presiona Enter cuando hayas editado el archivo..."
    read
fi

echo "✅ Archivo .env.local encontrado"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi
echo "✅ Dependencias instaladas"
echo ""

# Build del proyecto
echo "🔨 Construyendo proyecto..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en el build"
    exit 1
fi
echo "✅ Build completado"
echo ""

# Verificar carpeta out/
if [ ! -d "out" ]; then
    echo "❌ Carpeta out/ no encontrada"
    exit 1
fi

echo "✅ Carpeta out/ generada"
echo ""

# Crear .htaccess
echo "📝 Creando .htaccess..."
cat > out/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Forzar HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Headers de seguridad
<IfModule mod_headers.c>
  Header set X-Frame-Options "DENY"
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
EOF

echo "✅ .htaccess creado"
echo ""

# Crear archivo comprimido para subir
echo "📦 Creando archivo para subir..."
cd out
tar -czf ../slotmasters1k-web.tar.gz .
cd ..

echo "✅ Archivo slotmasters1k-web.tar.gz creado"
echo ""

# Resumen
echo "=============================================="
echo "✅ BUILD COMPLETADO EXITOSAMENTE"
echo "=============================================="
echo ""
echo "📁 Archivos generados:"
echo "   - out/ (carpeta con sitio estático)"
echo "   - slotmasters1k-web.tar.gz (comprimido)"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo ""
echo "OPCIÓN A - Subir via cPanel File Manager:"
echo "1. Entra a cPanel"
echo "2. Ve a File Manager"
echo "3. Navega a public_html/comunidad/"
echo "4. Sube slotmasters1k-web.tar.gz"
echo "5. Extrae el archivo"
echo "6. Elimina el .tar.gz"
echo ""
echo "OPCIÓN B - Subir via FTP:"
echo "1. Conecta con FileZilla"
echo "2. Sube TODO el contenido de out/"
echo "3. A la carpeta public_html/comunidad/"
echo ""
echo "OPCIÓN C - SSH (si tienes acceso):"
echo "   scp slotmasters1k-web.tar.gz usuario@servidor:/home/usuario/public_html/comunidad/"
echo "   ssh usuario@servidor"
echo "   cd public_html/comunidad"
echo "   tar -xzf slotmasters1k-web.tar.gz"
echo "   rm slotmasters1k-web.tar.gz"
echo ""
echo "=============================================="
