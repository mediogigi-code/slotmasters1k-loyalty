const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
let chatRoomId = 2623315; 
let activeUsers = new Set(); // Usuarios que han hablado en este ciclo

function connectToChat() {
  const ws = new WebSocket(`wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0`);

  ws.on('open', () => {
    ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { channel: `chatrooms.${chatRoomId}.v2` }
    }));
    console.log('✅ BOT INDEPENDIENTE CONECTADO: Esperando actividad...');
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    if (message.event === 'App\\Events\\ChatMessageEvent') {
      const chatData = JSON.parse(message.data);
      const username = chatData.sender.username;
      activeUsers.add(username); // Solo añadimos a los presentes
      console.log(`💬 Registro: ${username} está activo.`);
    }
  });

  ws.on('close', () => setTimeout(connectToChat, 5000));
}

async function distributePoints() {
  if (activeUsers.size === 0) return console.log('🕒 Sin actividad en 5 min. No hay reparto.');

  const { data: users } = await supabase.from('users').select('*');
  
  // Reparto: +5 base + 2 bonus solo a los detectados en el Set
  const updates = users
    .filter(u => activeUsers.has(u.kick_username))
    .map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + 7, 
      updated_at: new Date().toISOString()
    }));

  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log(`✅ Balance Neto actualizado para ${updates.length} usuarios reales.`);
  }
  activeUsers.clear(); 
}

connectToChat();
setInterval(distributePoints, 5 * 60 * 1000); // Ciclo de 5 minutos