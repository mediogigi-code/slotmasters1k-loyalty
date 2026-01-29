# 🚀 SLOTMASTERS1K BACKEND API

Backend API para manejar OAuth, WebSockets y workers del sistema de lealtad.

## 🎯 Propósito

Este servidor backend maneja:
- ✅ Kick OAuth callback
- ✅ Proxy de Kick API (evitar CORS)
- 🚧 Cron jobs de minado (Fase 2)
- 🚧 WebSocket server para apuestas (Fase 2)

## 📦 Instalación Local

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

Servidor corriendo en: `http://localhost:4000`

## 🌐 Deploy a Railway (GRATIS)

### Paso 1: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Sign up con GitHub
3. Click en "New Project"

### Paso 2: Deploy desde GitHub

1. Conecta tu repositorio
2. Selecciona la carpeta `backend/`
3. Railway detectará automáticamente el `package.json`

### Paso 3: Configurar Variables de Entorno

En Railway Dashboard → Variables:

```
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://comunidad.slotmasters1k.net
KICK_CLIENT_ID=tu-kick-client-id
KICK_CLIENT_SECRET=tu-kick-client-secret
KICK_REDIRECT_URI=https://comunidad.slotmasters1k.net/auth/callback
SUPABASE_URL=tu-supabase-url
SUPABASE_SERVICE_KEY=tu-service-key
CRON_SECRET=genera-una-clave-segura
KICK_CHANNEL=slotmasters1k
```

### Paso 4: Obtener URL del Deploy

Railway te dará una URL como:
```
https://slotmasters1k-backend-production.up.railway.app
```

Guárdala para configurar el frontend.

## 🔌 Endpoints Disponibles

### Health Check
```
GET /
GET /health
```

### OAuth
```
POST /auth/kick-callback
Body: { "code": "authorization_code" }
Response: { "success": true, "token": "...", "user": {...} }
```

### Kick API Proxy
```
GET /kick/channel/:channel
Response: { datos del canal }
```

### Cron (Fase 2)
```
POST /cron/mine-points
Header: Authorization: Bearer CRON_SECRET
```

## 🧪 Probar Localmente

```bash
# Test health
curl http://localhost:4000/health

# Test channel info
curl http://localhost:4000/kick/channel/slotmasters1k
```

## 📝 Configurar Frontend

Una vez tengas la URL de Railway, actualiza el frontend:

En `.env.local` del frontend:
```
NEXT_PUBLIC_API_URL=https://tu-app.up.railway.app
```

## 🔐 Seguridad

- ✅ CORS configurado
- ✅ Variables de entorno seguras
- ✅ Cron protegido con secret
- ✅ Logging de requests

## 📊 Monitoreo

En Railway Dashboard puedes ver:
- Logs en tiempo real
- Uso de CPU/RAM
- Requests por minuto
- Errores

## 🆘 Troubleshooting

### Error: "Missing environment variables"
→ Verifica que todas las variables estén en Railway

### Error: "CORS policy"
→ Añade tu dominio a FRONTEND_URL

### Backend no responde
→ Revisa logs en Railway Dashboard

## 🚀 Próximos Pasos (Fase 2)

- [ ] Implementar Supabase integration
- [ ] Añadir Socket.io para WebSockets
- [ ] Implementar mining worker
- [ ] Añadir rate limiting
- [ ] Implementar autenticación JWT

---

**Status**: ✅ Básico funcionando - Listo para OAuth
