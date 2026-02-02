const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const KICK_CHANNEL_ID = '2623315'; // Tu ID de canal
const CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

// 1. Obtener Token con los Scopes de tu imagen
async function getAccessToken() {
  try {
    const response = await fetch('https://api.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'chat:read' // El permiso que tienes marcado
      })
    });
    const data = await response.json();
    accessToken = data.access_token;
    console.log('🔑 Token oficial validado por Kick.');
  } catch (e) {
    console.log('❌ Error crítico de credenciales.');
  }
}

// 2. Escuchar el Chat sin fallos
async function listenToChat() {
  if (!accessToken) await getAccessToken();

  try {
    // Consultamos los eventos de mensajes de los últimos 30 segundos
    const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL_ID}/messages`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const result = await response.json();

    // Si hay mensajes, metemos a los usuarios en la lista de reparto
    if (result.data && result.data.messages) {
      result.data.messages.forEach(msg => {
        activeUsers.add(msg.sender.username);
        console.log(`🎯 Usuario fichado: ${msg.sender.username}`);
      });
    }
  } catch (e) {
    console.log('⚠️ Buscando actividad...');
  }
}

// 3. Reparto de Balance Neto (Empresa + Casa)
async function distributePoints() {
  console.log(`🕒 [S1K] Procesando reparto para ${activeUsers.size} usuarios...`);

  if (activeUsers.size === 0) {
    console.log('ℹ️ Nadie ha hablado. Balance Neto sin cambios.');
    return;
  }

  const { data: users } = await supabase.from('users').select('*');
  
  const updates = users
    .filter(u => activeUsers.has(u.kick_username))
    .map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + 7, // 5 Base + 2 Bonus
      updated_at: new Date().toISOString()
    }));

  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log(`✅ Ingresos Totales actualizados para ${updates.length} miembros.`);
  }
  
  activeUsers.clear(); // Limpiamos para el siguiente directo
}

// Arrancamos el motor oficial
async function startBot() {
  await getAccessToken();
  setInterval(listenToChat, 20000); // Escanea cada 20 seg para no perder a nadie
  setInterval(distributePoints, 5 * 60 * 1000); // Reparte cada 5 min
}

startBot();