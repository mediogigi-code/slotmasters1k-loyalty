# 🚀 DEPLOYMENT EN SITEGROUND - SLOTMASTERS1K LOYALTY

Guía específica para desplegar en tu hosting SiteGround con Node.js.

---

## 🎯 ARQUITECTURA EN SITEGROUND

```
┌────────────────────────────────────────┐
│  SiteGround (slotmasters1k.net)       │
│  ├─ WordPress principal                │
│  └─ Node.js App (subdomain)            │
│     └─ comunidad.slotmasters1k.net    │
│        → Next.js + API                 │
└────────────────────────────────────────┘
                ↓
┌────────────────────────────────────────┐
│  Supabase (GRATIS)                     │
│  → PostgreSQL Database                 │
└────────────────────────────────────────┘
```

---

## ✅ VENTAJAS DE USAR NODE.JS EN SITEGROUND

- ✅ Todo en un solo lugar
- ✅ Control total desde Site Tools
- ✅ Subdominio fácil de configurar
- ✅ SSL automático gratuito
- ✅ Recursos garantizados (RAM/CPU)
- ✅ Backups automáticos

---

## 📋 PASO 1: ACCEDER A SITE TOOLS

1. Entra a tu panel de SiteGround
2. Click en **"Site Tools"** en slotmasters1k.net
3. Deberías ver el dashboard de Site Tools

---

## 📋 PASO 2: CREAR SUBDOMINIO

### En Site Tools:

1. Ve a **Domain** → **Subdomains**
2. Click en **"Create Subdomain"**
3. Configura:
   ```
   Subdomain: comunidad
   Domain: slotmasters1k.net
   Document Root: /home/customer/www/comunidad.slotmasters1k.net/public_html
   ```
4. Click **"Create"**
5. Espera 5-10 minutos para propagación DNS

---

## 📋 PASO 3: HABILITAR NODE.JS

### En Site Tools:

1. Ve a **Dev** → **JavaScript**
2. Click en **"Setup Node.js App"**
3. Configura:
   ```
   Node.js Version: 18.x (o la más reciente)
   Application Mode: Production
   Application Root: comunidad.slotmasters1k.net
   Application URL: comunidad.slotmasters1k.net
   Application Startup File: server.js (lo crearemos después)
   ```
4. Click **"Create"**

SiteGround te dará:
- **Comando de entrada NPM**: Lo usarás para instalar dependencias
- **Botón para reiniciar**: Para aplicar cambios

---

## 📋 PASO 4: SUBIR ARCHIVOS VIA FTP/SFTP

### Configuración SFTP:

En Site Tools → Dev → **SSH Keys Manager**:
1. Crea un usuario SFTP
2. Descarga la clave privada
3. Usa FileZilla o similar

**Credenciales SFTP:**
```
Host: slotmasters1k.net (o tu IP de SiteGround)
Port: 18765 (puerto SFTP de SiteGround)
Usuario: [tu_usuario_sftp]
Password/Key: [tu_contraseña_o_clave]
```

### Archivos a subir:

Sube TODO el proyecto a:
```
/home/customer/www/comunidad.slotmasters1k.net/
```

**Estructura final:**
```
/home/customer/www/comunidad.slotmasters1k.net/
├── public_html/           (aquí irá el build de Next.js)
├── app/
├── components/
├── lib/
├── package.json
├── next.config.js
├── .env.production         (crear este)
└── server.js              (crear este - importante)
```

---

## 📋 PASO 5: CREAR SERVIDOR NODE.JS PARA SITEGROUND

SiteGround necesita un archivo `server.js` en la raíz del proyecto.

Crea `/home/customer/www/comunidad.slotmasters1k.net/server.js`:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Inicializar Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

---

## 📋 PASO 6: CONFIGURAR VARIABLES DE ENTORNO

Crea `/home/customer/www/comunidad.slotmasters1k.net/.env.production`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Kick OAuth
NEXT_PUBLIC_KICK_CLIENT_ID=tu-kick-client-id
KICK_CLIENT_SECRET=tu-kick-client-secret
NEXT_PUBLIC_KICK_REDIRECT_URI=https://comunidad.slotmasters1k.net/auth/callback

# App
NEXT_PUBLIC_APP_URL=https://comunidad.slotmasters1k.net
NEXT_PUBLIC_KICK_CHANNEL=slotmasters1k

# API (mismo servidor)
NEXT_PUBLIC_API_URL=https://comunidad.slotmasters1k.net

NODE_ENV=production
PORT=3000
```

---

## 📋 PASO 7: INSTALAR DEPENDENCIAS VIA SSH

### Opción A: SSH desde Site Tools

1. Site Tools → Dev → **SSH Keys Manager**
2. Genera par de claves SSH
3. Descarga la clave privada
4. Usa PuTTY (Windows) o Terminal (Mac/Linux)

```bash
ssh -p 18765 usuario@slotmasters1k.net -i /ruta/a/clave_privada
```

### Opción B: Usar Web SSH de SiteGround

Site Tools → Dev → **Terminal** (si está disponible)

### Comandos a ejecutar:

```bash
# Navegar al directorio
cd ~/www/comunidad.slotmasters1k.net

# Instalar dependencias
npm install

# Build de Next.js
npm run build

# Verificar que todo está OK
ls -la .next/
```

---

## 📋 PASO 8: CONFIGURAR NEXT.JS PARA SITEGROUND

Modifica `next.config.js` para modo standalone:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Para deployment en servidor
  reactStrictMode: true,
  images: {
    domains: [
      'kick.com',
      'files.kick.com',
      'stream.kick.com',
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_KICK_CHANNEL: process.env.NEXT_PUBLIC_KICK_CHANNEL,
  },
}

module.exports = nextConfig
```

---

## 📋 PASO 9: INICIAR LA APLICACIÓN

### En Site Tools:

1. Ve a **Dev** → **JavaScript**
2. Encuentra tu aplicación **comunidad.slotmasters1k.net**
3. Click en **"Restart"**
4. Verifica el estado: debería estar **"Running"**

### Verificar logs:

En SSH:
```bash
cd ~/www/comunidad.slotmasters1k.net
tail -f logs/nodejs.log
```

---

## 📋 PASO 10: CONFIGURAR SSL (HTTPS)

SiteGround hace esto automático, pero verifica:

1. Site Tools → Security → **SSL Manager**
2. Verifica que **comunidad.slotmasters1k.net** tiene SSL activo
3. Si no, instala el certificado Let's Encrypt gratis

---

## 📋 PASO 11: CONFIGURAR PROXY REVERSO (Opcional)

Si Next.js corre en puerto 3000, SiteGround debería configurarlo automáticamente.

Si no funciona, añade este `.htaccess` en el document root:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
</IfModule>
```

---

## ✅ VERIFICACIÓN FINAL

1. Abre: `https://comunidad.slotmasters1k.net`
2. Deberías ver la landing page
3. Prueba el login con Kick
4. Verifica dashboard

---

## 🐛 TROUBLESHOOTING COMÚN

### Error: "Application failed to start"

**Solución:**
```bash
# En SSH
cd ~/www/comunidad.slotmasters1k.net
npm install --production
npm run build
# Reiniciar desde Site Tools
```

### Error: "Port already in use"

**Solución:**
- Cambiar PORT en `.env.production`
- Actualizar Application Startup en Site Tools

### Error: "Module not found"

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### La app no responde

**Solución:**
1. Verificar logs: `tail -f ~/logs/nodejs.log`
2. Reiniciar app desde Site Tools
3. Verificar que Puerto no esté bloqueado por firewall

---

## 🚀 ALTERNATIVA: DEPLOY ESTÁTICO + BACKEND SEPARADO

Si Node.js te da problemas en SiteGround:

### Plan B: Frontend estático + Railway

1. **Frontend**: Exportar Next.js estático y subirlo a `public_html/`
2. **Backend**: Usar Railway (gratis) para API
3. Sigue la guía **DEPLOYMENT_CPANEL.md**

---

## 📊 MONITOREO Y MANTENIMIENTO

### Ver uso de recursos:
Site Tools → Statistics → **Resource Usage**

### Ver logs en tiempo real:
```bash
ssh -p 18765 usuario@slotmasters1k.net
tail -f ~/logs/nodejs.log
```

### Reiniciar aplicación:
Site Tools → Dev → JavaScript → **Restart**

### Backups:
Site Tools → Site → **Backups** (automáticos diarios)

---

## 💰 COSTOS

- ✅ **SiteGround**: Ya lo tienes (Plan de Hosting)
- ✅ **Supabase**: GRATIS (plan free)
- ✅ **SSL**: GRATIS (Let's Encrypt)
- ✅ **Subdominio**: GRATIS
- ✅ **Node.js**: INCLUIDO en tu plan

**Total: 0€ adicionales** 🎉

---

## 📞 SOPORTE SITEGROUND

Si tienes problemas:
- Chat 24/7 en español
- Tickets desde Site Tools
- Documentación: https://www.siteground.com/kb/node-js-hosting/

---

## ✅ CHECKLIST DEPLOYMENT

- [ ] Subdominio creado
- [ ] Node.js habilitado en Site Tools
- [ ] Archivos subidos via SFTP
- [ ] server.js creado
- [ ] .env.production configurado
- [ ] Dependencias instaladas (npm install)
- [ ] Build ejecutado (npm run build)
- [ ] Aplicación iniciada desde Site Tools
- [ ] SSL activo
- [ ] App accesible en https://comunidad.slotmasters1k.net
- [ ] Login con Kick funciona

---

**¿Listo para empezar?** Empieza por el Paso 1 y ve avanzando paso a paso.
