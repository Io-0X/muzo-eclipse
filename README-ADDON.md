# Eclipse Music Addon for Muzo Backend

Un addon para Eclipse Music que utiliza el backend existente de Muzo (YouTube Music, JioSaavn) para proporcionar música.

## Características

- 🔍 **Búsqueda**: Busca canciones, álbumes, artistas y playlists
- ▶️ **Streaming**: Proporciona URLs de streaming reproducibles
- 💿 **Álbumes**: Navegación completa de álbumes con tracks
- 🎤 **Artistas**: Páginas de artista con top tracks y álbumes
- 📋 **Playlists**: Soporte para playlists con tracks

## Endpoints del Addon

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/manifest.json` | GET | Manifiesto del addon (requerido) |
| `/search?q={query}` | GET | Buscar música |
| `/stream/{id}` | GET | Obtener URL de streaming |
| `/album/{id}` | GET | Detalles del álbum (opcional) |
| `/artist/{id}` | GET | Detalles del artista (opcional) |
| `/playlist/{id}` | GET | Detalles de playlist (opcional) |
| `/health` | GET | Verificar estado del servidor |

## Instalación del Addon en Eclipse Music

1. Inicia el servidor del addon:
   ```bash
   node addon-server.js
   ```

2. En Eclipse Music:
   - Ve a Settings → Connections → Add Connection → Addon
   - Pega la URL: `http://localhost:3001/manifest.json`
   - Toca Install

3. El addon aparecerá en el dropdown de búsqueda

## Desarrollo

### Requisitos previos

```bash
npm install
```

### Ejecutar en modo desarrollo

```bash
node addon-server.js
```

El servidor se ejecutará en `http://localhost:3001`

### Probar endpoints

```bash
# Ver manifiesto
curl http://localhost:3001/manifest.json

# Buscar música
curl "http://localhost:3001/search?q=shubh"

# Obtener stream
curl http://localhost:3001/stream/{videoId}

# Ver álbum
curl http://localhost:3001/album/{albumId}

# Ver artista
curl http://localhost:3001/artist/{artistId}
```

## Despliegue

### Vercel

El addon es compatible con Vercel. Solo necesitas:

1. Crear un archivo `vercel.json` (ya incluido)
2. Hacer deploy a Vercel

### Cloudflare Workers

También es compatible con Cloudflare Workers usando Wrangler.

### Docker

```bash
docker build -t muzo-eclipse-addon .
docker run -p 3001:3001 muzo-eclipse-addon
```

## Estructura del Proyecto

```
/workspace/
├── addon.js              # Lógica principal del addon
├── addon-manifest.js     # Configuración del manifiesto
├── addon-server.js       # Punto de entrada del servidor
├── lib/
│   ├── ytmusicapi.js    # API de YouTube Music
│   ├── youtube-search.js # Búsqueda en YouTube
│   └── jiosaavn.js      # API de JioSaavn
└── routes/              # Rutas existentes del backend
```

## Manifiesto

```json
{
  "id": "com.muzo.eclipse-addon",
  "name": "Muzo Music Addon",
  "version": "1.0.0",
  "description": "Streams music from YouTube Music via Muzo backend",
  "icon": "https://raw.githubusercontent.com/shashwat-coding/ytify-backend/main/icon.png",
  "resources": ["search", "stream", "catalog"],
  "types": ["track", "album", "artist", "playlist"],
  "contentType": "music"
}
```

## Notas Importantes

- **CORS**: El addon habilita CORS para permitir solicitudes desde Eclipse Music
- **HTTPS**: Para producción, necesitas HTTPS (excepto en localhost)
- **Formatos de audio**: Soporta MP3, AAC, M4A, FLAC, WAV, OGG
- **ISRC**: Se recomienda incluir códigos ISRC para enriquecer metadatos

## Solución de Problemas

### El addon no aparece en Eclipse Music

- Verifica que el servidor esté corriendo
- Asegúrate de que CORS esté habilitado
- Comprueba que el manifiesto sea accesible

### Las canciones no se reproducen

- Verifica que las URLs de streaming sean directas
- Comprueba que no haya redirecciones a páginas de login
- Prueba con diferentes fuentes (YouTube Music, JioSaavn)

### Errores de búsqueda

- Revisa los logs del servidor
- Verifica la conexión a las APIs externas
- Comprueba los límites de rate limiting

## Licencia

MIT License

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o PR.
