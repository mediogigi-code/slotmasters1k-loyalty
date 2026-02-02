# 🤖 Kick Bot Server - SlotMasters1K

Bot servidor que corre 24/7 en Railway para distribución automática de puntos.

## 🎯 Características

- ✅ Conexión automática a eventos de Kick
- ✅ Detección de stream en vivo
- ✅ Monitoreo del chat en tiempo real
- ✅ Distribución automática de puntos cada 10 minutos
- ✅ Bonus por actividad en chat
- ✅ Multiplicador x2 para suscriptores
- ✅ Reconexión automática si se cae

## 📊 Sistema de Puntos

**Cada 10 minutos (solo cuando el stream está en vivo):**
- **5 puntos** base (por estar viendo)
- **+2 puntos** bonus (si escribió en el chat)
- **x2 multiplicador** (si es suscriptor)

**Ejemplos:**
- Viewer normal: 5 pts
- Viewer activo: 7 pts (5 + 2)
- Suscriptor: 10 pts (5 × 2)
- Suscriptor activo: 14 pts ((5 + 2) × 2)

## 🚀 Instalación en Railway

### 1. Crear nuevo servicio

En tu proyecto de Railway:
1. Click en **"+ New"**
2. Selecciona **"Empty Service"**
3. Nombre: `kick-bot-server`

### 2. Conectar con GitHub

1. En el servicio, click en **"Settings"**
2. **"Connect Repo"** → Selecciona tu repo
3. **"Root Directory"**: `/kick-bot` (o donde subas estos archivos)
4. **"Watch Paths"**: `/kick-bot/**`

### 3. Variables de entorno

En **"Variables"**, añade:

```
KICK_CHANNEL=slotmasters1k
SUPABASE_URL=https://tougduqztbrgysvvfjgp.supabase.co
SUPABASE_KEY=tu_supabase_anon_key
```

### 4. Desplegar

```bash
# En tu proyecto local
mkdir kick-bot
cp bot.js kick-bot/
cp package.json kick-bot/

git add kick-bot/
git commit -m "Add Kick bot server"
git push
```

Railway lo detectará y desplegará automáticamente.

## 📝 Logs

Para ver los logs del bot:
1. Ve a Railway
2. Click en el servicio `kick-bot-server`
3. Click en **"Deployments"**
4. Click en el último deployment
5. Verás logs en tiempo real

**Logs importantes:**
```
🔴 Stream INICIADO - Sistema de puntos activado
⚫ Stream FINALIZADO - Sistema de puntos pausado
💬 username ⭐ - actividad registrada
💰 Distribuyendo puntos...
  ✅ username: +7 pts (total: 507)
✅ Distribución completada: 26 puntos a 3 usuarios
```

## 🔧 Configuración

En `bot.js` puedes ajustar:

```javascript
const CONFIG = {
  BASE_POINTS: 5,              // Puntos base
  CHAT_BONUS: 2,               // Bonus por chat
  SUBSCRIBER_MULTIPLIER: 2,    // Multiplicador subs
  INTERVAL_MINUTES: 10,        // Intervalo de distribución
  MIN_MESSAGE_LENGTH: 10,      // Longitud mínima de mensaje
  MESSAGE_COOLDOWN: 5 * 60 * 1000  // Cooldown entre mensajes
};
```

## ⚠️ Importante

- El bot necesita que los usuarios tengan `kick_username` vinculado en Supabase
- Usa el panel admin (`/admin`) para vincular usernames de Kick
- El bot solo da puntos cuando el stream está en vivo
- Si el bot se cae, Railway lo reinicia automáticamente

## 🐛 Troubleshooting

### Bot no conecta al chat
- Verifica que el canal existe en Kick
- Revisa los logs para ver errores
- El bot reintenta cada 5 segundos

### No se distribuyen puntos
- Verifica que el stream esté en vivo
- Verifica que los usuarios tengan `kick_username` en Supabase
- Revisa los logs para ver si hay errores de Supabase

### Bot se desconecta
- Railway lo reinicia automáticamente
- Verifica los logs para ver la causa

## 📊 Monitoreo

El bot imprime logs cada vez que:
- Detecta que el stream inicia/termina
- Un usuario escribe en el chat
- Distribuye puntos (cada 10 minutos)
- Hay un error

## 🎮 Funcionamiento

1. Bot verifica cada minuto si el stream está en vivo
2. Cuando detecta stream en vivo:
   - Se conecta al chat de Kick
   - Empieza a monitorear mensajes
   - Cada 10 minutos distribuye puntos
3. Cuando el stream termina:
   - Pausa la distribución
   - Limpia el registro de actividad
   - Sigue monitoreando para el próximo stream

## 🔐 Seguridad

- Usa variables de entorno para credenciales
- Nunca expongas tu SUPABASE_KEY en el código
- El bot solo tiene permisos de lectura del chat
- No puede enviar mensajes ni ejecutar comandos de moderador
