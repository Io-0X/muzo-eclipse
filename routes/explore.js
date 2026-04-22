import { Hono } from 'hono';
const router = new Hono();

/**
 * @swagger
 * /api/charts:
 *   get:
 *     summary: Get charts (global or by country)
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country code
 *     responses:
 *       200:
 *         description: Charts data
 *       500:
 *         description: Charts data unavailable
 */
router.get('/charts', async (c) => {
  try {
    const { country } = c.c.req.query()();
    const ytmusic = c.get('ytmusic');
    
    const data = await ytmusic.getCharts(country);
    return c.json(data);
  } catch (error) {
    console.error('Charts error:', error);
    const errorMsg = error.message || 'Charts service temporarily unavailable';
    return c.json({
      error: `Charts data unavailable: ${errorMsg}`,
      message: 'YouTube Music charts are currently not accessible. This may be due to regional restrictions or service limitations.',
      fallback: 'Try using the search endpoint instead: /api/search?q=trending&filter=songs'
    });
  }
});

/**
 * @swagger
 * /api/moods:
 *   get:
 *     summary: Get mood/genre categories
 *     responses:
 *       200:
 *         description: Mood categories
 *       500:
 *         description: Mood categories unavailable
 */
router.get('/moods', async (c) => {
  try {
    const ytmusic = c.get('ytmusic');
    const data = await ytmusic.getMoodCategories();
    return c.json(data);
  } catch (error) {
    console.error('Moods error:', error);
    const errorMsg = error.message || 'Mood categories service temporarily unavailable';
    return c.json({
      error: `Mood categories unavailable: ${errorMsg}`,
      message: 'YouTube Music mood categories are currently not accessible.',
      fallback: 'Try using the search endpoint instead: /api/search?q=relaxing&filter=playlists'
    });
  }
});

/**
 * @swagger
 * /api/moods/{categoryId}:
 *   get:
 *     summary: Get playlists for a mood/genre category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Mood playlists
 *       500:
 *         description: Mood playlists unavailable
 */
router.get('/moods/:categoryId', async (c) => {
  try {
    const { categoryId } = c.req.param();
    const ytmusic = c.get('ytmusic');
    
    const data = await ytmusic.getMoodPlaylists(categoryId);
    return c.json(data);
  } catch (error) {
    console.error('Mood playlists error:', error);
    const errorMsg = error.message || 'Mood playlists service temporarily unavailable';
    return c.json({
      error: `Mood playlists unavailable: ${errorMsg}`,
      message: `Mood playlists for category '${c.req.param().categoryId}' are currently not accessible.`,
      fallback: 'Try using the search endpoint instead: /api/search?q=mood&filter=playlists'
    });
  }
});

/**
 * @swagger
 * /api/watch_playlist:
 *   get:
 *     summary: Get watch playlist (radio/shuffle)
 *     parameters:
 *       - in: query
 *         name: videoId
 *         schema:
 *           type: string
 *         description: Video ID
 *       - in: query
 *         name: playlistId
 *         schema:
 *           type: string
 *         description: Playlist ID
 *       - in: query
 *         name: radio
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Radio mode
 *       - in: query
 *         name: shuffle
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Shuffle mode
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Maximum number of tracks
 *     responses:
 *       200:
 *         description: Watch playlist data
 *       400:
 *         description: Missing params
 */
router.get('/watch_playlist', async (c) => {
  try {
    const { videoId, playlistId, radio = false, shuffle = false, limit = 25 } = c.c.req.query()();
    
    if (!videoId && !playlistId) {
      return c.json({ error: 'Provide either videoId or playlistId' });
    }

    const ytmusic = c.get('ytmusic');
    const data = await ytmusic.getWatchPlaylist(
      videoId, 
      playlistId, 
      radio === 'true', 
      shuffle === 'true', 
      parseInt(limit)
    );
    
    return c.json(data);
  } catch (error) {
    console.error('Watch playlist error:', error);
    return c.json({ error: `Watch playlist unavailable: ${error.message}` });
  }
});

export default router;
