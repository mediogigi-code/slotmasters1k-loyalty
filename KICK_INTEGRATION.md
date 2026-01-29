# 🎮 INTEGRACIÓN CON KICK - GUÍA COMPLETA

Todo lo que necesitas configurar en Kick para que la app funcione.

---

## 📋 RESUMEN RÁPIDO

Para que SlotMasters1K Loyalty funcione necesitas de Kick:

1. ✅ **OAuth Credentials** - Para login de usuarios
2. ✅ **Chat API Access** - Para detectar actividad (Fase 2)
3. ✅ **Channel API Access** - Para saber si estás en vivo
4. ❌ **No necesitas extensión/bot** - Todo es server-side

---

## 1️⃣ KICK OAUTH (FASE 1 - CRÍTICO)

### ¿Para qué sirve?

Permite que los usuarios se autentiquen con su cuenta de Kick sin crear otra contraseña.

### ¿Cómo obtenerlo?

**Actualmente (Enero 2025)** Kick NO tiene un portal público de desarrolladores, así que debes:

1. **Enviar email a:** `developers@kick.com` o `support@kick.com`

2. **Asunto:** "OAuth Application Request for SlotMasters1K Community"

3. **Contenido del email:**

```
Hello Kick Team,

I'm developing a loyalty system for the SlotMasters1K community (kick.com/slotmasters1k) 
and would like to request OAuth 2.0 credentials for user authentication.

APPLICATION DETAILS:
-------------------
Name: SlotMasters1K Loyalty System
Description: Points and rewards system for stream viewers
Channel: slotmasters1k
Website: https://slotmasters1k.net
Community App URL: https://comunidad.slotmasters1k.net

OAUTH REDIRECT URIs:
-------------------
Development: http://localhost:3000/auth/callback
Production: https://comunidad.slotmasters1k.net/auth/callback

REQUIRED SCOPES:
---------------
- user:read (Read basic user information: ID, username, avatar, subscription status)
- chat:read (Read chat messages to track user activity - for Phase 2)

USE CASE:
---------
Our system rewards viewers with points for:
1. Watching live streams (tracked via presence in chat)
2. Active participation (writing in chat)
3. Being a subscriber (2x multiplier)
4. Participating in live polls/predictions

Users authenticate with their Kick account to:
- Access their points balance
- Participate in polls
- Redeem rewards (gift cards, USDT)

The system is designed to increase viewer engagement and retention 
for the slotmasters1k channel.

TECHNICAL DETAILS:
-----------------
- Framework: Next.js 14 + Node.js
- Database: PostgreSQL (Supabase)
- Hosting: SiteGround
- Expected Users: 500-1000 active users
- Traffic: ~10,000 OAuth requests/month

PRIVACY & SECURITY:
------------------
- We only store: user ID, username, avatar, subscription status
- No password storage (OAuth only)
- Data encrypted in transit and at rest
- GDPR compliant
- Users can delete their data anytime

Please let me know if you need any additional information or documentation.

Thank you for your consideration!

Best regards,
[Tu Nombre]
SlotMasters1K Team
Email: soporte@slotmasters1k.net
Kick Channel: kick.com/slotmasters1k
```

4. **Esperar respuesta:** Usualmente 3-7 días laborables

5. **Recibirás:**
   - `client_id` (público, va en frontend)
   - `client_secret` (privado, solo backend)

### ¿Qué hago mientras espero?

Puedes desarrollar localmente usando **credenciales de prueba**. Crea un archivo `.env.local`:

```env
NEXT_PUBLIC_KICK_CLIENT_ID=test-client-id
KICK_CLIENT_SECRET=test-client-secret
```

El login no funcionará, pero puedes trabajar en el resto de la app.

---

## 2️⃣ KICK CHAT API (FASE 2 - IMPORTANTE)

### ¿Para qué sirve?

Para detectar:
- Si el usuario está en el chat (para dar puntos)
- Si el usuario escribió recientemente (bonus +2 pts)
- Timestamp del último mensaje

### Endpoint necesario:

```
GET https://kick.com/api/v1/channels/slotmasters1k/chatters
```

**Respuesta esperada:**
```json
{
  "chatters": [
    {
      "user_id": 12345,
      "username": "usuario123",
      "is_subscriber": true,
      "last_message_at": "2025-01-29T14:30:00Z"
    }
  ]
}
```

### Estado actual:

❓ **No está claro** si Kick tiene este endpoint público. Alternativas:

**Opción A: WebSocket directo al chat**
```javascript
// Conectar al chat de Kick via WebSocket
const ws = new WebSocket('wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c');

ws.send(JSON.stringify({
  event: 'pusher:subscribe',
  data: {
    auth: '',
    channel: `chatrooms.${channelId}.v2`
  }
}));

// Escuchar mensajes
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === 'App\\Events\\ChatMessageEvent') {
    // Procesar mensaje del chat
  }
};
```

**Opción B: Scraping del chat (no recomendado)**
- Más frágil
- Puede romper si Kick cambia HTML
- Posible violación de ToS

**Opción C: Bot de chat oficial de Kick**
- ¿Existe? Necesita investigación
- Similar a Twitch IRC bot

### ¿Qué hacer?

1. **Por ahora:** Implementa la lógica asumiendo que tendrás los datos
2. **En Fase 2:** Investiga qué API/método funciona
3. **Backup plan:** Puntos SOLO por estar autenticado (más simple)

---

## 3️⃣ KICK CHANNEL API (FASE 2 - IMPORTANTE)

### ¿Para qué sirve?

Para saber si el stream está **EN VIVO** antes de dar puntos.

### Endpoint público (FUNCIONA):

```
GET https://kick.com/api/v1/channels/slotmasters1k
```

**Respuesta:**
```json
{
  "id": 123456,
  "username": "slotmasters1k",
  "livestream": {
    "id": 789012,
    "session_title": "Título del stream",
    "is_live": true,
    "viewers": 456
  }
}
```

✅ **Este endpoint es público y no requiere autenticación**

### Implementación:

```javascript
// En el mining worker (Fase 2)
async function isChannelLive() {
  const response = await fetch('https://kick.com/api/v1/channels/slotmasters1k');
  const data = await response.json();
  return data.livestream?.is_live || false;
}
```

---

## 4️⃣ KICK SUBSCRIPTION STATUS

### ¿Para qué sirve?

Para aplicar el multiplicador x2 a suscriptores.

### Cómo obtenerlo:

Se incluye en la respuesta del **OAuth user endpoint**:

```
GET https://kick.com/api/v2/user
Authorization: Bearer {access_token}
```

**Respuesta:**
```json
{
  "id": 12345,
  "username": "usuario123",
  "profile_pic": "https://...",
  "is_subscribed": true  ← ESTO
}
```

✅ **Ya lo tienes con OAuth, no necesitas nada adicional**

---

## 📊 TABLA RESUMEN

| Funcionalidad | API/Servicio | Estado | Fase |
|--------------|--------------|--------|------|
| Login usuarios | Kick OAuth | ❓ Pendiente solicitar | 1 |
| Saber si está live | Channel API | ✅ Público | 2 |
| Estado de sub | OAuth user endpoint | ✅ Incluido en OAuth | 1 |
| Detectar viewers | Chat API/WebSocket | ❓ Investigar | 2 |
| Último mensaje | Chat API/WebSocket | ❓ Investigar | 2 |

---

## 🎯 ACCIÓN INMEDIATA PARA TI

### HOY MISMO:

1. **Envía el email a Kick** solicitando OAuth credentials
   - Usa el template de arriba
   - Menciona tu canal slotmasters1k
   - Explica el use case (loyalty system)

2. **Mientras esperas:**
   - Configura Supabase
   - Sube la app a SiteGround
   - Prueba el resto de funcionalidades

### CUANDO RECIBAS CREDENCIALES:

1. Actualiza `.env.production`:
```env
NEXT_PUBLIC_KICK_CLIENT_ID=tu-client-id-real
KICK_CLIENT_SECRET=tu-client-secret-real
```

2. Rebuild y redeploy:
```bash
npm run build
# Subir a SiteGround
```

3. **¡El login funcionará!** ✅

---

## 🔮 FASE 2: CHAT INTEGRATION

Cuando llegues a Fase 2, tendrás que investigar:

1. **¿Kick tiene Chat API oficial?**
   - Buscar documentación
   - Preguntar al soporte
   - Revisar GitHub de Kick (si existe)

2. **Alternativas:**
   - WebSocket directo (reverse engineering)
   - Polling manual del chat
   - Simplificar: dar puntos solo por estar autenticado

---

## 📞 CONTACTOS ÚTILES

- **OAuth/API:** developers@kick.com
- **Soporte general:** support@kick.com
- **Twitter:** @KickStreaming (para preguntas públicas)

---

## ⚠️ IMPORTANTE

**NO puedes lanzar la app al público SIN las credenciales OAuth de Kick.**

Sin OAuth credentials, los usuarios NO podrán hacer login.

**Timeline estimado:**
- Hoy: Enviar solicitud a Kick
- 3-7 días: Recibir respuesta
- +1 día: Configurar y deployar
- **Total:** ~1 semana para tener login funcionando

---

## 💡 PREGUNTAS FRECUENTES

**P: ¿Puedo usar credenciales "fake" para testing?**
R: Sí localmente, pero el login real no funcionará hasta tener las de Kick.

**P: ¿Qué pasa si Kick rechaza mi solicitud?**
R: Poco probable si tienes un canal legítimo. Si rechazan, pregunta por qué y ajusta.

**P: ¿Puedo lanzar sin el Chat API?**
R: SÍ. Puedes dar puntos de forma más simple (ej: cada hora que estés autenticado).

**P: ¿Necesito pagar algo a Kick?**
R: NO. OAuth es gratuito para aplicaciones legítimas.

---

**¿Necesitas ayuda escribiendo el email a Kick? Te lo puedo adaptar más específicamente.**
