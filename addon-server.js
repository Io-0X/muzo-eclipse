/**
 * Eclipse Music Addon - Standalone Server Entry Point
 * Run with: node addon-server.js
 */

import { serve } from '@hono/node-server';
import { app, addonManifest } from './addon.js';

const PORT = process.env.ADDON_PORT || 3001;

console.log('🚀 Starting Eclipse Music Addon Server...');
console.log(`📦 Addon: ${addonManifest.name} v${addonManifest.version}`);
console.log(`🆔 ID: ${addonManifest.id}`);
console.log(`🌐 Listening on http://localhost:${PORT}`);
console.log(`📄 Manifest: http://localhost:${PORT}/manifest.json`);
console.log(`🔍 Search: http://localhost:${PORT}/search?q=test`);
console.log(`▶️  Stream: http://localhost:${PORT}/stream/{id}`);
console.log('');
console.log('To install in Eclipse Music:');
console.log(`1. Open Eclipse Music`);
console.log(`2. Go to Settings → Connections → Add Connection → Addon`);
console.log(`3. Paste: http://localhost:${PORT}/manifest.json`);
console.log(`4. Tap Install`);
console.log('');

serve({
  fetch: app.fetch,
  port: parseInt(PORT, 10),
  hostname: '0.0.0.0'
}, (info) => {
  console.log(`✅ Server ready at http://${info.address}:${info.port}`);
});
