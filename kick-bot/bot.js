const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// 1. Configuración de Variables (Railway)
const KICK_CHANNEL = process.env.KICK_CHANNEL || 'slotmasters1k';
const CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 2. Configuración de Puntos y Poll
const POINTS_CONFIG = {
  BASE_POINTS: 5,           // Puntos base por visualización
  CHAT_BONUS: 2,            // Bonus por actividad
  SUBSCRIBER_MULTIPLIER: 2, // Multiplicador para subs
  INTERVAL_MINUTES: 10      // Cada 10 minutos
};

let chatRoomId = null;
let isLive = false;
let activeUsers = new Map();
let accessToken = null;
let pollActive = false; 
let currentVotes = new Map();

// 3. Obtener Token Oficial
async function getAccessToken() {
  try {
    const response = await fetch('https://api.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'chat:read'
      })
    });
    const data = await response.json();
    accessToken = data.access_token;
    console.log('✅ Token oficial obtenido legalmente');
  } catch (error) {
    console.error('❌ Error de autenticación:', error.message);
  }
}

// 4. Info del Canal
async function getChannelInfo() {
  if (!accessToken) await getAccessToken();
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    chatRoomId = data.chatroom?.id;
    isLive = data.livestream !== null;
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo info:', error.message);
    return null;
  }
}

// 5. Escuchar Cambios en la Poll (Supabase Realtime)
// Esto conecta el botón "Lanzar Poll" de tu web con el Bot
function listenToAdminCommands() {
  supabase
    .channel('admin_commands')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'config' }, payload => {
      if (payload.new.key === 'poll_active') {
        pollActive = payload.new.value === 'true';
        if (pollActive) {
          currentVotes.clear();
          console.log('🚀 POLL ACTIVADA: Empezando a contar votos "a" y "b"');
        } else {
          console.log('🛑 POLL FINALIZADA');
        }
      }
    })
    .subscribe();
}

// 6. Conectar al WebSocket y Gestionar Chat
async function connectToChat() {
  const wsUrl = `wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0`;
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { channel: `chatrooms.${chatRoomId}.v2` }
    }));
    console.log('✅ Escuchando chat de Kick para balance y votos');
  });

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    if (message.event === 'App\\Events\\ChatMessageEvent') {
      const chatData = JSON.parse(message.data);
      const username = chatData.sender.username;
      const content = chatData.content.toLowerCase().trim();

      // Registrar actividad para puntos
      registrarActividad(username);

      // --- LÓGICA DE LA POLL ---
      if (pollActive && (content === 'a' || content === 'b')) {
        if (!currentVotes.has(username)) {
          currentVotes.set(username, content);
          console.log(`🗳️ VOTO: ${username} eligió ${content.toUpperCase()}`);
        }
      }
    }
  });
}

function registrarActividad(username) {
  activeUsers.set(username, { lastMessage: Date.now() });
}

// 7. Repartir Puntos (Balance Neto)
async function distributePoints() {
  if (!isLive) return;
  
  const { data: users } = await supabase.from('users').select('*');
  if (!users) return;

  const updates = users.map(user => {
    let points = POINTS_CONFIG.BASE_POINTS;
    if (activeUsers.has(user.kick_username)) points += POINTS_CONFIG.CHAT_BONUS;
    if (user.is_subscriber) points *= POINTS_CONFIG.SUBSCRIBER_MULTIPLIER;

    return {
      id: user.id,
      points_balance: (user.points_balance || 0) + points,
      updated_at: new Date().toISOString()
    };
  });

  await supabase.upsert(updates);
  activeUsers.clear();
  console.log('✅ Puntos repartidos y balance actualizado');
}

// 8. Inicio
async function start() {
  await getAccessToken();
  await getChannelInfo();
  if (chatRoomId) {
    connectToChat();
    listenToAdminCommands();
    setInterval(distributePoints, POINTS_CONFIG.INTERVAL_MINUTES * 60 * 1000);
  }
}

start();