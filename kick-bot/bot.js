const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const KICK_CHANNEL = 'slotmasters1k';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const POINTS_CONFIG = { BASE_POINTS: 5, CHAT_BONUS: 2, SUBSCRIBER_MULTIPLIER: 2, INTERVAL_MINUTES: 5 };
let chatRoomId = 2623315; 
let activeUsers = new Map();

// 1. WebSocket con PING para que no se cierre
async function connectToChat() {
  // Usamos el cluster de Pusher que usa Kick directamente
  const ws = new WebSocket(`wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  ws.on('open', () => {
    console.log('🔌 Conectando...');
    ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { channel: `chatrooms.${chatRoomId}.v2` }
    }));
    
    // Mantener la conexión viva enviando un ping cada 30 segundos
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'pusher:ping', data: {} }));
      }
    }, 30000);
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.event === 'pusher_internal:subscription_succeeded') {
      console.log('✅ CONECTADO AL CHAT - ESCUCHANDO...');
    }

    if (message.event === 'App\\Events\\ChatMessageEvent') {
      const chatData = JSON.parse(message.data);
      const username = chatData.sender.username;
      console.log(`💬 [${username}] activo`);
      activeUsers.set(username, { lastMessage: Date.now() });
    }
  });

  ws.on('error', (e) => console.log('❌ Error:', e.message));
  ws.on('close', () => {
    console.log('🔄 Reintentando...');
    setTimeout(connectToChat, 5000);
  });
}

// 2. Reparto de Puntos
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
  console.log(`✅ Balance actualizado (${updates.length} personas)`);
  activeUsers.clear();
}

// 3. Inicio
connectToChat();
setInterval(distributePoints, POINTS_CONFIG.INTERVAL_MINUTES * 60 * 1000);