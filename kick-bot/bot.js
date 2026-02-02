const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

const KICK_CHANNEL_ID = '10262419'; 
const CLIENT_ID = '01KGF5XV51TKJN3G9CXSC04TNF';
const CLIENT_SECRET = '1a4be3b2533a45d45e93473915b3200795e32b6196cfb3f6e3d2401956d69387'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;
let lastMessageTimestamp = new Date().toISOString(); // Solo mensajes nuevos

http.createServer((req, res) => { res.writeHead(200); res.end('S1K Live'); }).listen(process.env.PORT || 3000);

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
      console.log('✅ RADAR LISTO. Escribe en el chat para probar.');
    }
  } catch (e) { console.log('❌ Error de token'); }
}

async function listenToChat() {
  if (!accessToken) return;
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL_ID}/messages`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const result = await response.json();
    
    if (result.data && result.data.messages) {
      const newMessages = result.data.messages.filter(m => m.created_at > lastMessageTimestamp);
      
      if (newMessages.length > 0) {
        newMessages.forEach(msg => {
          activeUsers.add(msg.sender.username);
          console.log(`🎯 [DETECTADO]: ${msg.sender.username}`);
        });
        lastMessageTimestamp = newMessages[0].created_at; // Actualizamos el puntero
      }
    }
  } catch (e) { console.log('⚠️ Reintentando lectura...'); }
}

async function distributePoints() {
  console.log('🕒 [Empresa] Ciclo de Ingresos Totales...');
  if (activeUsers.size === 0) {
    console.log('ℹ️ Sin actividad reciente.');
    return;
  }
  // Lógica de Supabase igual que antes
  const { data: users } = await supabase.from('users').select('*');
  const updates = users.filter(u => activeUsers.has(u.kick_username)).map(user => ({
    id: user.id,
    points_balance: (user.points_balance || 0) + 7,
    updated_at: new Date().toISOString()
  }));
  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log(`✅ BALANCE ACTUALIZADO para ${updates.length} usuarios.`);
  }
  activeUsers.clear();
}

async function init() {
  await getAccessToken();
  setInterval(listenToChat, 10000);
  setInterval(distributePoints, 300000);
}
init();