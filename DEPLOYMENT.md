# 🚀 GUÍA DE DEPLOYMENT - SLOTMASTERS1K LOYALTY APP

Guía completa para desplegar la aplicación en producción.

## 📋 Checklist Pre-Deployment

- [ ] Credenciales de Kick OAuth obtenidas
- [ ] Proyecto de Supabase creado
- [ ] Schema SQL ejecutado en Supabase
- [ ] Dominio configurado: `comunidad.slotmasters1k.net`
- [ ] Cuenta de Vercel creada

## 🗄️ PASO 1: Configurar Supabase

### 1.1 Crear Proyecto

1. Ve a [Supabase](https://supabase.com)
2. Click en "New Project"
3. Configuración:
   - **Name**: slotmasters1k-loyalty
   - **Database Password**: Genera una contraseña segura (¡guárdala!)
   - **Region**: Elige la más cercana a España (Frankfurt o Ireland)
   - **Pricing Plan**: Free tier es suficiente para empezar

### 1.2 Ejecutar Schema SQL

1. En el proyecto de Supabase, ve a "SQL Editor"
2. Click en "New Query"
3. Copia TODO el contenido de `supabase-schema.sql`
4. Pega en el editor
5. Click en "Run" (abajo a la derecha)
6. Verifica que no haya errores

### 1.3 Configurar Políticas de Seguridad

Las políticas RLS ya están incluidas en el schema, pero verifica:

1. Ve a "Authentication" > "Policies"
2. Deberías ver políticas para:
   - users
   - transactions
   - poll_bets
   - withdrawals
   - cpa_deposits

### 1.4 Obtener Credenciales

1. Ve a "Settings" > "API"
2. Copia:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: La clave pública
   - **service_role key**: Solo para el backend (¡muy secreta!)

## 🔐 PASO 2: Configurar Kick OAuth

Sigue la guía completa en `KICK_OAUTH_SETUP.md`

**Resumen rápido**:
1. Contacta a `developers@kick.com`
2. Solicita credenciales OAuth
3. Proporciona redirect URI: `https://comunidad.slotmasters1k.net/auth/callback`
4. Guarda el `client_id` y `client_secret`

## 🌐 PASO 3: Configurar Dominio

### 3.1 DNS Records

En tu proveedor de dominio (ej: Cloudflare, Namecheap), crea:

**Tipo A Record** (para Vercel):
```
Host: comunidad
Value: 76.76.21.21 (IP de Vercel)
```

O **CNAME Record** (recomendado):
```
Host: comunidad
Value: cname.vercel-dns.com
```

### 3.2 Verificar DNS

```bash
# Linux/Mac
nslookup comunidad.slotmasters1k.net

# Windows
nslookup comunidad.slotmasters1k.net
```

Debería resolver a la IP de Vercel.

## ☁️ PASO 4: Deploy a Vercel

### 4.1 Conectar Repositorio

1. Ve a [Vercel](https://vercel.com)
2. Click en "Add New Project"
3. Importa el repositorio de GitHub
4. Selecciona el repositorio `slotmasters1k-loyalty`

### 4.2 Configurar Variables de Entorno

En Vercel, ve a "Environment Variables" y añade:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

NEXT_PUBLIC_KICK_CLIENT_ID=tu-kick-client-id
KICK_CLIENT_SECRET=tu-kick-client-secret
NEXT_PUBLIC_KICK_REDIRECT_URI=https://comunidad.slotmasters1k.net/auth/callback

NEXT_PUBLIC_APP_URL=https://comunidad.slotmasters1k.net
NEXT_PUBLIC_KICK_CHANNEL=slotmasters1k

ADMIN_SECRET_KEY=genera-una-clave-super-secreta-aqui
```

**Importante**:
- Marca `KICK_CLIENT_SECRET` como "Secret"
- Marca `ADMIN_SECRET_KEY` como "Secret"
- Las variables `NEXT_PUBLIC_*` son públicas (van al frontend)

### 4.3 Configurar Dominio Personalizado

1. En Vercel, ve a "Settings" > "Domains"
2. Click en "Add Domain"
3. Introduce: `comunidad.slotmasters1k.net`
4. Vercel te dará instrucciones de DNS si hace falta
5. Espera a que el dominio se verifique (puede tardar hasta 24h)

### 4.4 Deploy

1. Click en "Deploy"
2. Vercel construirá y desplegará automáticamente
3. Espera a que termine (3-5 minutos)
4. Visita `https://comunidad.slotmasters1k.net`

## ✅ PASO 5: Verificar Deployment

### 5.1 Test Básico

1. Ve a `https://comunidad.slotmasters1k.net`
2. Deberías ver la landing page
3. Click en "Iniciar Sesión con Kick"
4. Autentica con Kick
5. Deberías ser redirigido al dashboard

### 5.2 Test de Base de Datos

1. En el dashboard, verifica que se muestre tu username
2. Los puntos deberían estar en 0
3. Navega a la tienda
4. Deberías ver las recompensas con stock

### 5.3 Test de Transacciones

1. En Supabase, ve a "Table Editor"
2. Abre la tabla `users`
3. Deberías ver tu usuario registrado
4. Verifica que `kick_user_id` y `kick_username` estén correctos

## 🔧 PASO 6: Configuraciones Adicionales

### 6.1 Configurar CORS en Supabase

Si tienes problemas de CORS:

1. Ve a Supabase > "Settings" > "API"
2. En "API Settings", añade tu dominio a "Additional Allowed Origins":
```
https://comunidad.slotmasters1k.net
```

### 6.2 Habilitar RLS (Row Level Security)

Ya está configurado en el schema, pero verifica:

```sql
-- En SQL Editor de Supabase
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Todas las tablas importantes deben tener `rowsecurity = true`.

### 6.3 Configurar Logs

En Vercel:
1. Ve a tu proyecto > "Logs"
2. Filtra por errores
3. Monitorea problemas en tiempo real

## 📊 PASO 7: Configurar el Mining Worker

**IMPORTANTE**: El mining worker se ejecutará en la Fase 2, pero aquí está la preparación:

### 7.1 Crear Cron Job en Supabase

Supabase no tiene cron jobs nativos, así que usaremos servicios externos:

**Opción A: Vercel Cron Jobs** (Recomendado)

Crear archivo `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/mine-points",
    "schedule": "*/10 * * * *"
  }]
}
```

**Opción B: Servicio externo (EasyCron, cron-job.org)**

1. Crea una cuenta en [cron-job.org](https://cron-job.org)
2. Crea un nuevo cron job:
   - **URL**: `https://comunidad.slotmasters1k.net/api/cron/mine-points`
   - **Schedule**: `*/10 * * * *` (cada 10 minutos)
   - **Method**: POST
   - **Header**: `Authorization: Bearer ADMIN_SECRET_KEY`

## 🎯 PASO 8: Inicializar Stock Semanal

### Ejecutar manualmente la primera vez

1. Ve a Supabase SQL Editor
2. Ejecuta:

```sql
SELECT reset_weekly_stock();
```

3. Verifica en Table Editor > `rewards_stock`
4. Deberías ver 5 recompensas con stock completo

## 🔍 PASO 9: Monitoreo y Mantenimiento

### 9.1 Logs de Supabase

1. Ve a "Logs" en Supabase
2. Filtra por tabla para ver actividad
3. Monitorea queries lentas

### 9.2 Analytics de Vercel

1. Ve a "Analytics" en Vercel
2. Monitorea:
   - Page views
   - Errores
   - Performance

### 9.3 Backups de Base de Datos

En Supabase (plan Pro):
- Backups automáticos diarios
- Point-in-time recovery

Plan Free:
- Exportar manualmente 1 vez/semana
- SQL Dump desde Table Editor

## 🐛 Troubleshooting Común

### Error: "Missing Supabase environment variables"

**Solución**: Verifica que todas las variables en Vercel estén configuradas correctamente.

### Error: "redirect_uri mismatch"

**Solución**: El redirect URI en Kick OAuth debe coincidir EXACTAMENTE con el de `.env`.

### Error: CORS policy

**Solución**: Añade tu dominio a "Additional Allowed Origins" en Supabase.

### Las recompensas no aparecen

**Solución**: Ejecuta `SELECT reset_weekly_stock();` en Supabase SQL Editor.

### Los puntos no se actualizan

**Solución**: El mining worker aún no está implementado (Fase 2). De momento los puntos solo cambian con apuestas y canjes.

## 📈 Optimizaciones Post-Deploy

### 1. Habilitar Caching

En Vercel:
- Cache de páginas estáticas: Automático
- Cache de API routes: Configurar headers

### 2. Optimizar Imágenes

Next.js ya optimiza automáticamente, pero puedes:
- Usar WebP
- Lazy loading (ya implementado)

### 3. Monitorear Performance

Herramientas:
- Vercel Analytics
- Google PageSpeed Insights
- WebPageTest

## 🔐 Seguridad Post-Deploy

### Checklist de Seguridad

- [ ] Variables sensibles marcadas como "Secret" en Vercel
- [ ] RLS habilitado en todas las tablas de Supabase
- [ ] HTTPS forzado (automático en Vercel)
- [ ] Rate limiting configurado (API routes)
- [ ] Headers de seguridad configurados

### Headers de Seguridad

Añadir a `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
  ];
}
```

## 📞 Soporte

Si tienes problemas durante el deployment:

1. Revisa los logs de Vercel
2. Revisa los logs de Supabase
3. Contacta al equipo de desarrollo

## ✅ Checklist Final

- [ ] App accesible en `https://comunidad.slotmasters1k.net`
- [ ] Login con Kick funciona
- [ ] Dashboard muestra datos correctos
- [ ] Tienda muestra recompensas
- [ ] Transacciones se registran en Supabase
- [ ] Stock semanal inicializado
- [ ] Variables de entorno configuradas
- [ ] Dominio SSL activo
- [ ] Logs sin errores críticos

---

**¡Felicidades! 🎉 Tu app está en producción.**

Next Steps: Implementar Fase 2 (WebSockets + Apuestas en Vivo)
