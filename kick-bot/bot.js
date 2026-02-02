const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// 1. Conexión a Base de Datos
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 2. Configuración de la Empresa
const KICK_CHAT_ID = 2623315; // ID fijo de slotmasters1k
const POINTS_CONFIG = { 
  BASE: 5, 
  BONUS: 2, 
  INTERVAL: 5 * 60 * 1000 // 5 minutos exactos
};

let activeUsers = new Set();
let ws;

// 3. Función de Conexión Robusta
function connectToChat() {
  console.log('🔌 Iniciando conexión al servidor de mensajes...');
  
  ws = new WebSocket(`wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0`);

  ws.on('open', () => {
    // Suscripción al canal de chat
    ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { channel: `chatrooms.${KICK_CHAT_ID}.v2` }
    }));
    console.log('📡 Petición de suscripción enviada...');
  });

  ws.on('message', (data) => {
    const raw = JSON.parse(data.toString());

    // 1. Confirmación de que Kick nos deja entrar
    if (raw.event === 'pusher_internal:subscription_succeeded') {
      console.log('✅ CONECTADO: El bot ya está escuchando el chat correctamente.');
    }

    // 2. Captura de mensajes
    if (raw.event === 'App\\Events\\ChatMessageEvent') {
      const messageData = JSON.parse(raw.data);
      const user = messageData.sender.username;
      
      activeUsers.add(user); // Solo guardamos a los que están presentes
      console.log(`💬 Actividad detectada: [${user}]`);
    }

    // 3. Responder al Ping de Kick para que no nos eche
    if (raw.event === 'pusher:ping') {
      ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
    }
  });

  ws.on('error', (err) => {
    console.error('❌ Error de conexión:', err.message);
  });

  ws.on('close', () => {
    console.log('🔄 Conexión perdida. Reintentando en 10 segundos...');
    setTimeout(connectToChat, 10000);
  });
}

// 4. Reparto de Balance Neto
async function distributePoints() {
  if (activeUsers.size === 0) {
    console.log('🕒 Ciclo terminado: Sin actividad en el chat.');
    return;
  }

  console.log(`💰 Repartiendo puntos a ${activeUsers.size} usuarios activos...`);
  
  const { data: users } = await supabase.from('users').select('*');
  if (!users) return;

  const updates = users
    .filter(u => activeUsers.has(u.kick_username))
    .map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + (POINTS_CONFIG.BASE + POINTS_CONFIG.BONUS),
      updated_at: new Date().toISOString()
    }));

  if (updates.length > 0) {
    const { error } = await supabase.from('users').upsert(updates);
    if (!error) console.log('✅ Balance actualizado en la base de datos.');
  }

  activeUsers.clear(); // Limpiamos para los siguientes 5 min
}

// 5. Arrancar todo
connectToChat();
setInterval(distributePoints, POINTS_CONFIG.INTERVAL);