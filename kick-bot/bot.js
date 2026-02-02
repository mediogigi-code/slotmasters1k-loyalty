const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const KICK_CHANNEL = 'slotmasters1k';
const CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

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
    if (data.access_token) {
      accessToken = data.access_token;
      console.log('✅ Token oficial obtenido correctamente.');
    }
  } catch (e) {
    console.log('❌ Error de Token. Revisa las variables en Railway.');
  }
}

async function fetchChatMessages() {
  if (!accessToken) return;
  
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL}/messages`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    
    if (data.messages && data.messages.length > 0) {
      data.messages.forEach(msg => {
        activeUsers.add(msg.sender.username);
      });
      console.log(`📡 Scan chat: ${activeUsers.size} usuarios detectados.`);
    }
  } catch (e) {
    console.log('⚠️ Error de lectura API. Reintentando en el próximo ciclo.');
  }
}

async function distributePoints() {
  console.log('🕒 [BALANCE NETO] Iniciando reparto de 5 minutos...');
  
  if (activeUsers.size === 0) {
    console.log('ℹ️ Nadie escribió en el chat. No hay puntos que repartir.');
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
    const { error } = await supabase.from('users').upsert(updates);
    if (!error) console.log(`💰 ÉXITO: +7 puntos a ${updates.length} valientes.`);
  }
  
  activeUsers.clear(); 
}

// ARRANQUE SECUENCIAL
async function init() {
  await getAccessToken();
  console.log('🚀 SISTEMA INICIADO: Escaneando chat cada 30s...');
  
  setInterval(fetchChatMessages, 30000); // Lee el chat
  setInterval(distributePoints, 5 * 60 * 1000); // Reparte puntos
  setInterval(getAccessToken, 50 * 60 * 1000); // Renueva token cada 50 min
}

init();