const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

const CLIENT_ID = '01KGF5XV51TKJN3G9CXSC04TNF';
const CLIENT_SECRET = '1a4be3b2533a45d45e93473915b3200795e32b6196cfb3f6e3d2401956d69387';

// DATOS EXTRAÍDOS DE TU JSON
const CHANNEL_ID = '10262419';
const CHATROOM_ID = '10108211'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

http.createServer((req, res) => { res.writeHead(200); res.end('S1K System Online'); }).listen(process.env.PORT || 3000);

async function getAccessToken() {
  const response = await fetch('https://api.kick.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
  });
  const data = await response.json();
  accessToken = data.access_token;
  console.log('✅ TOKEN OK. Conectado al Chatroom: ' + CHATROOM_ID);
}

async function listenToChat() {
  if (!accessToken) return;
  try {
    // Usamos el ID del canal para los mensajes
    const response = await fetch(`https://api.kick.com/public/v1/channels/${CHANNEL_ID}/messages`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    const result = await response.json();
    const msgs = result.data?.messages || [];
    
    console.log(`🔎 [${new Date().toLocaleTimeString()}] Escaneo: ${msgs.length} mensajes.`);

    if (msgs.length > 0) {
      msgs.forEach(msg => {
        const user = msg.sender.username;
        if (!activeUsers.has(user)) {
          activeUsers.add(user);
          console.log(`🎯 [DETECTADO]: ${user}`);
        }
      });
    }
  } catch (e) { console.log('⚠️ Error en la lectura'); }
}

async function distributePoints() {
  console.log('🕒 [Empresa] Procesando Balance Neto...');
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
    console.log(`✅ BALANCE NETO: +7 puntos sumados a ${updates.length} personas.`);
  }
  activeUsers.clear();
}

async function init() {
  await getAccessToken();
  setInterval(listenToChat, 10000); 
  setInterval(distributePoints, 300000); 
}
init();