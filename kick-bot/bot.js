const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// ==================== CONFIGURACIÓN ====================
const CONFIG = {
  KICK_CHANNEL: process.env.KICK_CHANNEL || 'slotmasters1k',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  
  // Sistema de puntos
  BASE_POINTS: 5,
  CHAT_BONUS: 2,
  SUBSCRIBER_MULTIPLIER: 2,
  INTERVAL_MINUTES: 10,
  MIN_MESSAGE_LENGTH: 10,
  MESSAGE_COOLDOWN: 5 * 60 * 1000, // 5 minutos
};

// Supabase client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// Estado del bot
let isLive = false;
let channelId = null;
let chatroomId = null;
let ws = null;
let activeUsers = new Map();
let distributionInterval = null;

console.log('🤖 Kick Bot Server iniciando...');
console.log('📺 Canal:', CONFIG.KICK_CHANNEL);

// ==================== FUNCIONES DE KICK API ====================

async function getChannelInfo() {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${CONFIG.KICK_CHANNEL}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo info del canal:', error.message);
    return null;
  }
}

async function checkIfLive() {
  const channelInfo = await getChannelInfo();
  
  if (!channelInfo) {
    isLive = false;
    return false;
  }
  
  channelId = channelInfo.id;
  chatroomId = channelInfo.chatroom?.id;
  
  const wasLive = isLive;
  isLive = channelInfo.livestream !== null && channelInfo.livestream !== undefined;
  
  if (isLive && !wasLive) {
    console.log('🔴 Stream INICIADO - Sistema de puntos activado');
    startDistribution();
  } else if (!isLive && wasLive) {
    console.log('⚫ Stream FINALIZADO - Sistema de puntos pausado');
    stopDistribution();
    activeUsers.clear();
  }
  
  return isLive;
}

// ==================== WEBSOCKET DE CHAT ====================

function connectToChat() {
  if (!chatroomId) {
    console.warn('⚠️ No hay chatroom ID, esperando...');
    return;
  }
  
  console.log('🔌 Conectando al chat de Kick...');
  
  // Pusher WebSocket para Kick
  const pusherKey = 'eb1d5f283081a78b932c';
  const cluster = 'us2';
  const wsUrl = `wss://ws-${cluster}.pusher.com/app/${pusherKey}?protocol=7&client=js&version=7.0.3&flash=false`;
  
  ws = new WebSocket(wsUrl);
  
  ws.on('open', () => {
    console.log('✅ Conectado al WebSocket de Kick');
    
    // Suscribirse al canal de chat
    const subscribeMessage = {
      event: 'pusher:subscribe',
      data: {
        channel: `chatrooms.${chatroomId}.v2`
      }
    };
    ws.send(JSON.stringify(subscribeMessage));
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Mensaje de chat
      if (message.event === 'App\\Events\\ChatMessageEvent') {
        handleChatMessage(JSON.parse(message.data));
      }
      
      // Pong para mantener conexión
      if (message.event === 'pusher:ping') {
        ws.send(JSON.stringify({ event: 'pusher:pong' }));
      }
    } catch (error) {
      // Ignorar errores de parsing
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error.message);
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket cerrado, reconectando en 5s...');
    ws = null;
    setTimeout(connectToChat, 5000);
  });
}

function handleChatMessage(messageData) {
  try {
    const username = messageData.sender?.username;
    const content = messageData.content;
    
    if (!username || !content) return;
    
    // Ignorar comandos y mensajes cortos
    if (content.startsWith('!') || content.length < CONFIG.MIN_MESSAGE_LENGTH) {
      return;
    }
    
    // Detectar si es suscriptor
    const isSubscriber = messageData.sender?.identity?.badges?.some(
      badge => badge.type === 'subscriber'
    ) || false;
    
    // Registrar actividad
    const now = Date.now();
    const userData = activeUsers.get(username) || { lastMessage: 0, messageCount: 0 };
    
    if (now - userData.lastMessage >= CONFIG.MESSAGE_COOLDOWN) {
      activeUsers.set(username, {
        lastMessage: now,
        messageCount: userData.messageCount + 1,
        isSubscriber
      });
      
      console.log(`💬 ${username} ${isSubscriber ? '⭐' : ''} - actividad registrada`);
    }
  } catch (error) {
    console.error('Error procesando mensaje:', error);
  }
}

// ==================== DISTRIBUCIÓN DE PUNTOS ====================

function startDistribution() {
  if (distributionInterval) return;
  
  console.log(`⏰ Iniciando distribución cada ${CONFIG.INTERVAL_MINUTES} minutos`);
  
  // Primera distribución inmediata
  setTimeout(distributePoints, 60000); // Esperar 1 minuto
  
  // Luego cada X minutos
  distributionInterval = setInterval(
    distributePoints,
    CONFIG.INTERVAL_MINUTES * 60 * 1000
  );
}

function stopDistribution() {
  if (distributionInterval) {
    clearInterval(distributionInterval);
    distributionInterval = null;
    console.log('⏸️ Distribución pausada');
  }
}

async function distributePoints() {
  if (!isLive) {
    console.log('⏸️ Stream no está en vivo, no se distribuyen puntos');
    return;
  }
  
  console.log('💰 Distribuyendo puntos...');
  console.log(`📊 Usuarios activos en chat: ${activeUsers.size}`);
  
  try {
    // Obtener todos los usuarios registrados con kick_username
    const { data: users, error } = await supabase
      .from('users')
      .select('id, kick_username, is_subscriber, points_balance')
      .not('kick_username', 'is', null);
    
    if (error) throw error;
    
    if (!users || users.length === 0) {
      console.warn('⚠️ No hay usuarios con kick_username vinculado');
      return;
    }
    
    let totalDistributed = 0;
    let usersUpdated = 0;
    
    for (const user of users) {
      let points = CONFIG.BASE_POINTS;
      
      // Bonus por actividad en chat
      const userActivity = activeUsers.get(user.kick_username);
      if (userActivity && Date.now() - userActivity.lastMessage < CONFIG.INTERVAL_MINUTES * 60 * 1000) {
        points += CONFIG.CHAT_BONUS;
      }
      
      // Multiplicador para suscriptores
      if (user.is_subscriber || (userActivity && userActivity.isSubscriber)) {
        points *= CONFIG.SUBSCRIBER_MULTIPLIER;
      }
      
      const newBalance = (user.points_balance || 0) + points;
      
      // Actualizar en Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          points_balance: newBalance,
          last_points_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`❌ Error actualizando ${user.kick_username}:`, updateError.message);
        continue;
      }
      
      totalDistributed += points;
      usersUpdated++;
      
      console.log(`  ✅ ${user.kick_username}: +${points} pts (total: ${newBalance})`);
    }
    
    console.log(`✅ Distribución completada: ${totalDistributed} puntos a ${usersUpdated} usuarios`);
    
    // Limpiar usuarios inactivos
    activeUsers.clear();
    
  } catch (error) {
    console.error('❌ Error distribuyendo puntos:', error);
  }
}

// ==================== CICLO PRINCIPAL ====================

async function mainLoop() {
  console.log('🔄 Verificando estado del stream...');
  
  const live = await checkIfLive();
  
  if (live && !ws) {
    connectToChat();
  }
  
  // Siguiente verificación en 1 minuto
  setTimeout(mainLoop, 60 * 1000);
}

// ==================== INICIO ====================

console.log('');
console.log('═══════════════════════════════════════');
console.log('   🤖 Kick Bot Server - SlotMasters1K');
console.log('═══════════════════════════════════════');
console.log('');

// Verificar variables de entorno
if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
  console.error('❌ ERROR: Faltan variables de entorno SUPABASE_URL o SUPABASE_KEY');
  process.exit(1);
}

// Iniciar
mainLoop();

// Mantener proceso vivo
process.on('SIGTERM', () => {
  console.log('👋 Cerrando bot...');
  if (ws) ws.close();
  stopDistribution();
  process.exit(0);
});

console.log('✅ Bot iniciado correctamente');
console.log('📊 Monitoreando canal:', CONFIG.KICK_CHANNEL);
console.log('');
