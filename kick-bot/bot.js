const { createClient } = require('@supabase/supabase-js');
const http = require('http');

// Configuración de la base de datos (Empresa)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Usamos un Set para que los Ingresos Totales no se dupliquen
let activeUsers = new Set();

// CREAMOS EL RECEPTOR DE LA EXTENSIÓN
const server = http.createServer(async (req, res) => {
  // Configuración de CORS para permitir que tu navegador (Casa) envíe datos
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder a la solicitud de verificación de Chrome
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Ruta para recibir usuarios desde la extensión
  if (req.method === 'POST' && req.url === '/track') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { username } = JSON.parse(body);
        if (username) {
          const cleanName = username.toLowerCase().trim();
          if (!activeUsers.has(cleanName)) {
            activeUsers.add(cleanName);
            console.log(`🎯 [EXTENSIÓN DETECTÓ]: ${cleanName}`);
          }
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      } catch (e) {
        res.writeHead(400);
        res.end('Error en JSON');
      }
    });
  } else {
    // Página de estado por defecto
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('S1K Receptor Online - Esperando datos de la extensión');
  }
});

// REPARTO DE PUNTOS (Balance Neto cada 5 min)
async function distributePoints() {
  const count = activeUsers.size;
  console.log(`🕒 [Empresa] Procesando Balance Neto para ${count} usuarios...`);
  
  if (count === 0) {
    console.log('ℹ️ Sin actividad en el chat.');
    return;
  }

  try {
    const { data: users, error: fetchError } = await supabase.from('users').select('id, kick_username, points_balance');
    
    if (fetchError) throw fetchError;

    const updates = users
      .filter(u => u.kick_username && activeUsers.has(u.kick_username.toLowerCase()))
      .map(user => ({
        id: user.id,
        points_balance: (user.points_balance || 0) + 7,
        updated_at: new Date().toISOString()
      }));

    if (updates.length > 0) {
      const { error: upsertError } = await supabase.from('users').upsert(updates);
      if (upsertError) throw upsertError;
      console.log(`✅ BALANCE NETO: +7 puntos sumados a ${updates.length} usuarios.`);
    } else {
      console.log('⚠️ Los usuarios detectados no están registrados en la DB.');
    }
  } catch (err) {
    console.error('❌ Error en el proceso de puntos:', err.message);
  } finally {
    activeUsers.clear(); // Limpiamos la lista para el siguiente ciclo
  }
}

// Arrancar el servidor en el puerto dinámico de Railway
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Receptor de Extensión Activo en puerto: ${PORT}`);
});

// Intervalo de 5 minutos
setInterval(distributePoints, 300000);