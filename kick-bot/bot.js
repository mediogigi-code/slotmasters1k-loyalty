const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuración
const KICK_CHANNEL = process.env.KICK_CHANNEL || 'slotmasters1k';
const BOT_USERNAME = process.env.KICK_BOT_USERNAME || 'SlotMasters1kBot';
const BOT_PASSWORD = process.env.KICK_BOT_PASSWORD;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado del bot
let ws = null;
let chatRoomId = null;
let isLive = false;
let activeUsers = new Map(); // username -> { lastMessage: timestamp, messageCount: number }
let botToken = null;

// Configuración de puntos
const POINTS_CONFIG = {
  BASE_POINTS: 5,           // Puntos base por estar viendo
  CHAT_BONUS: 2,            // Bonus por actividad en chat
  SUBSCRIBER_MULTIPLIER: 2, // Multiplicador para suscriptores
  INTERVAL_MINUTES: 10,     // Cada cuántos minutos dar puntos
  MIN_MESSAGE_LENGTH: 10,   // Mínimo caracteres para contar actividad
  MESSAGE_COOLDOWN: 5 * 60 * 1000, // 5 minutos entre mensajes válidos
};

console.log('🤖 SlotMasters1K Points Bot iniciando...');
console.log(`📺 Canal: ${KICK_CHANNEL}`);
console.log(`👤 Bot: ${BOT_USERNAME}`);

// Autenticación del bot
async function authenticateBot() {
  try {
    console.log('🔐 Autenticando bot en Kick...');
    
    const response = await fetch('https://kick.com/api/v2/authentication/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: BOT_USERNAME,
        password: BOT_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error de autenticación: ${response.status}`);
    }

    const data = await response.json();
    botToken = data.token;
    
    console.log('✅ Bot autenticado correctamente');
    return botToken;
  } catch (error) {
    console.error('❌ Error autenticando bot:', error);
    return null;
  }
}

// Obtener info del canal
async function getChannelInfo() {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${KICK_CHANNEL}`);
    const data = await response.json();
    
    chatRoomId = data.chatroom?.id;
    isLive = data.livestream !== null;
    
    console.log(`📡 Canal info: Chat ID=${chatRoomId}, Live=${isLive}`);
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo info del canal:', error);
    return null;
  }
}

// Conectar al WebSocket del chat
async function connectToChat() {
  if (!chatRoomId) {
    console.error('❌ No hay chatRoomId');
    return;
  }

  const wsUrl = `wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false`;
  
  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('✅ Conectado al chat de Kick');
    
    // Suscribirse al canal de chat
    const subscribeMessage = {
      event: 'pusher:subscribe',
      data: {
        auth: '',
        channel: `chatrooms.${chatRoomId}.v2`,
      },
    };
    
    ws.send(JSON.stringify(subscribeMessage));
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.event === 'pusher:connection_established') {
        console.log('🔗 Conexión establecida con Pusher');
      }
      
      if (message.event === 'pusher_internal:subscription_succeeded') {
        console.log('✅ Suscrito al chat correctamente');
      }
      
      if (message.event === 'App\\Events\\ChatMessageEvent') {
        await handleChatMessage(JSON.parse(message.data));
      }
    } catch (error) {
      console.error('Error procesando mensaje:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Error de WebSocket:', error);
  });

  ws.on('close', () => {
    console.log('🔌 Desconectado del chat. Reconectando en 5s...');
    setTimeout(connectToChat, 5000);
  });

  // Ping para mantener la conexión
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: 'pusher:ping', data: {} }));
    }
  }, 30000);
}

// Manejar mensajes del chat
async function handleChatMessage(messageData) {
  const username = messageData.sender?.username;
  const content = messageData.content;
  const isSubscriber = messageData.sender?.identity?.badges?.some(b => b.type === 'subscriber');
  
  if (!username || username === BOT_USERNAME) return;

  // Detectar comando !puntos
  if (content.trim().toLowerCase() === '!puntos') {
    await handlePointsCommand(username);
    return;
  }

  // Registrar actividad en el chat (para bonus de puntos)
  if (content.length >= POINTS_CONFIG.MIN_MESSAGE_LENGTH) {
    const now = Date.now();
    const userData = activeUsers.get(username) || { lastMessage: 0, messageCount: 0 };
    
    // Solo contar si pasó el cooldown
    if (now - userData.lastMessage >= POINTS_CONFIG.MESSAGE_COOLDOWN) {
      activeUsers.set(username, {
        lastMessage: now,
        messageCount: userData.messageCount + 1,
        isSubscriber,
      });
      
      console.log(`💬 Actividad registrada: ${username} (sub: ${isSubscriber})`);
    }
  }
}

// Comando !puntos
async function handlePointsCommand(username) {
  try {
    // Buscar usuario en la base de datos
    const { data: user, error } = await supabase
      .from('users')
      .select('points_balance, kick_username')
      .eq('kick_username', username)
      .single();

    if (error || !user) {
      await sendChatMessage(`@${username} No estás registrado. Visita https://comunidad.slotmasters1k.net para registrarte! 🎮`);
      return;
    }

    const points = user.points_balance || 0;
    await sendChatMessage(`@${username} tienes ${points.toLocaleString()} puntos 💎`);
    
    console.log(`📊 ${username} consultó sus puntos: ${points}`);
  } catch (error) {
    console.error('Error en comando !puntos:', error);
  }
}

// Enviar mensaje al chat
async function sendChatMessage(message) {
  if (!botToken || !chatRoomId) {
    console.error('No se puede enviar mensaje: sin token o chatRoomId');
    return;
  }

  try {
    const response = await fetch(`https://kick.com/api/v2/messages/send/${chatRoomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${botToken}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        content: message,
        type: 'message',
      }),
    });

    if (response.ok) {
      console.log(`📤 Mensaje enviado: ${message}`);
    } else {
      console.error(`Error enviando mensaje: ${response.status}`);
    }
  } catch (error) {
    console.error('Error enviando mensaje al chat:', error);
  }
}

// Verificar si el stream está en vivo
async function checkLiveStatus() {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${KICK_CHANNEL}`);
    const data = await response.json();
    
    const wasLive = isLive;
    isLive = data.livestream !== null;
    
    if (isLive && !wasLive) {
      console.log('🔴 Stream INICIADO');
      await sendChatMessage('¡El sistema de puntos está activo! Gana puntos viendo el stream. Usa !puntos para ver tu saldo 💎');
    } else if (!isLive && wasLive) {
      console.log('⚫ Stream FINALIZADO');
    }
    
    return isLive;
  } catch (error) {
    console.error('Error verificando estado del stream:', error);
    return false;
  }
}

// Acumular puntos automáticamente
async function distributePoints() {
  if (!isLive) {
    console.log('⏸️  Stream no está en vivo, no se distribuyen puntos');
    return;
  }

  console.log('💰 Distribuyendo puntos...');
  
  try {
    // Obtener todos los usuarios registrados
    const { data: users, error } = await supabase
      .from('users')
      .select('id, kick_username, is_subscriber, points_balance');

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return;
    }

    let totalDistributed = 0;
    const updates = [];

    for (const user of users) {
      let points = POINTS_CONFIG.BASE_POINTS;
      
      // Bonus por actividad en chat
      const userActivity = activeUsers.get(user.kick_username);
      if (userActivity && Date.now() - userActivity.lastMessage < POINTS_CONFIG.INTERVAL_MINUTES * 60 * 1000) {
        points += POINTS_CONFIG.CHAT_BONUS;
      }
      
      // Multiplicador para suscriptores
      if (user.is_subscriber) {
        points *= POINTS_CONFIG.SUBSCRIBER_MULTIPLIER;
      }
      
      const newBalance = (user.points_balance || 0) + points;
      
      updates.push({
        id: user.id,
        points_balance: newBalance,
        updated_at: new Date().toISOString(),
      });
      
      totalDistributed += points;
    }

    // Actualizar todos los usuarios
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .upsert(updates);

      if (updateError) {
        console.error('Error actualizando puntos:', updateError);
      } else {
        console.log(`✅ ${updates.length} usuarios recibieron puntos (total: ${totalDistributed})`);
      }
    }

    // Limpiar usuarios inactivos
    activeUsers.clear();
    
  } catch (error) {
    console.error('Error distribuyendo puntos:', error);
  }
}

// Iniciar el bot
async function startBot() {
  console.log('🚀 Iniciando bot...');
  
  // Autenticar bot
  await authenticateBot();
  
  // Obtener info del canal
  await getChannelInfo();
  
  // Conectar al chat
  await connectToChat();
  
  // Verificar estado del stream cada minuto
  setInterval(checkLiveStatus, 60 * 1000);
  
  // Distribuir puntos cada X minutos
  setInterval(distributePoints, POINTS_CONFIG.INTERVAL_MINUTES * 60 * 1000);
  
  console.log('✅ Bot iniciado correctamente');
  console.log(`⏰ Puntos se distribuirán cada ${POINTS_CONFIG.INTERVAL_MINUTES} minutos`);
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

// Iniciar
startBot();
