const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

// CONFIGURACIÓN MAESTRA
const CLIENT_ID = '01KGF5XV51TKJN3G9CXSC04TNF';
const CLIENT_SECRET = '1a4be3b2533a45d45e93473915b3200795e32b6196cfb3f6e3d2401956d69387';
const REAL_CHANNEL_ID = '10262419'; // Si el F12 te dio otro número, cámbialo aquí.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

// Mantener vivo el bot en Railway
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('S1K System Online');
});
server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('📡 Servidor Web Activo en puerto ' + (process.env.PORT || 3000));
});

async function getAccessToken() {
  try {
    const response = await fetch('https://api.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
    });
    const data = await response.json();
    if (data.access_token) {
      accessToken = data.access_token;
      console.log('✅ TOKEN OBTENIDO. Vigilando canal...');
    } else {
      console.log('❌ Error de Token: ' + JSON.stringify(data));
    }
  } catch (e) { console.log('❌ Fallo en red: ' + e.message); }
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
    
    const messages = result.data?.messages || [];
    console.log(`🔎 Escaneo: ${messages.length} mensajes en chat.`);

    messages.forEach(msg => {
      const user = msg.sender.username;
      if (!activeUsers.has(user)) {
        activeUsers.add(user);
        console.log(`🎯 [DETECTADO]: ${user}`);
      }
    });
  } catch (e) { console.log('⚠️ Error de lectura'); }
}

async function distributePoints() {
  console.log('🕒 [Empresa] Calculando Balance Neto...');
  if (activeUsers.size === 0) {
    console.log('ℹ️ Sin actividad para Ingresos Totales.');
    return;
  }

  const { data: users } = await supabase.from('users').select('*');
  if (!users) return;

  const updates = users
    .filter(u => activeUsers.has(u.kick_username))
    .map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + 7,
      updated_at: new Date().toISOString()
    }));

  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log(`✅ BALANCE NETO: +7 puntos a ${updates.length} usuarios.`);
  }
  activeUsers.clear();
}

async function init() {
  await getAccessToken();
  setInterval(listenToChat, 15000); 
  setInterval(distributePoints, 300000); 
}

init();