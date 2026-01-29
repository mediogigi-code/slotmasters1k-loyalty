#!/bin/bash

# ============================================
# DEPLOYMENT SCRIPT PARA SITEGROUND
# ============================================

echo "🎰 SlotMasters1K Loyalty - Deploy a SiteGround"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para preguntas sí/no
ask_continue() {
    while true; do
        read -p "¿Continuar? (s/n): " yn
        case $yn in
            [Ss]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Por favor responde s o n.";;
        esac
    done
}

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) detectado${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm --version) detectado${NC}"
echo ""

# Configurar variables de entorno
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  Archivo .env.production no encontrado${NC}"
    echo "Creando desde .env.example..."
    cp .env.example .env.production
    echo ""
    echo -e "${YELLOW}❗ IMPORTANTE: Edita .env.production con tus credenciales${NC}"
    echo "Presiona Enter cuando hayas editado el archivo..."
    read
fi

echo -e "${GREEN}✅ Archivo .env.production encontrado${NC}"
echo ""

# Verificar credenciales críticas
source .env.production
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ "$NEXT_PUBLIC_SUPABASE_URL" = "your-project-url.supabase.co" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL no está configurado${NC}"
    echo "Edita .env.production con tus credenciales de Supabase"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_KICK_CLIENT_ID" ] || [ "$NEXT_PUBLIC_KICK_CLIENT_ID" = "your-kick-client-id" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_KICK_CLIENT_ID no está configurado${NC}"
    echo "Edita .env.production con tus credenciales de Kick OAuth"
    exit 1
fi

echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
echo ""

# Limpiar builds anteriores
echo "🧹 Limpiando builds anteriores..."
rm -rf .next
rm -rf out
echo -e "${GREEN}✅ Limpieza completada${NC}"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --production=false
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al instalar dependencias${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# Build del proyecto
echo "🔨 Construyendo proyecto para producción..."
NODE_ENV=production npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en el build${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build completado${NC}"
echo ""

# Verificar que server.js existe
if [ ! -f server.js ]; then
    echo -e "${RED}❌ server.js no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ server.js encontrado${NC}"
echo ""

# Crear archivo de instrucciones
cat > INSTRUCCIONES_DEPLOY.txt << 'EOF'
================================================================================
INSTRUCCIONES PARA SUBIR A SITEGROUND
================================================================================

1. COMPRIMIR ARCHIVOS
   El script ya creó: slotmasters1k-siteground.tar.gz

2. SUBIR VIA SFTP
   
   Credenciales SFTP:
   - Host: slotmasters1k.net
   - Puerto: 18765
   - Usuario: [tu_usuario_sftp]
   - Password: [tu_contraseña]
   
   Sube el archivo a:
   /home/customer/www/comunidad.slotmasters1k.net/

3. CONECTAR VIA SSH
   
   ssh -p 18765 usuario@slotmasters1k.net
   
4. EXTRAER ARCHIVOS
   
   cd ~/www/comunidad.slotmasters1k.net
   tar -xzf slotmasters1k-siteground.tar.gz
   rm slotmasters1k-siteground.tar.gz

5. CONFIGURAR EN SITE TOOLS
   
   a) Ve a Dev → JavaScript
   b) Setup Node.js App:
      - Node Version: 18.x
      - Application Mode: Production
      - Application Root: comunidad.slotmasters1k.net
      - Application URL: comunidad.slotmasters1k.net
      - Startup File: server.js
   c) Click "Create"

6. INSTALAR DEPENDENCIAS (vía SSH)
   
   cd ~/www/comunidad.slotmasters1k.net
   npm install --production

7. REINICIAR APP
   
   En Site Tools → Dev → JavaScript → Restart

8. VERIFICAR
   
   https://comunidad.slotmasters1k.net

================================================================================
ARCHIVOS INCLUIDOS EN EL PAQUETE
================================================================================

✓ Código fuente completo
✓ node_modules (dependencies)
✓ .next (build de Next.js)
✓ server.js (servidor Node.js)
✓ .env.production (variables de entorno)
✓ package.json y package-lock.json

================================================================================
TROUBLESHOOTING
================================================================================

Si la app no arranca:
1. Verificar logs: tail -f ~/logs/nodejs.log
2. Reinstalar dependencias: rm -rf node_modules && npm install
3. Rebuild: npm run build
4. Reiniciar desde Site Tools

Si el login no funciona:
1. Verificar .env.production tiene las credenciales correctas
2. Verificar redirect URI en Kick coincide con tu dominio
3. Verificar SSL está activo

================================================================================
EOF

echo -e "${GREEN}✅ Instrucciones creadas: INSTRUCCIONES_DEPLOY.txt${NC}"
echo ""

# Crear paquete comprimido
echo "📦 Creando paquete para SiteGround..."

# Excluir archivos innecesarios
cat > .deployignore << 'EOF'
.git
.gitignore
node_modules/.cache
*.log
.DS_Store
.env.local
.env.development
README.md
DEPLOYMENT*.md
ROADMAP.md
build-*.sh
backend/
EOF

# Incluir solo lo necesario
tar -czf slotmasters1k-siteground.tar.gz \
    --exclude-from=.deployignore \
    .next/ \
    app/ \
    components/ \
    lib/ \
    types/ \
    utils/ \
    public/ \
    node_modules/ \
    server.js \
    package.json \
    package-lock.json \
    next.config.js \
    tailwind.config.js \
    postcss.config.js \
    tsconfig.json \
    .env.production \
    INSTRUCCIONES_DEPLOY.txt

rm .deployignore

if [ ! -f slotmasters1k-siteground.tar.gz ]; then
    echo -e "${RED}❌ Error al crear el paquete${NC}"
    exit 1
fi

SIZE=$(ls -lh slotmasters1k-siteground.tar.gz | awk '{print $5}')
echo -e "${GREEN}✅ Paquete creado: slotmasters1k-siteground.tar.gz (${SIZE})${NC}"
echo ""

# Resumen final
echo "================================================"
echo -e "${GREEN}✅ DEPLOYMENT PACKAGE LISTO${NC}"
echo "================================================"
echo ""
echo "📦 Archivo creado:"
echo "   - slotmasters1k-siteground.tar.gz"
echo ""
echo "📄 Instrucciones:"
echo "   - INSTRUCCIONES_DEPLOY.txt"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo ""
echo "1. Sube slotmasters1k-siteground.tar.gz a SiteGround via SFTP"
echo "2. Lee INSTRUCCIONES_DEPLOY.txt para el proceso completo"
echo "3. Configura Node.js App en Site Tools"
echo "4. Inicia la aplicación"
echo ""
echo "================================================"
echo ""
echo -e "${YELLOW}¿Necesitas las credenciales SFTP de SiteGround?${NC}"
echo "Encuéntralas en: Site Tools → Dev → SSH Keys Manager"
echo ""
