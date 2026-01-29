const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SlotMasters1K Loyalty API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ============================================
// KICK OAUTH CALLBACK
// ============================================
app.post('/auth/kick-callback', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing authorization code' 
    });
  }

  try {
    console.log('Processing Kick OAuth callback...');

    // Exchange code for access token
    const tokenResponse = await fetch('https://kick.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.KICK_CLIENT_ID,
        client_secret: process.env.KICK_CLIENT_SECRET,
        redirect_uri: process.env.KICK_REDIRECT_URI,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Access token obtained');

    // Get user info from Kick
    const userResponse = await fetch('https://kick.com/api/v2/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.error('User fetch failed:', error);
      throw new Error('Failed to fetch user data');
    }

    const kickUser = await userResponse.json();
    console.log('User data obtained:', kickUser.username);

    // TODO: Crear/actualizar usuario en Supabase
    // TODO: Crear sesión de Supabase
    // Por ahora devolvemos los datos

    res.json({
      success: true,
      token: accessToken,
      user: {
        id: kickUser.id,
        username: kickUser.username,
        avatar: kickUser.profile_pic,
        is_subscriber: kickUser.is_subscribed || false
      }
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// KICK API PROXY (Para evitar CORS)
// ============================================
app.get('/kick/channel/:channel', async (req, res) => {
  const { channel } = req.params;

  try {
    const response = await fetch(`https://kick.com/api/v1/channels/${channel}`);
    
    if (!response.ok) {
      throw new Error('Channel not found');
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Kick API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// CRON ENDPOINT - MINING POINTS (Fase 2)
// ============================================
app.post('/cron/mine-points', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  // Verificar cron secret
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized' 
    });
  }

  try {
    console.log('Mining points cron started...');

    // TODO Fase 2: Implementar lógica de minado
    // 1. Verificar si stream está live
    // 2. Obtener viewers del chat
    // 3. Calcular y asignar puntos
    // 4. Guardar en mining_logs

    res.json({
      success: true,
      message: 'Mining job executed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mining cron error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🎰 SlotMasters1K Backend API');
  console.log('========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
