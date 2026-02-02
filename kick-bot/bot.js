const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

const CLIENT_ID = '01KGF5XV51TKJN3G9CXSC04TNF';
const CLIENT_SECRET = '1a4be3b2533a45d45e93473915b3200795e32b6196cfb3f6e3d2401956d69387';
const CHANNEL_ID = '10262419';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

http.createServer((req, res) => { res.writeHead(200); res.end('S1K Final Bridge'); }).listen(process.env.PORT || 3000);

async function getAccessToken() {
  try {
    const response = await fetch('https://api.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
    });
    const data = await response.json();
    accessToken = data.access_token;
    console.log('✅ TOKEN REGENERADO');
  } catch (e) { console.log('❌ Error Token'); }
}

async function listenToChat() {
  if (!accessToken) return;
  try {
    // CAMBIO CLAVE: Usamos la URL de v2 que es más estable
    const response = await fetch(`https://kick.com/api/v2/channels/slotmasters1k/messages`, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://kick.com/slotmasters1k'
      }
    });
    const result = await response.json();
    
    // La estructura de v2 es distinta: result.data.messages o result.messages
    const messages = result.data?.messages || result.messages || [];
    
    console.log(`🔎 [${new Date().toLocaleTimeString()}] Intento v2 | Mensajes: ${messages.length}`);

    if (messages.length > 0) {
      messages.forEach(msg => {
        const user = msg.sender?.username || msg.username;
        if (user && !activeUsers.has(user)) {
          activeUsers.add(user);
          console.log(`🎯 [DETECTADO]: ${user}`);
        }
      });
    }
  } catch (e) { console.log('⚠️ Error en v2: saltando...'); }
}

async function distributePoints() {
  console.log('🕒 [Empresa] Ciclo Balance Neto...');
  if (activeUsers.size === 0) {
    console.log('ℹ️ Sin actividad.');
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
    console.log(`✅ BALANCE NETO: Ingresos Totales repartidos.`);
  }
  activeUsers.clear();
}

async function init() {
  await getAccessToken();
  setInterval(listenToChat, 10000); 
  setInterval(distributePoints, 300000); 
}
init();