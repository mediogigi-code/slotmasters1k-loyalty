# 🔐 GUÍA DE CONFIGURACIÓN KICK OAUTH

Esta guía te ayudará a configurar la autenticación OAuth de Kick para tu aplicación SlotMasters1K Loyalty.

## 📋 Requisitos Previos

- Cuenta de Kick verificada
- Acceso al canal de SlotMasters1K
- Dominio configurado: `comunidad.slotmasters1k.net`

## 🚀 Paso 1: Registrar la Aplicación en Kick

### Opción A: Portal de Desarrolladores (Si está disponible)

1. Ve a [Kick Developer Portal](https://kick.com/developers)
2. Inicia sesión con tu cuenta de Kick
3. Click en "Create New Application"
4. Rellena el formulario:

```
Application Name: SlotMasters1K Loyalty System
Description: Sistema de lealtad y puntos para la comunidad SlotMasters1K
Website URL: https://slotmasters1k.net
```

### Opción B: Contactar con Kick Support (Método actual)

**IMPORTANTE**: A fecha de enero 2025, Kick no tiene un portal público de desarrolladores. Debes contactar con su equipo:

1. Envía un email a: `developers@kick.com` o `support@kick.com`

2. Usa este template:

```
Subject: OAuth Application Request for SlotMasters1K

Hello Kick Team,

I'm developing a loyalty system for the SlotMasters1K community and would like to request OAuth credentials for my application.

Application Details:
- Name: SlotMasters1K Loyalty System
- Description: Points and rewards system for stream viewers
- Channel: slotmasters1k
- Website: https://slotmasters1k.net
- Community App URL: https://comunidad.slotmasters1k.net

OAuth Redirect URIs needed:
- Development: http://localhost:3000/auth/callback
- Production: https://comunidad.slotmasters1k.net/auth/callback

Required Scopes:
- user:read (Read basic user information)
- chat:read (Read chat messages to track activity)

Use Case:
Our system rewards viewers with points for watching streams and participating in chat. Users authenticate with their Kick account to access the loyalty program, participate in live polls, and redeem rewards.

Please let me know what additional information you need.

Best regards,
[Tu Nombre]
SlotMasters1K Team
```

3. Espera la respuesta (usualmente 3-7 días)

4. Recibirás:
   - `Client ID` (público)
   - `Client Secret` (privado - ¡NUNCA lo compartas!)

## 🔧 Paso 2: Configurar Redirect URIs

Los redirect URIs son las URLs a las que Kick redirigirá después de la autenticación.

### Para Desarrollo

```
http://localhost:3000/auth/callback
```

### Para Producción

```
https://comunidad.slotmasters1k.net/auth/callback
```

**IMPORTANTE**: 
- Los URIs deben coincidir EXACTAMENTE (incluyendo http/https)
- No incluyas parámetros query (?param=value)
- No incluyas hash (#section)

## 🔑 Paso 3: Configurar Variables de Entorno

Una vez tengas las credenciales, actualiza tu archivo `.env.local`:

```env
# Kick OAuth Credentials
NEXT_PUBLIC_KICK_CLIENT_ID=tu_client_id_aqui
KICK_CLIENT_SECRET=tu_client_secret_aqui

# Redirect URI (debe coincidir con lo registrado)
NEXT_PUBLIC_KICK_REDIRECT_URI=https://comunidad.slotmasters1k.net/auth/callback

# Para desarrollo usa:
# NEXT_PUBLIC_KICK_REDIRECT_URI=http://localhost:3000/auth/callback
```

## 🎯 Paso 4: Solicitar Scopes Necesarios

### Scopes Requeridos

```
user:read
```

Este scope permite:
- Leer ID del usuario
- Leer username
- Leer avatar/profile picture
- Ver si el usuario es suscriptor

### Scopes Adicionales (Opcionales)

Si Kick los ofrece en el futuro:

```
chat:read - Para leer mensajes del chat y detectar actividad
channel:read - Para verificar si el stream está en vivo
```

## 🔐 Flujo de Autenticación OAuth

### 1. Usuario hace click en "Iniciar Sesión"

La app redirige a:
```
https://kick.com/oauth2/authorize?
  client_id=TU_CLIENT_ID&
  redirect_uri=https://comunidad.slotmasters1k.net/auth/callback&
  response_type=code&
  scope=user:read
```

### 2. Usuario autoriza en Kick

Kick muestra una pantalla pidiendo permiso para acceder a la información del usuario.

### 3. Kick redirige con código

```
https://comunidad.slotmasters1k.net/auth/callback?code=AUTHORIZATION_CODE
```

### 4. Tu servidor intercambia el código por token

```javascript
POST https://kick.com/oauth2/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "client_id": "TU_CLIENT_ID",
  "client_secret": "TU_CLIENT_SECRET",
  "code": "AUTHORIZATION_CODE",
  "redirect_uri": "https://comunidad.slotmasters1k.net/auth/callback"
}
```

### 5. Kick responde con access token

```json
{
  "access_token": "ACCESS_TOKEN_AQUI",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "REFRESH_TOKEN_AQUI",
  "scope": "user:read"
}
```

### 6. Usar el token para obtener datos del usuario

```javascript
GET https://kick.com/api/v2/user
Authorization: Bearer ACCESS_TOKEN_AQUI
```

Respuesta:
```json
{
  "id": 12345,
  "username": "usuario_kick",
  "slug": "usuario_kick",
  "profile_pic": "https://...",
  "is_subscribed": false
}
```

## 🛡️ Seguridad

### ✅ HACER
- Guardar `client_secret` solo en el servidor (variables de entorno)
- Validar el `state` parameter para prevenir CSRF
- Usar HTTPS en producción
- Verificar que el redirect_uri coincida exactamente

### ❌ NO HACER
- Exponer `client_secret` en el código frontend
- Compartir las credenciales públicamente
- Usar HTTP en producción
- Hardcodear credenciales en el código

## 🧪 Probar la Integración

### En Desarrollo (localhost)

1. Asegúrate de usar el redirect URI de desarrollo:
```env
NEXT_PUBLIC_KICK_REDIRECT_URI=http://localhost:3000/auth/callback
```

2. Inicia el servidor:
```bash
npm run dev
```

3. Ve a `http://localhost:3000`

4. Click en "Iniciar Sesión con Kick"

5. Autoriza la aplicación en Kick

6. Deberías ser redirigido a `/dashboard`

### En Producción

1. Configura el redirect URI de producción en `.env`

2. Deploy a Vercel/tu hosting

3. Prueba el flujo completo

## 🐛 Solución de Problemas

### Error: "redirect_uri mismatch"

- Verifica que el URI en `.env` coincida EXACTAMENTE con el registrado en Kick
- Incluye/excluye `www.` según corresponda
- Verifica http vs https

### Error: "invalid_client"

- Verifica que `client_id` y `client_secret` sean correctos
- Asegúrate de que estén en las variables de entorno

### Error: "access_denied"

- El usuario canceló la autorización
- Vuelve a intentar el login

### La API de Kick no responde

- Verifica que la URL del endpoint sea correcta
- Comprueba que el token sea válido
- Revisa que los headers estén correctos

## 📞 Soporte de Kick

Si tienes problemas con OAuth:

- **Email**: developers@kick.com o support@kick.com
- **Discord**: Kick Official (si tienen servidor público)
- **Documentación**: https://docs.kick.com (cuando esté disponible)

## 📚 Recursos Adicionales

- [Especificación OAuth 2.0](https://oauth.net/2/)
- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)

---

**¿Necesitas ayuda?** Contacta con el equipo de SlotMasters1K
