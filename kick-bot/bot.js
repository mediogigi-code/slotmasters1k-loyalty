const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

const CLIENT_ID = '01KGF5XV51TKJN3G9CXSC04TNF';
const CLIENT_SECRET = '1a4be3b2533a45d45e93473915b3200795e32b6196cfb3f6e3d2401956d69387';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;
let REAL_CHANNEL_ID = null;

http.createServer((req, res) => { res.writeHead(200); res.end('S1K System Online'); }).listen(process.env.PORT || 3000);

async function setupBot() {
  console.log('🚀 Iniciando sistema de puntos...');
  try {
    const tokenRes = await fetch('https://api.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
    });
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
    console.log('✅ Conexión con Kick establecida.');

    const channelRes = await fetch('https://api.kick.com/public/v1/channels/slotmasters1k');
    const channelData = await channelRes.json();
    
    if (channelData.data && channelData.data.id) {
      REAL_CHANNEL_ID = channelData.data.id;
      console.log(`📡 Vigilando canal ID: ${REAL_CHANNEL_ID} (slotmasters1k)`);
    }
  } catch (e) { console.log('❌ Error en el arranque: ' + e.message); }
}

async function listenToChat() {
  if (!accessToken || !REAL_CHANNEL_ID) return;
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${REAL_CHANNEL_ID}/messages`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const result = await response.json();
    if (result.data && result.data.messages) {
      result.data.messages.forEach(msg => {
        if (!activeUsers.has(msg.sender.username)) {
          activeUsers.add(msg.sender.username);
          console.log(`🎯 [DETECTADO]: ${msg.sender.username}`);
        }
      });
    }
  } catch (e) { }
}

async function distributePoints() {
  console.log('🕒 [Empresa] Procesando Balance Neto del ciclo...');
  if (activeUsers.size === 0) {
    console.log('ℹ️ Sin actividad en los últimos 5 min.');
    return;
  }
  const { data: users } = await supabase.from('users').select('*');
  const updates = users.filter(u => activeUsers.has(u.kick_username)).map(user => ({
    id: user.id,
    points_balance: (user.points_balance || 0) + 7,
    updated_at: new Date().toISOString()
  }));
  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log(`✅ Ingresos Totales actualizados para ${updates.length} usuarios.`);
  }
  activeUsers.clear();
}

async function init() {
  await setupBot();
  setInterval(listenToChat, 10000);
  setInterval(distributePoints, 300000);
}
init();