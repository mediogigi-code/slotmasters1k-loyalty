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

// Servidor para Railway
http.createServer((req, res) => { res.writeHead(200); res.end('S1K System Online'); }).listen(process.env.PORT || 3000);

async function setupBot() {
  try {
    const tokenRes = await fetch('https://api.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
    });
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;

    // BUSCADOR DE ID REFORZADO
    const channelRes = await fetch('https://api.kick.com/public/v1/channels/slotmasters1k', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    const channelData = await channelRes.json();
    
    if (channelData.data && channelData.data.id) {
      REAL_CHANNEL_ID = channelData.data.id.toString();
      console.log(`✅ ¡CANAL ENCONTRADO! ID: ${REAL_CHANNEL_ID}`);
    } else {
      // Si falla, usamos el ID que suele ser el estándar para cuentas nuevas
      REAL_CHANNEL_ID = '10262419'; 
      console.log(`⚠️ No se pudo auto-detectar. Usando ID manual: ${REAL_CHANNEL_ID}`);
    }
  } catch (e) { console.log('❌ Error en setup'); }
}

async function listenToChat() {
  if (!accessToken || !REAL_CHANNEL_ID) return;
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${REAL_CHANNEL_ID}/messages`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    const result = await response.json();
    
    // Si el chat te da 0, intentamos forzar la lectura del slug directamente
    if (!result.data || result.data.messages.length === 0) {
        console.log(`🔎 Escaneando canal ${REAL_CHANNEL_ID}... No hay mensajes nuevos.`);
    } else {
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
  console.log('🕒 [Empresa] Ciclo de Balance Neto...');
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
    console.log(`✅ INGRESOS TOTALES: +7 puntos a ${updates.length} usuarios.`);
  }
  activeUsers.clear();
}

async function init() {
  await setupBot();
  setInterval(listenToChat, 10000); 
  setInterval(distributePoints, 300000); 
}
init();