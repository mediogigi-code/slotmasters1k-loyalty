const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

// 1. CONFIGURACIÓN DE IDENTIDAD
const KICK_CHANNEL_ID = '10262419'; // Tu ID real de slotmasters1k
const CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

// 2. MANTENER EL BOT VIVO EN RAILWAY
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('S1K Bot Running');
}).listen(process.env.PORT || 3000);

// 3. OBTENER TOKEN OFICIAL
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
      console.log('🔑 Token validado. Conectando al canal ' + KICK_CHANNEL_ID);
    }
  } catch (e) {
    console.log('❌ Error obteniendo el Token de Kick.');
  }
}

// 4. ESCUCHAR ACTIVIDAD DEL CHAT
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
        console.log(`🎯 [DETECTADO] ${msg.sender.username} ha sumado actividad.`);
      });
    }
  } catch (e) {
    console.log('⚠️ Error de lectura. Reintentando...');
  }
}

// 5. REPARTO DE BALANCE NETO (CADA 5 MINUTOS)
async function distributePoints() {
  console.log('🕒 [BALANCE NETO] Iniciando ciclo de reparto...');
  
  if (activeUsers.size === 0) {
    console.log('ℹ️ Nadie escribió en el chat en estos 5 min.');
    return;
  }

  const { data: users } = await supabase.from('users').select('*');
  
  const updates = users
    .filter(u => activeUsers.has(u.kick_username))
    .map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + 7, // Ingresos para el usuario
      updated_at: new Date().toISOString()
    }));

  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log(`✅ ÉXITO: +7 puntos a ${updates.length} usuarios activos.`);
  }
  
  activeUsers.clear(); // Limpiar lista para el siguiente ciclo
}

// 6. LANZAMIENTO
async function init() {
  await getAccessToken();
  setInterval(listenToChat, 25000); // Mira el chat cada 25 seg
  setInterval(distributePoints, 5 * 60 * 1000); // Reparto cada 5 min
  setInterval(getAccessToken, 45 * 60 * 1000); // Renueva token cada 45 min
}

init();