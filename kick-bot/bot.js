const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

// 1. CONFIGURACIÓN DE IDENTIDAD
const KICK_CHANNEL_ID = '10262419'; 
const CLIENT_ID = '01KGF5XV51TKJN3G9CXSC04TNF';
const CLIENT_SECRET = '1a4be3b2533a45d45e93473915b3200795e32b6196cfb3f6e3d2401956d69387'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

// Servidor para Railway
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('SlotMasters1k Bot Operativo');
}).listen(process.env.PORT || 3000);

// FUNCIÓN PARA REFRESCAR TOKEN
async function getAccessToken() {
  console.log('⏳ Refrescando token de acceso...');
  try {
    const response = await fetch('https://api.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    });
    const data = await response.json();
    if (data.access_token) {
      accessToken = data.access_token;
      console.log('✅ TOKEN ACTUALIZADO. Vigilando canal ' + KICK_CHANNEL_ID);
    }
  } catch (e) { console.log('❌ Error de conexión'); }
}

// ESCUCHAR ACTIVIDAD (Cada 20 segundos)
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
        console.log(`🎯 Actividad: ${msg.sender.username}`);
      });
    }
  } catch (e) { /* Reintento */ }
}

// REPARTO DE BALANCE NETO (Cada 5 minutos)
async function distributePoints() {
  console.log('🕒 [S1K] Calculando Ingresos Totales del ciclo...');
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
    console.log(`✅ BALANCE NETO: +7 puntos para ${updates.length} usuarios activos.`);
  }
  activeUsers.clear();
}

async function init() {
  await getAccessToken();
  setInterval(listenToChat, 20000); // Mira el chat cada 20 seg
  setInterval(distributePoints, 300000); // Reparto cada 5 min
  setInterval(getAccessToken, 3600000); // Renueva token cada hora
}

init();