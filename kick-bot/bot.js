const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// 1. Configuración
const KICK_CHANNEL = 'slotmasters1k';
const CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();
let accessToken = null;

// 2. Obtener Token (Usando tus credenciales)
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
    return accessToken;
  } catch (e) { console.log('❌ Error de Token oficial'); }
}

// 3. Consultar quién ha escrito (Uso de credenciales para evitar bloqueo)
async function checkChatActivity() {
  if (!accessToken) await getAccessToken();
  
  try {
    // Consultamos los mensajes recientes del chat de forma oficial
    const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL}/messages`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    
    if (data.messages) {
      data.messages.forEach(msg => {
        activeUsers.add(msg.sender.username);
      });
      console.log(`📡 Usuarios activos detectados por API: ${activeUsers.size}`);
    }
  } catch (e) {
    console.log('⚠️ Error consultando mensajes con credenciales.');
  }
}

// 4. Reparto Justo (Solo a los que aparecen en la consulta de arriba)
async function distributePoints() {
  await checkChatActivity(); // Antes de repartir, miramos quién habló

  if (activeUsers.size === 0) {
    console.log('🕒 Nadie detectado en el chat recientemente. No hay reparto.');
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
    console.log(`✅ ${updates.length} usuarios reales premiados.`);
  }
  
  activeUsers.clear(); // Limpiamos para el siguiente ciclo
}

// 5. Ciclo de ejecución
console.log('🚀 BOT OFICIAL CON CREDENCIALES ACTIVADO');
// Chequeamos el chat cada 30 segundos para no perdernos a nadie
setInterval(checkChatActivity, 30000); 
// Repartimos cada 5 minutos
setInterval(distributePoints, 5 * 60 * 1000);