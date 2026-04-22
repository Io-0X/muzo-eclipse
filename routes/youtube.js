import { Hono } from 'hono';

const router = new Hono();

const YT_FILTERS = new Set(['all', 'channels', 'playlists', 'videos']);

/**
 * @swagger
 * /api/yt_search:
 *   get:
 *     summary: Search YouTube
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, channels, playlists, videos]
 *           default: all
 *         description: Filter results by type
 *       - in: query
 *         name: continuationToken
 *         schema:
 *           type: string
 *         description: Continuation token for pagination
 *     responses:
 *       200:
 *         description: YouTube search results with continuation token
 *       400:
 *         description: Missing/invalid params
 */
router.get('/yt_search', async (c) => {
  try {
    const { q: query, filter = 'all', continuationToken } = c.c.req.query()();

    // FIXED: Allow continuation without query
    if (!query && !continuationToken) {
      return c.json({ error: "Missing required query parameter 'q' or 'continuationToken'" });
    }

    if (!YT_FILTERS.has(filter)) {
      return c.json({
        error: `Invalid filter. Allowed: ${Array.from(YT_FILTERS).sort()}`
      });
    }

    const youtubeSearch = c.get('youtubeSearch');
    let results = [];
    let nextContinuationToken = null;

    // When continuation token is provided, only search the specific filter type
    if (continuationToken) {
      // FIXED: Don't pass query when using continuation token
      if (filter === 'videos') {
        const videoResults = await youtubeSearch.searchVideos(null, continuationToken);
        results = videoResults.results;
        nextContinuationToken = videoResults.continuationToken;
      } else if (filter === 'channels') {
        const channelResults = await youtubeSearch.searchChannels(null, continuationToken);
        results = channelResults.results;
        nextContinuationToken = channelResults.continuationToken;
      } else if (filter === 'playlists') {
        const playlistResults = await youtubeSearch.searchPlaylists(null, continuationToken);
        results = playlistResults.results;
        nextContinuationToken = playlistResults.continuationToken;
      }
    } else {
      // Initial search without continuation token
      if (filter === 'videos' || filter === 'all') {
        const videoResults = await youtubeSearch.searchVideos(query, null);
        results.push(...videoResults.results);
        nextContinuationToken = videoResults.continuationToken;
      }

      if (filter === 'channels' || filter === 'all') {
        const channelResults = await youtubeSearch.searchChannels(query, null);
        results.push(...channelResults.results);
        if (!nextContinuationToken) nextContinuationToken = channelResults.continuationToken;
      }

      if (filter === 'playlists' || filter === 'all') {
        const playlistResults = await youtubeSearch.searchPlaylists(query, null);
        results.push(...playlistResults.results);
        if (!nextContinuationToken) nextContinuationToken = playlistResults.continuationToken;
      }
    }

    // Include continuationToken at the end
    return c.json({
      filter,
      query: query || null,
      results,
      continuationToken: nextContinuationToken
    });
  } catch (error) {
    console.error('YouTube search error:', error);
    return c.json({ error: `Search failed: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/yt_channel/{channelId}:
 *   get:
 *     summary: Get YouTube channel information
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube channel ID
 *     responses:
 *       200:
 *         description: Channel information
 *       400:
 *         description: Invalid channel ID
 */
router.get('/yt_channel/:channelId', async (c) => {
  try {
    const { channelId } = c.req.param();
    const youtubeSearch = c.get('youtubeSearch');

    // Get channel info using search
    const channelResults = await youtubeSearch.searchChannels(`channel:${channelId}`, null);

    if (channelResults.results.length === 0) {
      return c.json({ error: 'Channel not found' });
    }

    return c.json({
      channelId,
      channelInfo: channelResults.results[0]
    });
  } catch (error) {
    console.error('YouTube channel error:', error);
    return c.json({ error: `Failed to get channel info: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/yt_playlists:
 *   get:
 *     summary: Search YouTube playlists
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for playlists
 *       - in: query
 *         name: continuationToken
 *         schema:
 *           type: string
 *         description: Continuation token for pagination
 *     responses:
 *       200:
 *         description: YouTube playlists with continuation token
 *       400:
 *         description: Missing/invalid params
 */
router.get('/yt_playlists', async (c) => {
  try {
    const { q: query, continuationToken } = c.c.req.query()();

    // FIXED: Allow continuation without query
    if (!query && !continuationToken) {
      return c.json({ error: "Missing required query parameter 'q' or 'continuationToken'" });
    }

    const youtubeSearch = c.get('youtubeSearch');
    const playlistResults = await youtubeSearch.searchPlaylists(
      query || null, 
      continuationToken
    );

    return c.json({
      query: query || null,
      playlists: playlistResults.results,
      continuationToken: playlistResults.continuationToken
    });
  } catch (error) {
    console.error('YouTube playlists error:', error);
    return c.json({ error: `Failed to search playlists: ${error.message}` });
  }
});

export default router;
