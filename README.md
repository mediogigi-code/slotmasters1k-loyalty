# 🎰 SLOTMASTERS1K LOYALTY APP

Sistema de lealtad y economía de puntos para la comunidad de SlotMasters1K en Kick.

## 📋 Características

### ✅ Fase 1 - IMPLEMENTADA
- ✅ Sistema de autenticación con Kick OAuth
- ✅ Dashboard de usuario con visualización de puntos
- ✅ Tienda de recompensas con stock limitado semanal
- ✅ Sistema de transacciones y historial
- ✅ Configuración de wallet USDT
- ✅ Base de datos PostgreSQL completa (Supabase)

### 🚧 Fase 2 - EN DESARROLLO
- Sistema de apuestas en tiempo real con WebSockets
- Panel de administración
- Mining worker automático

### 📅 Fase 3 - PLANIFICADA
- Módulo de withdrawals USDT
- Sistema CPA de depósitos

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io (para WebSockets)
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Kick OAuth + Supabase Auth
- **Hosting**: Vercel (Frontend) + Railway/Render (Backend WS)

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd slotmasters1k-loyalty
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Kick OAuth
NEXT_PUBLIC_KICK_CLIENT_ID=tu-client-id
KICK_CLIENT_SECRET=tu-client-secret
NEXT_PUBLIC_KICK_REDIRECT_URI=https://comunidad.slotmasters1k.net/auth/callback

# App
NEXT_PUBLIC_APP_URL=https://comunidad.slotmasters1k.net
NEXT_PUBLIC_KICK_CHANNEL=slotmasters1k
```

### 4. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a SQL Editor
3. Copia y pega todo el contenido de `supabase-schema.sql`
4. Ejecuta el script

### 5. Configurar Kick OAuth

#### Paso 1: Registrar aplicación en Kick

1. Ve a [Kick Developer Portal](https://kick.com/developers) (o contacta con soporte de Kick)
2. Crea una nueva aplicación OAuth
3. Configura los redirect URIs:
   - Desarrollo: `http://localhost:3000/auth/callback`
   - Producción: `https://comunidad.slotmasters1k.net/auth/callback`
4. Guarda el `client_id` y `client_secret`

#### Paso 2: Configurar permisos (scopes)

Scopes necesarios:
- `user:read` - Leer información básica del usuario
- `chat:read` - Leer mensajes del chat (para detectar actividad)

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **users** - Usuarios registrados con Kick
- **rewards_stock** - Inventario de recompensas semanal
- **transactions** - Historial de movimientos de puntos
- **polls** - Apuestas en vivo
- **poll_bets** - Apuestas individuales de usuarios
- **withdrawals** - Canjes de recompensas
- **cpa_deposits** - Depósitos para bonos CPA
- **mining_logs** - Registro de minado de puntos

Ver `supabase-schema.sql` para detalles completos.

## 🎮 Sistema de Puntos

### Minado Automático

El sistema ejecuta un "worker" cada 10 minutos que:

1. Verifica si el stream está en vivo
2. Obtiene la lista de usuarios en el chat
3. Asigna puntos:
   - **Base**: 5 puntos
   - **Bonus activo**: +2 puntos si escribió en chat < 10 min
   - **Multiplicador**: x2 si es suscriptor
4. Protección anti-multi-cuenta (IP Shield)

### Fórmula de Puntos

```
puntos_base = 5
bonus_activo = 2 (si last_message < 10 min)
multiplicador = 2 (si es_subscriber)

total = (puntos_base + bonus_activo) × multiplicador
```

### Ejemplo

- Usuario normal viendo: **5 puntos**
- Usuario normal activo en chat: **7 puntos** (5 + 2)
- Suscriptor viendo: **10 puntos** (5 × 2)
- Suscriptor activo: **14 puntos** ((5 + 2) × 2)

## 💰 Sistema de Apuestas

### Cálculo de Cuotas Dinámicas

```javascript
multiplicador_A = (total_apostado_B / total_apostado_A) × 0.95 + 1
multiplicador_B = (total_apostado_A / total_apostado_B) × 0.95 + 1
```

El **0.95** aplica un 5% de "tax" que se quema para controlar inflación.

### Ejemplo

- Total apostado en A: 10,000 pts
- Total apostado en B: 5,000 pts

```
Cuota A = (5000 / 10000) × 0.95 + 1 = 1.475
Cuota B = (10000 / 5000) × 0.95 + 1 = 2.90
```

Si apuestas 1000 pts en B y ganas: **2,900 puntos** (ganancia neta: 1,900)

## 🛍️ Tienda de Recompensas

### Stock Semanal (Reset cada Lunes 00:00)

| Producto | Valor | Stock | Coste | Tipo |
|----------|-------|-------|-------|------|
| Tarjeta Mini | 1€ | 10 | 2,500 pts | Código |
| Tarjeta Bronze | 2€ | 8 | 4,800 pts | Código |
| Tarjeta Silver | 3€ | 3 | 7,000 pts | Código |
| Tarjeta Gold | 5€ | 3 | 11,500 pts | USDT |
| Tarjeta Epic | 10€ | 1 | 22,000 pts | USDT |

**Presupuesto total**: 200€/semana

## 🚀 Deployment

### Frontend (Vercel)

1. Conecta el repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático

### Backend WebSocket (Railway/Render)

El servidor de WebSocket se desplegará en la Fase 2.

## 📱 Responsive Design

La aplicación está completamente optimizada para:
- 📱 Mobile (320px+)
- 💻 Tablet (768px+)
- 🖥️ Desktop (1024px+)

## 🔒 Seguridad

- ✅ Row Level Security (RLS) en Supabase
- ✅ Validación de wallet addresses
- ✅ Protección anti-multi-cuenta (IP Shield)
- ✅ Rate limiting en transacciones
- ✅ Validación de stock antes de canjear

## 📞 Soporte

Para problemas o preguntas:
- Discord: SlotMasters1K
- Email: soporte@slotmasters1k.net

## 📄 Licencia

Propiedad de SlotMasters1K - Todos los derechos reservados

---

**Desarrollado con ❤️ para la comunidad SlotMasters1K**
