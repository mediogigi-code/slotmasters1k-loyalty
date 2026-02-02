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
  BASE_POINTS: 5,           
  CHAT_BONUS: 2,            
  SUBSCRIBER_MULTIPLIER: 2, 
  INTERVAL_MINUTES: 5       // Bajado a 5 min para el directo
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
    console.log('✅ Token oficial obtenido');
  } catch (error) {
    console.error('❌ Error Auth:', error.message);
  }
}

// 4. Info del Canal (Corregido para no bloquear)
async function getChannelInfo() {
  if (!accessToken) await getAccessToken();
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    chatRoomId = data.chatroom?.id;
    isLive = data.livestream !== null;
    console.log(`📊 Status: ${isLive ? '🔴 LIVE' : '⚪ OFFLINE'} | ID: ${chatRoomId}`);
    return data;
  } catch (error) {
    console.error('❌ Error API Kick:', error.message);
    return null;
  }
}

// 5. Escuchar Cambios en la Poll
function listenToAdminCommands() {
  supabase
    .channel('admin_commands')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'config' }, payload => {
      if (payload.new.key === 'poll_active') {
        pollActive = payload.new.value === 'true';
        console.log(pollActive ? '🚀 POLL ON' : '🛑 POLL OFF');
      }
    })
    .subscribe();
}

// 6. Conectar al WebSocket (FIXED: Sin bucle de caídas)
async function connectToChat() {
  if (!chatRoomId) {
    await getChannelInfo();
    if (!chatRoomId) return setTimeout(connectToChat, 5000);
  }

  const wsUrl = `wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0`;
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { channel: `chatrooms.${chatRoomId}.v2` }
    }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.event === 'pusher_internal:subscription_succeeded') {
      console.log('✅ CONECTADO AL CHAT Y LISTO');
    }

    if (message.event === 'App\\Events\\ChatMessageEvent') {
      const chatData = JSON.parse(message.data);
      const username = chatData.sender.username;
      const content = chatData.content.toLowerCase().trim();

      console.log(`💬 [${username}]: ${content}`);
      activeUsers.set(username, { lastMessage: Date.now() });

      if (pollActive && (content === 'a' || content === 'b')) {
        if (!currentVotes.has(username)) {
          currentVotes.set(username, content);
          console.log(`🗳️ VOTO: ${username} -> ${content.toUpperCase()}`);
        }
      }
    }
  });

  ws.on('close', () => {
    console.log('🔄 Reconectando chat...');
    setTimeout(connectToChat, 5000);
  });
}

// 7. Repartir Puntos (Balance Neto Forzado)
async function distributePoints() {
  // Quitamos el bloqueo de isLive para asegurar que sume en este directo
  console.log('🕒 Repartiendo puntos a la comunidad...');
  
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

  await supabase.from('users').upsert(updates);
  console.log(`✅ ${updates.length} usuarios actualizados.`);
  activeUsers.clear();
}

// 8. Inicio
async function start() {
  await getAccessToken();
  await getChannelInfo();
  connectToChat();
  listenToAdminCommands();
  setInterval(distributePoints, POINTS_CONFIG.INTERVAL_MINUTES * 60 * 1000);
}

start();