const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

const CLIENT_ID = '01KGF5XV51TKJN3G9CXSC04TNF';
const CLIENT_SECRET = '1a4be3b2533a45d45e93473915b3200795e32b6196cfb3f6e3d2401956d69387';

// CAMBIO CRÍTICO: El ID real de slotmasters1k
const REAL_CHANNEL_ID = '11690022'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

http.createServer((req, res) => { res.writeHead(200); res.end('S1K System Online'); }).listen(process.env.PORT || 3000);

async function getAccessToken() {
  try {
    const response = await fetch('https://api.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
    });
    const data = await response.json();
    accessToken = data.access_token;
    console.log('✅ TOKEN OK. Vigilando el canal REAL.');
  } catch (e) { console.log('❌ Error de conexión'); }
}

async function listenToChat() {
  if (!accessToken) return;
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${REAL_CHANNEL_ID}/messages`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const result = await response.json();
    const msgs = result.data?.messages || [];
    
    console.log(`🔎 [${new Date().toLocaleTimeString()}] Canal ${REAL_CHANNEL_ID} | Mensajes: ${msgs.length}`);

    if (msgs.length > 0) {
      msgs.forEach(msg => {
        if (!activeUsers.has(msg.sender.username)) {
          activeUsers.add(msg.sender.username);
          console.log(`🎯 [DETECTADO]: ${msg.sender.username}`);
        }
      });
    }
  } catch (e) { }
}

async function distributePoints() {
  console.log('🕒 [Empresa] Procesando Balance Neto...');
  if (activeUsers.size === 0) {
    console.log('ℹ️ Sin actividad para Ingresos Totales.');
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
    console.log(`✅ BALANCE NETO: +7 puntos sumados.`);
  }
  activeUsers.clear();
}

async function init() {
  await getAccessToken();
  setInterval(listenToChat, 10000); 
  setInterval(distributePoints, 300000); 
}
init();