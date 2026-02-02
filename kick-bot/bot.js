const { createClient } = require('@supabase/supabase-js');

// Configuración rápida de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuramos para que reparta puntos cada 5 min
const POINTS_CONFIG = { 
  BASE_POINTS: 5, 
  SUBSCRIBER_MULTIPLIER: 2, 
  INTERVAL_MINUTES: 5 
};

async function distributePoints() {
  console.log('🕒 [S1K BOT] Iniciando reparto de puntos automático...');
  
  // Traemos a todos los usuarios de la base de datos
  const { data: users, error } = await supabase.from('users').select('*');
  
  if (error || !users) {
    console.log('❌ Error al leer usuarios:', error?.message);
    return;
  }

  const updates = users.map(user => {
    let points = POINTS_CONFIG.BASE_POINTS;
    // Si es sub, le damos el doble (10 puntos)
    if (user.is_subscriber) points *= POINTS_CONFIG.SUBSCRIBER_MULTIPLIER;

    return {
      id: user.id,
      points_balance: (user.points_balance || 0) + points,
      updated_at: new Date().toISOString()
    };
  });

  const { error: upsertError } = await supabase.from('users').upsert(updates);
  
  if (!upsertError) {
    console.log(`✅ BALANCE ACTUALIZADO: ${updates.length} usuarios sumaron puntos.`);
  } else {
    console.log('❌ Error al actualizar balance:', upsertError.message);
  }
}

// Arrancamos el cronómetro de la empresa
console.log('🚀 BOT EN MODO "SOLO PUNTOS" ACTIVADO');
console.log(`Puntos cada ${POINTS_CONFIG.INTERVAL_MINUTES} minutos.`);

// Primer reparto a los 10 segundos de encender, para confirmar que va
setTimeout(distributePoints, 10000);

// Reparto constante cada 5 minutos
setInterval(distributePoints, POINTS_CONFIG.INTERVAL_MINUTES * 60 * 1000);