const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
let chatRoomId = 2623315; 
let activeUsers = new Set();
let ws;

function connectToChat() {
  if (ws) ws.terminate(); // Cerramos cualquier conexión fantasma antes de empezar

  ws = new WebSocket(`wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0`);

  ws.on('open', () => {
    ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { channel: `chatrooms.${chatRoomId}.v2` }
    }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    // Confirmación de conexión exitosa
    if (message.event === 'pusher_internal:subscription_succeeded') {
       console.log('✅ CONEXIÓN ESTABLECIDA: Escuchando el chat de S1K...');
    }

    if (message.event === 'App\\Events\\ChatMessageEvent') {
      const chatData = JSON.parse(message.data);
      const username = chatData.sender.username;
      activeUsers.add(username);
      console.log(`💬 [${username}] detectado en el chat.`);
    }
  });

  ws.on('error', (e) => console.log('❌ Error de red:', e.message));

  ws.on('close', () => {
    // Si se cierra, esperamos 5 segundos para no saturar a Kick
    setTimeout(connectToChat, 5000);
  });
}

async function distributePoints() {
  if (activeUsers.size === 0) {
    console.log('🕒 Ciclo de 5 min: No hubo mensajes en el chat.');
    return;
  }

  const { data: users } = await supabase.from('users').select('*');
  const updates = users
    .filter(u => activeUsers.has(u.kick_username))
    .map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + 7, 
      updated_at: new Date().toISOString()
    }));

  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log(`✅ BALANCE NETO: +7 puntos para ${updates.length} usuarios activos.`);
  }
  activeUsers.clear(); 
}

connectToChat();
setInterval(distributePoints, 5 * 60 * 1000);