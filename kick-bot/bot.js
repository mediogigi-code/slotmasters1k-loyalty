const { createClient } = require('@supabase/supabase-js');
const http = require('http');

// Conexión a la base de datos (Empresa)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let activeUsers = new Set();

// RECEPTOR: Escucha lo que envía la extensión (Casa)
const server = http.createServer(async (req, res) => {
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
        if (username) {
          const user = username.toLowerCase().trim();
          if (!activeUsers.has(user)) {
            activeUsers.add(user);
            console.log(`🎯 [EXTENSIÓN DETECTÓ]: ${user}`);
          }
        }
        res.writeHead(200); res.end('OK');
      } catch (e) { res.writeHead(400); res.end('Error'); }
    });
  } else {
    res.writeHead(200); res.end('Receptor S1K Online');
  }
});

// BALANCE NETO: Suma los puntos en Supabase cada 5 min
async function distributePoints() {
  console.log(`🕒 Procesando puntos para ${activeUsers.size} usuarios...`);
  if (activeUsers.size === 0) return;

  const { data: users } = await supabase.from('users').select('id, kick_username, points_balance');
  
  const updates = users
    .filter(u => u.kick_username && activeUsers.has(u.kick_username.toLowerCase()))
    .map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + 7,
      updated_at: new Date().toISOString()
    }));

  if (updates.length > 0) {
    await supabase.from('users').upsert(updates);
    console.log(`✅ BALANCE NETO: +7 puntos a ${updates.length} usuarios.`);
  }
  activeUsers.clear();
}

// IMPORTANTE: Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Receptor Activo en puerto ${PORT}`);
});

setInterval(distributePoints, 300000); // 5 minutos