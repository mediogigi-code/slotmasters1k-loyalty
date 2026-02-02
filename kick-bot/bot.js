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
let REAL_CHANNEL_ID = '10262419'; // Empezamos con el que tenemos

http.createServer((req, res) => { res.writeHead(200); res.end('S1K System Online'); }).listen(process.env.PORT || 3000);

async function setupBot() {
  console.log('🚀 Iniciando rastreo de canal...');
  try {
    const tokenRes = await fetch('https://api.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
    });
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;

    // INTENTO 1: API Pública Estándar
    const res1 = await fetch('https://api.kick.com/public/v1/channels/slotmasters1k', {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    const data1 = await res1.json();
    
    if (data1.data?.id) {
        REAL_CHANNEL_ID = data1.data.id.toString();
        console.log(`✅ ID ENCONTRADO (Método 1): ${REAL_CHANNEL_ID}`);
    } else {
        // INTENTO 2: API Interna (v2)
        const res2 = await fetch('https://kick.com/api/v2/channels/slotmasters1k');
        const data2 = await res2.json();
        if (data2.id) {
            REAL_CHANNEL_ID = data2.id.toString();
            console.log(`✅ ID ENCONTRADO (Método 2): ${REAL_CHANNEL_ID}`);
        } else {
            console.log(`⚠️ No se pudo auto-detectar. Usando: ${REAL_CHANNEL_ID}`);
        }
    }
  } catch (e) { console.log('❌ Error en rastreo, usando ID manual.'); }
}

async function listenToChat() {
  if (!accessToken) return;
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${REAL_CHANNEL_ID}/messages`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'Mozilla/5.0' }
    });
    const result = await response.json();
    
    const msgs = result.data?.messages || [];
    // Este log nos dirá si estamos en el sitio correcto
    console.log(`🔎 [${new Date().toLocaleTimeString()}] Canal ${REAL_CHANNEL_ID} | Mensajes: ${msgs.length}`);

    if (msgs.length > 0) {
      msgs.forEach(msg => {
        if (!activeUsers.has(msg.sender.username)) {
          activeUsers.add(msg.sender.username);
          console.log(`🎯 [DETECTADO]: ${msg.sender.username}`);
        }
      });
    }
  } catch (e) { console.log('⚠️ Error de conexión al chat'); }
}

async function distributePoints() {
  console.log('🕒 [Empresa] Actualizando Balance Neto...');
  if (activeUsers.size === 0) return;
  const { data: users } = await supabase.from('users').select('*');
  const updates = users.filter(u => activeUsers.has(u.kick_username)).map(user => ({
    id: user.id,
    points_balance: (user.points_balance || 0) + 7,
    updated_at: new Date().toISOString()
  }));
  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log('✅ INGRESOS TOTALES SUMADOS.');
  }
  activeUsers.clear();
}

async function init() {
  await setupBot();
  setInterval(listenToChat, 10000); 
  setInterval(distributePoints, 300000); 
}
init();