const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();

// CREAMOS EL RECEPTOR (Para que la extensión le hable)
const server = http.createServer(async (req, res) => {
  // Permisos para que tu navegador pueda enviar datos
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'POST' && req.url === '/track') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { username } = JSON.parse(body);
        if (username && !activeUsers.has(username)) {
          activeUsers.add(username);
          console.log(`🎯 [EXTENSIÓN DETECTÓ]: ${username}`);
        }
        res.writeHead(200); res.end('Recibido');
      } catch (e) { res.writeHead(400); res.end('Error'); }
    });
  } else {
    res.writeHead(200); res.end('S1K Sistema de Recepción Online');
  }
});

// REPARTO DE PUNTOS (Balance Neto cada 5 min)
async function distributePoints() {
  console.log('🕒 [Empresa] Procesando Balance Neto...');
  if (activeUsers.size === 0) {
    console.log('ℹ️ Sin actividad nueva.');
    return;
  }

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
    console.log(`✅ BALANCE NETO: +7 puntos sumados a ${updates.length} usuarios detectados.`);
  }
  activeUsers.clear(); // Limpiamos para el siguiente ciclo
}

server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('📡 Receptor de Extensión Activo en el puerto 3000');
});

setInterval(distributePoints, 300000); // 5 minutos