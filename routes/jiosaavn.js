import { Hono } from 'hono';
import JioSaavn from '../lib/jiosaavn.js';
const router = new Hono();

const jiosaavn = new JioSaavn();

/**
 * @swagger
 * /api/jiosaavn/search:
 *   get:
 *     summary: Search for music on JioSaavn
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: Song title
 *       - in: query
 *         name: artist
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist name
 *       - in: query
 *         name: debug
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *         description: Enable debug mode
 *     responses:
 *       200:
 *         description: Song information with download URL
 *       400:
 *         description: Missing title or artist parameters
 *       404:
 *         description: Music stream not found
 *       500:
 *         description: Internal server error
 */
router.get('/jiosaavn/search', async (c) => {
  try {
    const { title, artist, debug = 0 } = c.c.req.query()();

    if (!title || !artist) {
      return c.json({ error: 'Missing title or artist parameters' });
    }

    const debugMode = debug === '1';
    const result = await jiosaavn.search(title, artist, debugMode);
    
    return c.json(result);
  } catch (error) {
    console.error('JioSaavn search error:', error);
    return c.json({ error: `JioSaavn search failed: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/jiosaavn/search/all:
 *   get:
 *     summary: Search for all music results on JioSaavn
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results to return
 *       - in: query
 *         name: debug
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *         description: Enable debug mode
 *     responses:
 *       200:
 *         description: List of all matching songs
 *       400:
 *         description: Missing query parameter
 *       500:
 *         description: Internal server error
 */
router.get('/jiosaavn/search/all', async (c) => {
  try {
    const { q: query, limit = 10, debug = 0 } = c.c.req.query()();

    if (!query) {
      return c.json({ error: "Missing query parameter 'q'" });
    }

    const debugMode = debug === '1';
    const result = await jiosaavn.searchAll(query, parseInt(limit), debugMode);
    
    return c.json(result);
  } catch (error) {
    console.error('JioSaavn search all error:', error);
    return c.json({ error: `JioSaavn search all failed: ${error.message}` });
  }
});

export default router;
