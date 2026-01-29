/**
 * Server.js para SiteGround Node.js Hosting
 * Este archivo es el punto de entrada para la aplicación Next.js en SiteGround
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express');
const fetch = require('node-fetch');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

// Inicializar Next.js
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

console.log('🎰 SlotMasters1K Loyalty - Starting server...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Port: ${port}`);

app.prepare().then(() => {
  const server = express();
  
  // Middleware para JSON
  server.use(express.json());

  // Health check endpoint
  server.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Kick OAuth callback handler
  server.post('/api/auth/kick-callback', async (req, res) => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.NEXT_PUBLIC_KICK_CLIENT_ID,
          client_secret: process.env.KICK_CLIENT_SECRET,
          redirect_uri: process.env.NEXT_PUBLIC_KICK_REDIRECT_URI,
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

      // Get user info from Kick
      const userResponse = await fetch('https://kick.com/api/v2/user', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const kickUser = await userResponse.json();
      console.log('User authenticated:', kickUser.username);

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

  // Kick API proxy
  server.get('/api/kick/channel/:channel', async (req, res) => {
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

  // Todas las demás rutas van a Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Iniciar servidor
  server.listen(port, (err) => {
    if (err) throw err;
    console.log('========================================');
    console.log('🎰 SlotMasters1K Loyalty Server');
    console.log('========================================');
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('========================================');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

}).catch((ex) => {
  console.error('Error starting server:', ex.stack);
  process.exit(1);
});
