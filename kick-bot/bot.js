const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const http = require('http');

const KICK_CHANNEL_ID = '10262419'; 
const CLIENT_ID = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

http.createServer((req, res) => { res.writeHead(200); res.end('OK'); }).listen(process.env.PORT || 3000);

async function getAccessToken() {
  console.log('🚀 Arrancando motores del bot...');
  console.log('⏳ Intentando conectar con la API de Kick...');
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
      console.log('❌ Kick no dio el token. Revisa CLIENT_ID y SECRET.');
    }
  } catch (e) { console.log('❌ Error: ' + e.message); }
}

getAccessToken();