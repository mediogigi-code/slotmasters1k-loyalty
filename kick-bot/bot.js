const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// 1. Configuración de Variables
const KICK_CHANNEL = process.env.KICK_CHANNEL || 'slotmasters1k';
const CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 2. Configuración de Puntos
const POINTS_CONFIG = {
  BASE_POINTS: 5,           
  CHAT_BONUS: 2,            
  SUBSCRIBER_MULTIPLIER: 2, 
  INTERVAL_MINUTES: 5       
};

let chatRoomId = 2623315; 
let activeUsers = new Map();
let accessToken = null;
let pollActive = false; 

// 3. Token
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
    console.log('✅ Token obtenido');
  } catch (e) { console.log('❌ Error Token'); }
}

// 4. Info Canal
async function getChannelInfo() {
  if (!accessToken) await getAccessToken();
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    if (data.chatroom?.id) chatRoomId = data.chatroom.id;
    console.log(`📊 Canal ID: ${chatRoomId}`);
  } catch (e) { console.log('⚠️ Usando ID manual'); }
}

// 5. WebSocket Corregido (Con User-Agent para evitar bloqueos)
async function connectToChat() {
  const wsUrl = `wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0`;
  
  // Añadimos cabeceras para que Kick no nos eche
  const ws = new WebSocket(wsUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

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
      console.log(`💬 [${username}] activo`);
      activeUsers.set(username, { lastMessage: Date.now() });
    }
  });

  ws.on('error', (err) => console.log('❌ Error WS:', err.message));

  ws.on('close', () => {
    console.log('🔄 Reconexión...');
    setTimeout(connectToChat, 5000);
  });
}

// 6. Repartir Puntos
async function distributePoints() {
  console.log('🕒 Repartiendo puntos...');
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
  console.log(`✅ Balance actualizado para ${updates.length} usuarios.`);
  activeUsers.clear();
}

// 7. Inicio
async function start() {
  await getAccessToken();
  await getChannelInfo();
  connectToChat();
  setInterval(distributePoints, POINTS_CONFIG.INTERVAL_MINUTES * 60 * 1000);
}

start();