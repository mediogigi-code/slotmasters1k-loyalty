# 🌐 DEPLOYMENT EN HOSTING TRADICIONAL (cPanel)

Guía para desplegar SlotMasters1K Loyalty en tu servidor de hosting con cPanel.

---

## 🎯 ARQUITECTURA PARA TU SERVIDOR

### Opción Recomendada: **Híbrida**

```
Frontend (Next.js estático)  →  Tu Hosting cPanel
Backend (Node.js WebSocket)  →  Railway/Render (gratis)
Base de Datos               →  Supabase (gratis)
```

**¿Por qué?**
- Next.js necesita Node.js para SSR, que cPanel no suele tener
- Pero podemos exportar Next.js como **sitio estático** y subirlo a tu hosting
- El servidor WebSocket lo alojamos gratis en Railway
- Supabase gratis para la DB

### Opción Alternativa: **Todo en tu VPS**

Si tienes un VPS (no shared hosting) con acceso SSH y Node.js:
```
Todo en tu servidor  →  PM2 + Nginx
```

---

## 🚀 MÉTODO 1: NEXT.JS ESTÁTICO EN TU HOSTING (RECOMENDADO)

### Paso 1: Configurar Next.js para Export Estático

Edita `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ← IMPORTANTE: Genera sitio estático
  reactStrictMode: true,
  images: {
    unoptimized: true, // Para export estático
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

### Paso 2: Modificar Auth Callback

El OAuth callback necesita un servidor. Vamos a usar una **API serverless externa**.

Crea un nuevo archivo `app/auth/callback/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Llamar a tu API backend (Railway)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/kick-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      .then(res => res.json())
      .then(data => {
        // Guardar token en localStorage
        localStorage.setItem('auth_token', data.token);
        window.location.href = '/dashboard';
      })
      .catch(err => {
        console.error(err);
        window.location.href = '/?error=auth_failed';
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Procesando autenticación...</p>
      </div>
    </div>
  );
}
```

Elimina `app/auth/callback/route.ts` (no funciona en export estático).

### Paso 3: Build del Proyecto

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Build estático
npm run build
```

Esto genera una carpeta `out/` con tu sitio estático.

### Paso 4: Subir a tu Hosting via cPanel

#### Opción A: File Manager de cPanel

1. Entra a cPanel
2. Ve a **File Manager**
3. Navega a `public_html/comunidad/` (o crea la carpeta)
4. **Elimina** todo el contenido de la carpeta
5. Sube TODO el contenido de la carpeta `out/`
6. Verifica permisos (755 para carpetas, 644 para archivos)

#### Opción B: FTP

```bash
# Desde tu ordenador
cd out/
# Usa FileZilla o similar
# Host: ftp.slotmasters1k.net
# Usuario: tu_usuario_ftp
# Sube todo a /public_html/comunidad/
```

#### Opción C: SSH (si tienes acceso)

```bash
# En tu ordenador
cd slotmasters1k-loyalty
tar -czf out.tar.gz out/

# Subir via SCP
scp out.tar.gz usuario@slotmasters1k.net:/home/usuario/public_html/comunidad/

# En el servidor
ssh usuario@slotmasters1k.net
cd /home/usuario/public_html/comunidad/
tar -xzf out.tar.gz --strip-components=1
rm out.tar.gz
```

### Paso 5: Configurar .htaccess para SPAs

Crea `.htaccess` en `public_html/comunidad/`:

```apache
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
```

### Paso 6: Configurar Subdominio en cPanel

1. En cPanel, ve a **Subdomains**
2. Crear subdominio:
   - **Subdomain**: `comunidad`
   - **Domain**: `slotmasters1k.net`
   - **Document Root**: `/public_html/comunidad`
3. Click en **Create**
4. Espera propagación DNS (5-30 min)

---

## 🖥️ MÉTODO 2: SERVIDOR NODE.JS (Si tienes VPS)

Si tienes un VPS con SSH y Node.js:

### Paso 1: Instalar PM2

```bash
ssh usuario@tu-servidor.com
npm install -g pm2
```

### Paso 2: Clonar y Configurar

```bash
cd /var/www
git clone <tu-repo> slotmasters1k-loyalty
cd slotmasters1k-loyalty
npm install
cp .env.example .env
nano .env  # Editar credenciales
npm run build
```

### Paso 3: Ejecutar con PM2

```bash
pm2 start npm --name "slotmasters1k" -- start
pm2 save
pm2 startup  # Sigue las instrucciones
```

### Paso 4: Nginx como Reverse Proxy

Crea `/etc/nginx/sites-available/comunidad.slotmasters1k.net`:

```nginx
server {
    listen 80;
    server_name comunidad.slotmasters1k.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/comunidad.slotmasters1k.net /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 5: SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d comunidad.slotmasters1k.net
```

---

## 🔌 BACKEND API (Railway - GRATIS)

Para el OAuth callback y WebSockets, usa Railway (gratis):

### Paso 1: Crear Backend Separado

Crea carpeta `backend/`:

```bash
mkdir backend
cd backend
npm init -y
npm install express cors dotenv @supabase/supabase-js
```

Crea `backend/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// OAuth Callback
app.post('/auth/kick-callback', async (req, res) => {
  const { code } = req.body;
  
  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://kick.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.KICK_CLIENT_ID,
        client_secret: process.env.KICK_CLIENT_SECRET,
        redirect_uri: process.env.KICK_REDIRECT_URI,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch('https://kick.com/api/v2/user', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const kickUser = await userResponse.json();

    // Aquí guardarías en Supabase y crearías sesión
    // Por ahora devolvemos el token

    res.json({ 
      success: true, 
      token: accessToken,
      user: kickUser 
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
```

### Paso 2: Deploy a Railway

1. Ve a [railway.app](https://railway.app)
2. Conecta tu GitHub
3. Deploy el proyecto `backend/`
4. Añade variables de entorno
5. Copia la URL: `https://tu-app.railway.app`

### Paso 3: Actualizar Frontend

En `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://tu-app.railway.app
```

---

## 📦 RESUMEN DE ARQUITECTURA FINAL

```
┌─────────────────────────────────────┐
│  comunidad.slotmasters1k.net       │
│  (Tu Hosting cPanel)                │
│  → Next.js estático                 │
│  → HTML/CSS/JS                      │
└─────────────────────────────────────┘
              ↓ API calls
┌─────────────────────────────────────┐
│  Railway (Gratis)                   │
│  → Backend Node.js                  │
│  → OAuth handlers                   │
│  → WebSocket server (Fase 2)        │
└─────────────────────────────────────┘
              ↓ DB queries
┌─────────────────────────────────────┐
│  Supabase (Gratis)                  │
│  → PostgreSQL                       │
│  → Auth                             │
│  → Row Level Security               │
└─────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE DEPLOYMENT

- [ ] Next.js configurado para export estático
- [ ] Build generado (`npm run build`)
- [ ] Contenido de `out/` subido a cPanel
- [ ] Subdominio `comunidad` configurado
- [ ] .htaccess creado
- [ ] Backend API en Railway
- [ ] Variables de entorno configuradas
- [ ] OAuth redirect URI actualizado
- [ ] DNS propagado
- [ ] HTTPS funcionando

---

## 🔧 ALTERNATIVA: CLOUDFLARE PAGES (100% GRATIS)

Si prefieres no usar tu hosting:

1. Sube el repo a GitHub
2. Conecta Cloudflare Pages
3. Build command: `npm run build`
4. Output directory: `out`
5. Deploy automático

**URL gratis**: `slotmasters1k-loyalty.pages.dev`
Luego conectas tu dominio `comunidad.slotmasters1k.net`

---

## 💡 RECOMENDACIÓN FINAL

**Para empezar rápido**:
- Frontend estático en Cloudflare Pages (gratis, rápido)
- Backend en Railway (gratis, fácil)
- DB en Supabase (gratis)

**Para largo plazo** (cuando tengas tráfico):
- Todo en tu VPS con PM2 + Nginx
- Control total
- Sin límites

---

¿Qué opción prefieres? Te ayudo a implementarla paso a paso.
