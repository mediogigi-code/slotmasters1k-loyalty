# 🤖 SlotMasters1K Kick Bot

Bot automático para acumulación de puntos y comandos de chat en Kick.

## ✨ Características

- ✅ **Acumulación automática de puntos** cada 10 minutos
- ✅ **Comando `!puntos`** para consultar saldo desde el chat
- ✅ **Detección de actividad en chat** (bonus +2 puntos)
- ✅ **Multiplicador x2 para suscriptores**
- ✅ **Anti-spam** (mínimo 10 caracteres, cooldown de 5min)
- ✅ **Detección automática de stream en vivo**

## 📋 Sistema de Puntos

### Acumulación cada 10 minutos:
- **5 puntos** base por estar viendo el stream
- **+2 puntos** bonus si escribió en el chat (mensaje válido)
- **x2 multiplicador** si es suscriptor

### Ejemplos:
- Viewer normal (solo viendo): **5 pts**
- Viewer activo (escribió en chat): **7 pts** (5 + 2)
- Suscriptor (solo viendo): **10 pts** (5 × 2)
- Suscriptor activo: **14 pts** ((5 + 2) × 2)

### Anti-spam:
- Solo mensajes con **mínimo 10 caracteres**
- **Cooldown de 5 minutos** entre mensajes válidos
- Ignora comandos del tipo `!claim`, `!puntos`, etc.

## 🚀 Deployment en Railway

### 1. Variables de entorno necesarias:

```env
# Kick Bot
KICK_CHANNEL=slotmasters1k
KICK_BOT_USERNAME=SlotMasters1kBot
KICK_BOT_PASSWORD=620860Domin@

# Supabase (las mismas de la web)
NEXT_PUBLIC_SUPABASE_URL=https://tougduqztbrgysvvfjgp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. Crear servicio en Railway:

1. En Railway, click en **"+ New"** → **"Empty Service"**
2. Conectar este repositorio (carpeta `kick-bot`)
3. Railway detectará automáticamente Node.js
4. Añadir las variables de entorno
5. Deploy automático

### 3. Verificar que funciona:

En los logs de Railway deberías ver:
```
🤖 SlotMasters1K Points Bot iniciando...
📺 Canal: slotmasters1k
👤 Bot: SlotMasters1kBot
🔐 Autenticando bot en Kick...
✅ Bot autenticado correctamente
📡 Canal info: Chat ID=12345, Live=false
✅ Conectado al chat de Kick
✅ Bot iniciado correctamente
⏰ Puntos se distribuirán cada 10 minutos
```

## 💬 Comandos disponibles

### Para viewers:
- **`!puntos`** - Muestra tu saldo de puntos actual

### Respuestas del bot:
- `@username tienes 2,450 puntos 💎` - Usuario registrado
- `@username No estás registrado. Visita https://comunidad.slotmasters1k.net para registrarte! 🎮` - Usuario sin cuenta

## 🔧 Desarrollo local

```bash
# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales

# Iniciar bot
npm start

# Modo desarrollo (con auto-reload)
npm run dev
```

## 📊 Logs importantes

El bot registra:
- ✅ Conexión/desconexión del chat
- 🔴/⚫ Inicio/fin de stream
- 💬 Actividad de usuarios (mensajes válidos)
- 💰 Distribución de puntos cada 10min
- 📊 Consultas de puntos con `!puntos`

## ⚠️ Notas

- El bot solo distribuye puntos cuando el **stream está en vivo**
- Los puntos se guardan automáticamente en Supabase
- Si el stream termina, el bot deja de distribuir puntos hasta el próximo stream
- El bot se reconecta automáticamente si pierde conexión

## 🐛 Troubleshooting

### El bot no responde en el chat:
- Verificar que `KICK_BOT_USERNAME` y `KICK_BOT_PASSWORD` son correctos
- Verificar que el bot está autenticado (revisar logs)

### No se acumulan puntos:
- Verificar que el stream está **en vivo**
- Verificar conexión con Supabase
- Revisar logs de errores

### Usuarios no aparecen:
- Deben estar registrados en la web primero
- Verificar que `kick_username` coincide con el nombre en Kick
