const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// 1. Configuración de la Empresa
const KICK_CHANNEL = 'slotmasters1k';
const CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

// 2. Obtener Token de Acceso Oficial
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
    accessToken = data.access_token;
    console.log('✅ Token oficial renovado.');
  } catch (e) {
    console.log('❌ Error obteniendo Token. Revisa CLIENT_ID/SECRET en Railway.');
  }
}

// 3. Consultar mensajes (Sustituye al WebSocket bloqueado)
async function fetchChatMessages() {
  if (!accessToken) await getAccessToken();
  
  try {
    const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL}/messages`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    
    if (data.messages && data.messages.length > 0) {
      data.messages.forEach(msg => {
        activeUsers.add(msg.sender.username);
        console.log(`💬 Usuario detectado en API: [${msg.sender.username}]`);
      });
    }
  } catch (e) {
    console.log('⚠️ Error de conexión con API de Kick. Reintentando...');
  }
}

// 4. Reparto de Balance Neto (Cada 5 minutos)
async function distributePoints() {
  console.log('🕒 Iniciando ciclo de 5 min...');
  
  if (activeUsers.size === 0) {
    console.log('ℹ️ No hay actividad real detectada en el chat.');
    return;
  }

  const { data: users } = await supabase.from('users').select('*');
  
  const updates = users
    .filter(u => activeUsers.has(u.kick_username))
    .map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + 7, // 5 base + 2 bonus
      updated_at: new Date().toISOString()
    }));

  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log(`✅ BALANCE NETO ACTUALIZADO: +7 puntos para ${updates.length} presentes.`);
  }
  
  activeUsers.clear(); // Limpiamos para la siguiente ronda
}

// 5. Ejecución Programada
async function start() {
  await getAccessToken();
  console.log('🚀 BOT INICIADO (Modo API Estable)');
  
  // Escaneamos el chat cada 30 segundos
  setInterval(fetchChatMessages, 30000);
  
  // Repartimos puntos cada 5 minutos
  setInterval(distributePoints, 5 * 60 * 1000);
}

start();