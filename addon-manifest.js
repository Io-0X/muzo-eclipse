// Eclipse Music Addon Manifest Configuration
export default {
  id: 'com.muzo.eclipse-addon',
  name: 'Muzo Music Addon',
  version: '1.0.0',
  description: 'Streams music from YouTube Music via Muzo backend',
  icon: 'https://raw.githubusercontent.com/shashwat-coding/ytify-backend/main/icon.png',
  resources: ['search', 'stream', 'catalog'],
  types: ['track', 'album', 'artist', 'playlist'],
  contentType: 'music'
};
