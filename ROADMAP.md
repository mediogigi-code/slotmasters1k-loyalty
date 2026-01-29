# 🗺️ ROADMAP - SLOTMASTERS1K LOYALTY APP

Plan de desarrollo en 3 fases del sistema de lealtad.

---

## ✅ FASE 1: CORE SYSTEM (COMPLETADA)

**Objetivo**: Estructura base, autenticación y tienda funcional

### Implementado ✅

#### Frontend
- [x] Next.js 14 + TypeScript + Tailwind CSS
- [x] Landing page con diseño premium
- [x] Sistema de autenticación con Kick OAuth
- [x] Dashboard de usuario
  - [x] Tarjeta de puntos con balance
  - [x] Estadísticas rápidas
  - [x] Historial de transacciones
  - [x] Indicador de suscripción
- [x] Tienda de recompensas
  - [x] Grid de productos
  - [x] Stock limitado semanal
  - [x] Sistema de canje
  - [x] Configuración de wallet USDT
  - [x] Contador de reset semanal
- [x] Navegación responsive
- [x] Componentes UI reutilizables

#### Backend
- [x] Schema SQL completo en PostgreSQL (Supabase)
- [x] Tablas:
  - [x] users
  - [x] rewards_stock
  - [x] transactions
  - [x] withdrawals
  - [x] cpa_deposits
  - [x] polls
  - [x] poll_bets
  - [x] mining_logs
- [x] Row Level Security (RLS)
- [x] Funciones SQL (reset_weekly_stock)
- [x] API route para OAuth callback

#### Documentación
- [x] README completo
- [x] Guía de configuración de Kick OAuth
- [x] Guía de deployment
- [x] Schema SQL documentado
- [x] Variables de entorno template

---

## 🚧 FASE 2: REAL-TIME BETTING SYSTEM (EN DESARROLLO)

**Objetivo**: Sistema de apuestas en vivo con WebSockets y panel de admin

### Tareas Pendientes

#### 2.1 Backend WebSocket Server

- [ ] **Servidor Node.js + Socket.io**
  - [ ] Configurar Express + Socket.io
  - [ ] Sistema de rooms por canal
  - [ ] Autenticación de conexiones WebSocket
  - [ ] Rate limiting

- [ ] **Events del WebSocket**
  - [ ] `POLL_CREATED` - Nueva apuesta creada
  - [ ] `POLL_UPDATED` - Actualización de totales
  - [ ] `NEW_BET` - Nueva apuesta individual
  - [ ] `POLL_LOCKED` - Apuesta cerrada
  - [ ] `POLL_RESOLVED` - Ganador anunciado
  - [ ] `MULTIPLIERS_UPDATE` - Cuotas en tiempo real

- [ ] **API Endpoints**
  ```
  POST /api/polls/create      - Crear nueva apuesta
  POST /api/polls/:id/bet     - Realizar apuesta
  POST /api/polls/:id/lock    - Cerrar apuestas
  POST /api/polls/:id/resolve - Declarar ganador
  GET  /api/polls/active      - Obtener apuestas activas
  ```

#### 2.2 Frontend de Apuestas

- [ ] **Página /apuestas**
  - [ ] Lista de apuestas activas
  - [ ] Histórico de apuestas
  - [ ] Mis apuestas

- [ ] **Componente LivePoll**
  - [ ] Visualización de las 2 opciones
  - [ ] Cuotas dinámicas en tiempo real
  - [ ] Input para cantidad a apostar
  - [ ] Botón de confirmar apuesta
  - [ ] Timer de cierre
  - [ ] Animación de resultados

- [ ] **Componente BettingHistory**
  - [ ] Tabla de apuestas pasadas
  - [ ] Filtros (ganadas/perdidas/pendientes)
  - [ ] Estadísticas de rendimiento

#### 2.3 Panel de Administración

- [ ] **Auth de Admin**
  - [ ] Login separado con ADMIN_SECRET_KEY
  - [ ] Protección de rutas con middleware

- [ ] **Dashboard Admin (/admin)**
  - [ ] Estadísticas generales
    - Total usuarios activos
    - Puntos en circulación
    - Presupuesto semanal usado
    - Canjes pendientes
  - [ ] Gráficas de actividad

- [ ] **Gestión de Apuestas (/admin/polls)**
  - [ ] Crear nueva apuesta
  - [ ] Ver apuestas activas
  - [ ] Cerrar apuestas manualmente
  - [ ] Declarar ganador
  - [ ] Cancelar apuesta (reembolso)

- [ ] **Gestión de Canjes (/admin/withdrawals)**
  - [ ] Lista de canjes pendientes
  - [ ] Aprobar/rechazar canjes
  - [ ] Generar códigos de tarjetas
  - [ ] Confirmar envío USDT
  - [ ] Notas administrativas

- [ ] **Gestión de CPA (/admin/cpa)**
  - [ ] Revisar depósitos pendientes
  - [ ] Verificar screenshots
  - [ ] Aprobar/rechazar bonos

- [ ] **Gestión de Usuarios (/admin/users)**
  - [ ] Buscar usuarios
  - [ ] Editar puntos manualmente
  - [ ] Banear/desbanear
  - [ ] Ver historial completo

#### 2.4 Mining Worker

- [ ] **Cron Job cada 10 minutos**
  - [ ] Verificar si stream está en vivo (Kick API)
  - [ ] Obtener lista de viewers en chat
  - [ ] Calcular puntos por usuario:
    ```
    base = 5
    active_bonus = 2 si last_message < 10min
    multiplier = 2 si is_subscriber
    total = (base + active_bonus) × multiplier
    ```
  - [ ] IP Shield (anti multi-cuenta)
  - [ ] Insertar en mining_logs
  - [ ] Actualizar users.points_balance
  - [ ] Crear transactions tipo 'earn'

- [ ] **Integración con Kick Chat API**
  - [ ] Conectar al chat de slotmasters1k
  - [ ] Trackear last_message_timestamp por usuario
  - [ ] Actualizar is_subscriber status

#### 2.5 Deploy Backend

- [ ] **Hosting del servidor WebSocket**
  - [ ] Railway / Render / Fly.io
  - [ ] Variables de entorno
  - [ ] Configuración de dominios
  - [ ] SSL/TLS para WSS

- [ ] **Cron Job Hosting**
  - [ ] Vercel Cron (si es posible)
  - [ ] Alternativa: cron-job.org + API endpoint

### Estimación Fase 2
**Tiempo**: 2-3 semanas
**Prioridad**: Alta

---

## 📅 FASE 3: CRYPTO & CPA SYSTEM (PLANIFICADA)

**Objetivo**: Sistema completo de withdrawals y bonos CPA

### 3.1 Módulo de Withdrawals USDT

- [ ] **Sistema de Pagos Automático**
  - [ ] Integración con wallet USDT del proyecto
  - [ ] API de blockchain (Etherscan/Tronscan)
  - [ ] Verificación de direcciones
  - [ ] Generación de transacciones
  - [ ] Confirmación on-chain

- [ ] **Frontend de Withdrawals**
  - [ ] Vista de canjes pendientes
  - [ ] Estado de transacciones
  - [ ] Historial de pagos
  - [ ] Copiar hash de transacción

- [ ] **Notificaciones**
  - [ ] Email cuando canje es procesado
  - [ ] Email con código de tarjeta
  - [ ] Email con hash de transacción USDT

### 3.2 Sistema CPA (Cost Per Acquisition)

- [ ] **Formulario de Depósito**
  - [ ] Select de casinos disponibles
  - [ ] Input de username en casino
  - [ ] Input de transaction ID
  - [ ] Upload de screenshot
  - [ ] Validación de datos

- [ ] **Verificación Admin**
  - [ ] Viewer de screenshots
  - [ ] Verificación con casinos
  - [ ] Aprobar/rechazar con notas
  - [ ] Bonus automático de 5€ (en puntos)

- [ ] **Tracking de Presupuesto CPA**
  - [ ] Contador separado del presupuesto de 200€
  - [ ] Dashboard de ROI
  - [ ] Estadísticas por casino

### 3.3 Sistema de Notificaciones

- [ ] **Email Service (SendGrid/Resend)**
  - [ ] Templates de emails
  - [ ] Canje aprobado
  - [ ] Código de tarjeta
  - [ ] Transacción USDT
  - [ ] CPA aprobado/rechazado

- [ ] **Notificaciones In-App**
  - [ ] Badge de notificaciones
  - [ ] Popup de avisos
  - [ ] Historial de notificaciones

### 3.4 Mejoras Adicionales

- [ ] **Referral System** (Opcional)
  - [ ] Código de referido único
  - [ ] Bonus por referir amigos
  - [ ] Tracking de conversión

- [ ] **Leaderboard** (Opcional)
  - [ ] Ranking semanal de puntos
  - [ ] Ranking de apuestas ganadas
  - [ ] Premios para top 3

- [ ] **Achievements/Badges** (Opcional)
  - [ ] Sistema de logros
  - [ ] Badges especiales
  - [ ] Recompensas por milestones

### Estimación Fase 3
**Tiempo**: 3-4 semanas
**Prioridad**: Media

---

## 🎯 HITOS DEL PROYECTO

### Q1 2025
- [x] ✅ Fase 1 completa
- [ ] 🚧 Fase 2 iniciada
- [ ] WebSocket server operativo
- [ ] Panel admin funcional

### Q2 2025
- [ ] Fase 2 completa
- [ ] Mining worker activo 24/7
- [ ] Sistema de apuestas en producción
- [ ] Fase 3 iniciada

### Q3 2025
- [ ] Fase 3 completa
- [ ] Withdrawals USDT automáticos
- [ ] Sistema CPA operativo
- [ ] 1000+ usuarios activos

---

## 📊 KPIs y Métricas

### Métricas Técnicas
- Uptime: >99.5%
- Response time API: <200ms
- WebSocket latency: <100ms
- Database queries: <50ms

### Métricas de Negocio
- Usuarios activos semanales: Meta 1000+
- Tasa de retención: Meta >70%
- Canjes completados: Meta 50+/semana
- ROI CPA: Positivo

### Métricas de Comunidad
- Engagement en chat: Incremento del 30%
- Viewers promedio: +20%
- Tiempo de visualización: +15%

---

## 🔄 Sprints Planificados

### Sprint 1 (Semana 1-2) - WebSocket Core
- Servidor Socket.io básico
- Eventos de polls
- Frontend de apuestas

### Sprint 2 (Semana 3-4) - Admin Panel
- Dashboard de admin
- Gestión de polls
- Gestión de withdrawals

### Sprint 3 (Semana 5-6) - Mining Worker
- Worker de puntos
- Integración Kick API
- IP Shield

### Sprint 4 (Semana 7-8) - Polish & Deploy
- Testing completo
- Optimizaciones
- Deploy a producción

---

## 🛠️ Stack Tecnológico Completo

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Socket.io Client
- Recharts (gráficas)

### Backend
- Node.js + Express
- Socket.io Server
- PostgreSQL (Supabase)
- Cron Jobs

### Infraestructura
- Vercel (Frontend)
- Railway/Render (WebSocket)
- Supabase (Database)
- CloudFlare (DNS)

### Servicios Externos
- Kick OAuth
- Kick Chat API
- Email Service (SendGrid)
- Blockchain APIs (Etherscan/Tronscan)

---

## 📞 Contacto del Equipo

**Tech Lead**: Pepe
**Stakeholders**: Ángel (Founder/Streamer), Rui (Partner PT)

**Próxima reunión de sprint**: Definir fechas

---

**Status Actual**: ✅ FASE 1 COMPLETA - Listo para Fase 2

**Próximo Objetivo**: Implementar WebSocket Server + Panel Admin
