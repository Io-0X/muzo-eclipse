import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

dotenv.config();

// Import route modules
import apiRoutes from './routes/api.js';
import entitiesRoutes from './routes/entities.js';
import exploreRoutes from './routes/explore.js';
import youtubeRoutes from './routes/youtube.js';
import jiosaavnRoutes from './routes/jiosaavn.js';

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

// Root endpoint - Redirect to Frontend Demo
app.get('/', (c) => {
  return c.redirect('https://shashwat-coding.github.io/ytify-backend');
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Music API',
      version: '1.0.0',
      description: 'Node.js Music API with YouTube Music, YouTube Search, and JioSaavn integration',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI - Custom HTML endpoint
app.get('/api-docs', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api-docs/doc.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
  `;
  return c.html(html);
});

// Serve Swagger JSON spec
app.get('/api-docs/doc.json', (c) => {
  return c.json(specs);
});

// API routes
app.route('/api', apiRoutes);
app.route('/api', entitiesRoutes);
app.route('/api', exploreRoutes);
app.route('/api', youtubeRoutes);
app.route('/api', jiosaavnRoutes);

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
    console.log(`🌐 Frontend Demo redirects from http://localhost:${PORT}/ to https://shashwat-coding.github.io/ytify-backend`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  });
}

export default app;
