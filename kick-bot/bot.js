const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http'); // Para mantener el bot vivo

const KICK_CHANNEL_ID = '2623315'; 
const CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

// 1. Servidor mínimo para Railway
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot Operativo');
}).listen(process.env.PORT || 3000);

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
    console.log('🔑 Token validado. El bot ya no se reiniciará.');
  } catch (e) {
    console.log('❌ Error de Token.');
  }
}

async function listenToChat() {
  if (!accessToken) return;
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL_ID}/messages`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const result = await response.json();
    if (result.data && result.data.messages) {
      result.data.messages.forEach(msg => {
        activeUsers.add(msg.sender.username);
        console.log(`🎯 Usuario detectado: ${msg.sender.username}`);
      });
    }
  } catch (e) { console.log('⚠️ Escaneando...'); }
}

async function distributePoints() {
  console.log('🕒 [S1K] Reparto de 5 min iniciado...');
  if (activeUsers.size === 0) return;

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
    console.log(`✅ BALANCE ACTUALIZADO: +7 puntos para ${updates.length} personas.`);
  }
  activeUsers.clear(); 
}

async function startBot() {
  await getAccessToken();
  setInterval(listenToChat, 20000);
  setInterval(distributePoints, 5 * 60 * 1000);
}

startBot();