/**
 * Eclipse Music Addon for Muzo Backend
 * Uses Hono.js for lightweight HTTP server
 * Integrates with existing Muzo backend libraries
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import addonManifest from './addon-manifest.js';

// Import existing Muzo backend libraries
import YTMusic from './lib/ytmusicapi.js';
import YouTubeSearch from './lib/youtube-search.js';
import youtubeiClient from './lib/youtubei-client.js';
import jiosaavn from './lib/jiosaavn.js';

// Initialize clients
const ytmusic = new YTMusic();
const youtubeSearch = new YouTubeSearch();

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors());

// Disable ETag to prevent 304 responses
app.use('*', async (c, next) => {
  await next();
  c.header('ETag', '');
});

/**
 * GET /manifest.json
 * Returns the addon manifest for Eclipse Music
 */
app.get('/manifest.json', (c) => {
  return c.json(addonManifest);
});

/**
 * GET /search?q={query}
 * Search for music across tracks, albums, artists, and playlists
 */
app.get('/search', async (c) => {
  const query = c.req.query('q') || '';
  
  if (!query) {
    return c.json({
      tracks: [],
      albums: [],
      artists: [],
      playlists: []
    });
  }

  try {
    // Search YouTube Music for all types
    const [songsResults, albumsResults, artistsResults, playlistsResults] = await Promise.all([
      ytmusic.search(query, 'songs').catch(() => ({ results: [] })),
      ytmusic.search(query, 'albums').catch(() => ({ results: [] })),
      ytmusic.search(query, 'artists').catch(() => ({ results: [] })),
      ytmusic.search(query, 'playlists').catch(() => ({ results: [] }))
    ]);

    // Transform search results to Eclipse format
    const tracks = (songsResults.results || []).map(track => transformTrack(track)).filter(Boolean);
    const albums = (albumsResults.results || []).map(album => transformAlbum(album)).filter(Boolean);
    const artists = (artistsResults.results || []).map(artist => transformArtist(artist)).filter(Boolean);
    const playlists = (playlistsResults.results || []).map(playlist => transformPlaylist(playlist)).filter(Boolean);

    return c.json({
      tracks,
      albums,
      artists,
      playlists
    });
  } catch (error) {
    console.error('[SEARCH] Error:', error.message);
    return c.json({
      tracks: [],
      albums: [],
      artists: [],
      playlists: [],
      error: error.message
    }, 500);
  }
});

/**
 * GET /stream/{id}
 * Returns a playable stream URL for a track
 */
app.get('/stream/:id', async (c) => {
  const trackId = c.req.param('id');
  
  try {
    // Get song data from YouTube Music
    const songData = await ytmusic.getSong(trackId);
    
    if (!songData || !songData.streamURL) {
      return c.json({
        error: 'Stream URL not found'
      }, 404);
    }

    return c.json({
      url: songData.streamURL,
      format: songData.format || 'mp3',
      quality: songData.quality || '128kbps'
    });
  } catch (error) {
    console.error('[STREAM] Error:', error.message);
    
    // Fallback: Try Invidious API for streaming data
    try {
      const axios = require('axios');
      const response = await axios.get(`https://inv.tux.piped.video/api/v1/streams/${trackId}`, {
        timeout: 5000
      });
      
      if (response.data && response.data.audioStreams) {
        const audioStream = response.data.audioStreams[0];
        return c.json({
          url: audioStream.url,
          format: audioStream.format || 'mp3',
          quality: audioStream.quality || '128kbps'
        });
      }
    } catch (fallbackError) {
      console.error('[STREAM] Fallback failed:', fallbackError.message);
    }
    
    // Last resort fallback
    return c.json({
      url: `https://www.youtube.com/watch?v=${trackId}`,
      format: 'mp3',
      quality: '128kbps'
    });
  }
});

/**
 * GET /album/{id}
 * Returns album details with tracks
 */
app.get('/album/:id', async (c) => {
  const albumId = c.req.param('id');
  
  try {
    const albumData = await ytmusic.getAlbum(albumId);
    
    if (!albumData) {
      return c.json({ error: 'Album not found' }, 404);
    }

    // Transform album to Eclipse format
    const transformedAlbum = {
      id: albumData.id || albumId,
      title: albumData.title || 'Unknown Album',
      artist: albumData.artist?.name || albumData.artists?.[0]?.name || 'Unknown Artist',
      artworkURL: albumData.artworkURL || albumData.thumbnail || '',
      year: String(albumData.year || ''),
      description: albumData.description || '',
      trackCount: albumData.trackCount || (albumData.tracks?.length || 0),
      tracks: (albumData.tracks || []).map((track, index) => ({
        id: track.videoId || track.id || `${albumId}_track_${index}`,
        title: track.title || `Track ${index + 1}`,
        artist: track.artist?.name || track.artists?.[0]?.name || albumData.artist?.name || 'Unknown Artist',
        duration: parseDuration(track.duration),
        artworkURL: track.artworkURL || albumData.artworkURL || '',
        streamURL: track.streamURL || null
      })).filter(t => t.id)
    };

    return c.json(transformedAlbum);
  } catch (error) {
    console.error('[ALBUM] Error:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /artist/{id}
 * Returns artist details with top tracks and albums
 */
app.get('/artist/:id', async (c) => {
  const artistId = c.req.param('id');
  
  try {
    const artistData = await ytmusic.getArtist(artistId);
    
    if (!artistData) {
      return c.json({ error: 'Artist not found' }, 404);
    }

    // Transform artist to Eclipse format
    const transformedArtist = {
      id: artistData.id || artistId,
      name: artistData.name || 'Unknown Artist',
      artworkURL: artistData.artworkURL || artistData.avatar || '',
      bio: artistData.bio || artistData.description || '',
      genres: artistData.genres || [],
      topTracks: (artistData.topTracks || artistData.songs || []).slice(0, 10).map(track => ({
        id: track.videoId || track.id,
        title: track.title,
        artist: track.artist?.name || artistData.name,
        duration: parseDuration(track.duration),
        streamURL: track.streamURL || null
      })).filter(t => t.id),
      albums: (artistData.albums || []).map(album => ({
        id: album.browseId || album.id,
        title: album.title,
        artist: artistData.name,
        artworkURL: album.thumbnail || album.artworkURL || '',
        trackCount: album.trackCount || 0,
        year: String(album.year || '')
      })).filter(a => a.id)
    };

    return c.json(transformedArtist);
  } catch (error) {
    console.error('[ARTIST] Error:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /playlist/{id}
 * Returns playlist details with tracks
 */
app.get('/playlist/:id', async (c) => {
  const playlistId = c.req.param('id');
  
  try {
    const playlistData = await ytmusic.getPlaylist(playlistId);
    
    if (!playlistData) {
      return c.json({ error: 'Playlist not found' }, 404);
    }

    // Transform playlist to Eclipse format
    const transformedPlaylist = {
      id: playlistData.id || playlistId,
      title: playlistData.title || 'Unknown Playlist',
      description: playlistData.description || '',
      artworkURL: playlistData.artworkURL || playlistData.thumbnail || '',
      creator: playlistData.author?.name || playlistData.creator || 'Unknown',
      tracks: (playlistData.tracks || playlistData.items || []).map((track, index) => ({
        id: track.videoId || track.id || `${playlistId}_track_${index}`,
        title: track.title || `Track ${index + 1}`,
        artist: track.artist?.name || track.artists?.[0]?.name || 'Unknown Artist',
        duration: parseDuration(track.duration),
        streamURL: track.streamURL || null
      })).filter(t => t.id)
    };

    return c.json(transformedPlaylist);
  } catch (error) {
    console.error('[PLAYLIST] Error:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// Helper functions to transform Muzo backend data to Eclipse format

function transformTrack(track) {
  if (!track || (!track.videoId && !track.id)) return null;
  
  return {
    id: track.videoId || track.id,
    title: track.title || 'Unknown Track',
    artist: track.artist?.name || track.artists?.[0]?.name || 'Unknown Artist',
    album: track.album?.name || track.album?.title || '',
    duration: parseDuration(track.duration),
    artworkURL: track.artworkURL || track.thumbnail || '',
    isrc: track.isrc || null,
    format: track.format || 'mp3',
    streamURL: track.streamURL || null
  };
}

function transformAlbum(album) {
  if (!album || (!album.browseId && !album.id)) return null;
  
  return {
    id: album.browseId || album.id,
    title: album.title || 'Unknown Album',
    artist: album.artist?.name || album.artists?.[0]?.name || 'Unknown Artist',
    artworkURL: album.artworkURL || album.thumbnail || '',
    trackCount: album.trackCount || 0,
    year: String(album.year || '')
  };
}

function transformArtist(artist) {
  if (!artist || (!artist.browseId && !artist.id)) return null;
  
  return {
    id: artist.browseId || artist.id,
    name: artist.name || 'Unknown Artist',
    artworkURL: artist.artworkURL || artist.thumbnail || '',
    genres: artist.genres || []
  };
}

function transformPlaylist(playlist) {
  if (!playlist || (!playlist.browseId && !playlist.id)) return null;
  
  return {
    id: playlist.browseId || playlist.id,
    title: playlist.title || 'Unknown Playlist',
    creator: playlist.author?.name || playlist.creator || 'Unknown',
    artworkURL: playlist.artworkURL || playlist.thumbnail || '',
    trackCount: playlist.trackCount || playlist.count || 0
  };
}

function parseDuration(duration) {
  if (!duration) return 0;
  
  if (typeof duration === 'number') {
    return Math.floor(duration);
  }
  
  if (typeof duration === 'string') {
    // Handle formats like "3:24", "1:02:45"
    const timeMatch = duration.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10) || 0;
      const minutes = parseInt(timeMatch[2], 10) || 0;
      const seconds = parseInt(timeMatch[3] || '0', 10);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // Handle "X minutes" or "X seconds" format
    const minMatch = duration.match(/(\d+)\s*min/i);
    if (minMatch) {
      return parseInt(minMatch[1], 10) * 60;
    }
    
    const secMatch = duration.match(/(\d+)\s*sec/i);
    if (secMatch) {
      return parseInt(secMatch[1], 10);
    }
  }
  
  return 0;
}

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', addon: addonManifest.name });
});

console.log('🎵 Eclipse Music Addon ready');
console.log(`📦 Addon ID: ${addonManifest.id}`);
console.log(`🎶 Resources: ${addonManifest.resources.join(', ')}`);
console.log(`🎤 Types: ${addonManifest.types.join(', ')}`);

// Export for Vercel/serverless deployment and Node.js
export { app, addonManifest };
