const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

// 1. CONFIGURACIÓN FORZADA (Tus llaves maestras reales)
const KICK_CHANNEL_ID = '10262419'; 
const CLIENT_ID = '01KGF5XV51TKJN3G9CXSC04TNF';
// Aquí he puesto el secreto nuevo que me pasaste antes:
const CLIENT_SECRET = '1a4be3b2533a45d45e93473915b3200795e32b6196cfb3f6e3d2401956d69387'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Servidor básico
http.createServer((req, res) => { res.writeHead(200); res.end('S1K Bot Active'); }).listen(process.env.PORT || 3000);

async function getAccessToken() {
  console.log('🚀 Arrancando motores del bot...');
  console.log('⏳ Conectando con SECRETO NUEVO (9387)...');
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
      console.log('✅ TOKEN OBTENIDO: El sistema de puntos está listo.');
      return data.access_token;
    } else {
      console.log('❌ Kick sigue rechazando el secreto. Error: ' + JSON.stringify(data));
    }
  } catch (e) { console.log('❌ Error: ' + e.message); }
}

getAccessToken();