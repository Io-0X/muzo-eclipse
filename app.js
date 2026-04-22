import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';

dotenv.config();

// Import route modules
import apiRoutes from './routes/api.js';
import entitiesRoutes from './routes/entities.js';
import exploreRoutes from './routes/explore.js';
import youtubeRoutes from './routes/youtube.js';
import jiosaavnRoutes from './routes/jiosaavn.js';

// Import addon manifest
import addonManifest from './addon-manifest.js';

// Import libraries
import YTMusic from './lib/ytmusicapi.js';
import YouTubeSearch from './lib/youtube-search.js';

const app = new Hono();
const PORT = process.env.PORT || 8000;

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Initialize clients
const ytmusic = new YTMusic();
const youtubeSearch = new YouTubeSearch();

// Make clients available via context
app.use('*', async (c, next) => {
  c.set('ytmusic', ytmusic);
  c.set('youtubeSearch', youtubeSearch);
  await next();
});

// Root endpoint - Redirect to health
app.get('/', (c) => {
  return c.redirect('/health');
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Manifest endpoint
app.get('/manifest.json', (c) => {
  return c.json(addonManifest);
});

// API routes (mounted at root, not /api)
app.route('/', apiRoutes);
app.route('/', entitiesRoutes);
app.route('/', exploreRoutes);
app.route('/', youtubeRoutes);
app.route('/', jiosaavnRoutes);

// Error handling middleware
app.onError((err, c) => {
  console.error(err.stack);
  return c.json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Route not found',
    message: `Cannot ${c.req.method} ${c.req.path}`
  }, 404);
});

// Start server locally; on Vercel we just export the app
if (!process.env.VERCEL) {
  serve({
    fetch: app.fetch,
    port: PORT,
    host: '0.0.0.0'
  }, () => {
    console.log(`🚀 ytify-backend server running on port ${PORT}`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  });
}

export default app;
