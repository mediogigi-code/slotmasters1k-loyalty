/**
 * 🤖 SlotMasters1K - Script de Acumulación de Puntos
 * 
 * INSTRUCCIONES:
 * 1. Abre Kick.com/slotmasters1k en tu navegador
 * 2. Abre la consola del navegador (F12 → Console)
 * 3. Pega TODO este script y presiona Enter
 * 4. El script se ejecutará automáticamente mientras estés en vivo
 * 
 * IMPORTANTE: Mantén esta pestaña abierta mientras streameas
 */

(function() {
  'use strict';
  
  // ==================== CONFIGURACIÓN ====================
  const CONFIG = {
    SUPABASE_URL: 'https://tougduqztbrgysvvfjgp.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdWdkdXF6dGJyZ3lzdnZmamdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDI2MTAsImV4cCI6MjA4NTI3ODYxMH0.tnMVz6jlrLhMD0EJg3SZizc7aJnUNbcMhQyG0V2HLCw',
    
    CHANNEL_NAME: 'slotmasters1k',
    
    // Sistema de puntos
    BASE_POINTS: 5,
    CHAT_BONUS: 2,
    SUBSCRIBER_MULTIPLIER: 2,
    INTERVAL_MINUTES: 10,
    MIN_MESSAGE_LENGTH: 10,
    MESSAGE_COOLDOWN: 5 * 60 * 1000, // 5 minutos
  };
  
  // ==================== ESTADO ====================
  let isRunning = false;
  let isLive = false;
  let activeUsers = new Map();
  let intervalId = null;
  let chatObserver = null;
  
  console.log('🤖 SlotMasters1K Points Bot cargado');
  console.log('📺 Canal:', CONFIG.CHANNEL_NAME);
  console.log('⏰ Distribución de puntos cada', CONFIG.INTERVAL_MINUTES, 'minutos');
  
  // ==================== SUPABASE CLIENT ====================
  class SupabaseClient {
    constructor(url, key) {
      this.url = url;
      this.key = key;
      this.headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };
    }
    
    async query(table, options = {}) {
      let url = `${this.url}/rest/v1/${table}`;
      const params = new URLSearchParams();
      
      if (options.select) params.append('select', options.select);
      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
      }
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });
      
      if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
      return await response.json();
    }
    
    async update(table, data, match) {
      let url = `${this.url}/rest/v1/${table}`;
      const params = new URLSearchParams();
      
      if (match) {
        Object.entries(match).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
      }
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
      return await response.json();
    }
  }
  
  const supabase = new SupabaseClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  
  // ==================== DETECCIÓN DE ESTADO ====================
  function checkIfLive() {
    // Buscar indicadores de que el stream está en vivo
    const liveIndicators = [
      document.querySelector('[data-live="true"]'),
      document.querySelector('.live-badge'),
      document.querySelector('.streaming-indicator'),
      Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent.toLowerCase().includes('live') || 
        el.textContent.toLowerCase().includes('en vivo')
      )
    ];
    
    const wasLive = isLive;
    isLive = liveIndicators.some(el => el !== null);
    
    if (isLive && !wasLive) {
      console.log('🔴 Stream INICIADO - Sistema de puntos activado');
    } else if (!isLive && wasLive) {
      console.log('⚫ Stream FINALIZADO - Sistema de puntos pausado');
      activeUsers.clear();
    }
    
    return isLive;
  }
  
  // ==================== DETECCIÓN DE CHAT ====================
  function observeChat() {
    // Buscar el contenedor de mensajes del chat
    const chatContainer = document.querySelector('[class*="chat"]') || 
                         document.querySelector('[class*="message"]') ||
                         document.querySelector('#chatroom');
    
    if (!chatContainer) {
      console.warn('⚠️ No se encontró el contenedor del chat, reintentando...');
      setTimeout(observeChat, 5000);
      return;
    }
    
    console.log('✅ Chat detectado, monitoreando mensajes...');
    
    // Observar nuevos mensajes
    chatObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            processChatMessage(node);
          }
        });
      });
    });
    
    chatObserver.observe(chatContainer, {
      childList: true,
      subtree: true
    });
  }
  
  function processChatMessage(messageElement) {
    try {
      // Extraer información del mensaje
      const usernameEl = messageElement.querySelector('[class*="username"]') ||
                        messageElement.querySelector('[data-username]');
      const contentEl = messageElement.querySelector('[class*="content"]') ||
                       messageElement.querySelector('[class*="message-text"]');
      
      if (!usernameEl || !contentEl) return;
      
      const username = usernameEl.textContent.trim().replace('@', '');
      const content = contentEl.textContent.trim();
      
      // Verificar si es un mensaje válido (no comando, longitud mínima)
      if (content.startsWith('!') || content.length < CONFIG.MIN_MESSAGE_LENGTH) {
        return;
      }
      
      // Detectar si es suscriptor
      const badgesEl = messageElement.querySelector('[class*="badge"]');
      const isSubscriber = badgesEl && badgesEl.textContent.toLowerCase().includes('sub');
      
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
  async function distributePoints() {
    if (!isLive) {
      console.log('⏸️ Stream no está en vivo, no se distribuyen puntos');
      return;
    }
    
    console.log('💰 Distribuyendo puntos...');
    console.log(`📊 Usuarios activos en chat: ${activeUsers.size}`);
    
    try {
      // Obtener todos los usuarios registrados
      const users = await supabase.query('users', {
        select: 'id,kick_username,is_subscriber,points_balance'
      });
      
      if (!users || users.length === 0) {
        console.warn('⚠️ No hay usuarios registrados');
        return;
      }
      
      let totalDistributed = 0;
      const updates = [];
      
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
        await supabase.update('users', 
          { 
            points_balance: newBalance,
            updated_at: new Date().toISOString()
          },
          { id: user.id }
        );
        
        totalDistributed += points;
        
        console.log(`  ✅ ${user.kick_username}: +${points} pts (total: ${newBalance})`);
      }
      
      console.log(`✅ Distribución completada: ${totalDistributed} puntos a ${users.length} usuarios`);
      
      // Limpiar usuarios inactivos
      activeUsers.clear();
      
    } catch (error) {
      console.error('❌ Error distribuyendo puntos:', error);
    }
  }
  
  // ==================== CONTROL DEL BOT ====================
  function start() {
    if (isRunning) {
      console.warn('⚠️ El bot ya está ejecutándose');
      return;
    }
    
    isRunning = true;
    console.log('🚀 Bot iniciado');
    
    // Verificar estado del stream cada minuto
    setInterval(checkIfLive, 60 * 1000);
    checkIfLive();
    
    // Observar el chat
    observeChat();
    
    // Distribuir puntos cada X minutos
    intervalId = setInterval(distributePoints, CONFIG.INTERVAL_MINUTES * 60 * 1000);
    
    console.log('✅ Sistema de puntos activo');
    console.log('ℹ️ Para detener: stopPointsBot()');
  }
  
  function stop() {
    if (!isRunning) {
      console.warn('⚠️ El bot no está ejecutándose');
      return;
    }
    
    isRunning = false;
    
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    if (chatObserver) {
      chatObserver.disconnect();
      chatObserver = null;
    }
    
    activeUsers.clear();
    
    console.log('🛑 Bot detenido');
  }
  
  // ==================== EXPONER FUNCIONES GLOBALES ====================
  window.startPointsBot = start;
  window.stopPointsBot = stop;
  window.pointsBotStatus = () => {
    console.log('📊 Estado del bot:');
    console.log('  Running:', isRunning);
    console.log('  Live:', isLive);
    console.log('  Active users:', activeUsers.size);
    console.log('  Users:', Array.from(activeUsers.keys()));
  };
  
  // ==================== INICIO AUTOMÁTICO ====================
  console.log('✅ Bot cargado correctamente');
  console.log('');
  console.log('Comandos disponibles:');
  console.log('  startPointsBot()  - Iniciar el bot');
  console.log('  stopPointsBot()   - Detener el bot');
  console.log('  pointsBotStatus() - Ver estado');
  console.log('');
  console.log('💡 Ejecuta startPointsBot() para comenzar');
  
})();
