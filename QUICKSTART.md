# 🚀 QUICK START GUIDE - SLOTMASTERS1K LOYALTY

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Extraer el proyecto

```bash
tar -xzf slotmasters1k-loyalty.tar.gz
cd slotmasters1k-loyalty
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Configurar entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales (ver más abajo).

### 4️⃣ Ejecutar en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

---

## 📋 Credenciales Necesarias

### Supabase (REQUERIDO)

1. Crea proyecto en https://supabase.com
2. Ejecuta `supabase-schema.sql` en SQL Editor
3. Obtén credenciales en Settings > API

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### Kick OAuth (REQUERIDO)

Lee `KICK_OAUTH_SETUP.md` para obtener credenciales.

```env
NEXT_PUBLIC_KICK_CLIENT_ID=tu-client-id
KICK_CLIENT_SECRET=tu-client-secret
NEXT_PUBLIC_KICK_REDIRECT_URI=http://localhost:3000/auth/callback
```

---

## 📁 Estructura del Proyecto

```
slotmasters1k-loyalty/
├── app/                    # Páginas Next.js
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard usuario
│   ├── tienda/           # Tienda de recompensas
│   └── auth/callback/    # OAuth callback
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── dashboard/        # Componentes del dashboard
│   └── shop/             # Componentes de la tienda
├── lib/                  # Utilidades
│   ├── supabase.ts      # Cliente Supabase
│   └── utils.ts         # Helpers
├── types/               # Tipos TypeScript
├── supabase-schema.sql  # Schema de base de datos
├── README.md            # Documentación principal
├── DEPLOYMENT.md        # Guía de deploy
├── KICK_OAUTH_SETUP.md  # Setup de Kick OAuth
└── ROADMAP.md           # Roadmap del proyecto
```

---

## ✅ Checklist de Setup

### Paso 1: Base de Datos
- [ ] Proyecto Supabase creado
- [ ] Schema SQL ejecutado
- [ ] Credenciales copiadas a `.env.local`

### Paso 2: Kick OAuth
- [ ] Email enviado a Kick
- [ ] Credenciales recibidas
- [ ] Redirect URI configurado

### Paso 3: Desarrollo Local
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas
- [ ] App ejecutándose (`npm run dev`)
- [ ] Login con Kick funciona

### Paso 4: Deployment (Opcional)
- [ ] Dominio configurado
- [ ] Deploy a Vercel
- [ ] Variables de entorno en Vercel
- [ ] Producción funcionando

---

## 🎯 Próximos Pasos

### Para Desarrollo
1. Lee `README.md` completo
2. Revisa `ROADMAP.md` para ver las fases
3. Familiarízate con el código
4. Empieza con Fase 2 (WebSockets)

### Para Producción
1. Lee `DEPLOYMENT.md`
2. Configura Supabase en producción
3. Configura Kick OAuth con redirect URI de producción
4. Deploy a Vercel
5. Configura dominio personalizado

---

## 📚 Documentos Importantes

| Documento | Propósito |
|-----------|-----------|
| `README.md` | Documentación completa del proyecto |
| `DEPLOYMENT.md` | Guía paso a paso de deployment |
| `KICK_OAUTH_SETUP.md` | Configurar autenticación con Kick |
| `ROADMAP.md` | Plan de desarrollo en 3 fases |
| `supabase-schema.sql` | Schema completo de la base de datos |

---

## 🆘 Problemas Comunes

### "Missing Supabase environment variables"
→ Verifica que `.env.local` tenga las credenciales correctas

### "redirect_uri mismatch"
→ El URI en Kick debe coincidir con el de `.env.local`

### Login no funciona
→ Verifica que Kick OAuth esté configurado correctamente

### Base de datos vacía
→ Ejecuta `SELECT reset_weekly_stock();` en Supabase

---

## 📞 Contacto

**Proyecto**: SlotMasters1K Loyalty System
**Tech Stack**: Next.js 14 + Supabase + Kick OAuth
**Estado**: ✅ Fase 1 Completa

---

**¡Listo para empezar! 🚀**

Para más detalles, consulta `README.md`
