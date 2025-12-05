// ============================================
// SPOTIFY API - INTEGRACIÓN COMPLETA
// ============================================

const SpotifyAPI = {
  accessToken: null,
  tokenExpiry: null,

  // Obtener token de acceso
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = btoa(`${CONFIG.spotify.clientId}:${CONFIG.spotify.clientSecret}`);
    
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error('Error obteniendo token de Spotify');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error Spotify Auth:', error);
      throw error;
    }
  },

  // Obtener datos de una playlist
  async getPlaylistData(playlistId) {
    // Validar playlistId
    if (!playlistId || playlistId === '' || playlistId === 'NOPLAYLIST') {
      return null;
    }
    
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${CONFIG.spotify.apiUrl}/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`⚠️ Rate limit 429 para playlist ${playlistId}`);
          throw new Error('429 Too Many Requests');
        }
        console.warn(`Playlist ${playlistId} no encontrada`);
        return null;
      }

      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        followers: data.followers.total,
        popularity: this.calculatePlaylistPopularity(data),
        imageUrl: data.images[0]?.url || null,
        url: data.external_urls.spotify,
        tracks: data.tracks.total,
        owner: data.owner.display_name,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error obteniendo datos de playlist ${playlistId}:`, error);
      return null;
    }
  },

  // Calcular popularidad de playlist (estimado basado en followers y tracks)
  calculatePlaylistPopularity(playlistData) {
    const followers = playlistData.followers.total;
    const tracks = playlistData.tracks.total;
    
    // Algoritmo de estimación de popularidad (0-100)
    let popularity = 0;
    
    if (followers < 100) popularity = 10;
    else if (followers < 500) popularity = 25;
    else if (followers < 1000) popularity = 40;
    else if (followers < 5000) popularity = 55;
    else if (followers < 10000) popularity = 70;
    else if (followers < 50000) popularity = 85;
    else popularity = 95;
    
    // Ajuste por número de tracks
    if (tracks > 50) popularity += 5;
    
    return Math.min(popularity, 100);
  },

  // Obtener datos de todas las playlists configuradas
  async getAllPlaylistsData() {
    const results = [];
    
    for (const artist of CONFIG.artists) {
      if (!artist.active) continue;
      if (artist.skipSpotify || !artist.playlistId) continue;  // Skip TrackBoost sin playlist
      
      try {
        const data = await this.getPlaylistData(artist.playlistId);
        if (data) {
          results.push({
            artist: artist.name,
            ...data
          });
        }
        
        // ⏱️ DELAY de 300ms entre llamadas para evitar 429
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error procesando ${artist.name}:`, error);
      }
    }
    
    return results;
  },

  // Obtener datos históricos de una playlist en una fecha específica
  async getHistoricalData(playlistId, targetDate) {
    // Intentar obtener del almacenamiento local primero
    const stored = localStorage.getItem(`spotify_${playlistId}_${targetDate}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Si no hay datos históricos, obtener actuales
    const currentData = await this.getPlaylistData(playlistId);
    
    // Guardar para futuras consultas
    if (currentData) {
      this.saveHistoricalData(playlistId, targetDate, currentData);
    }
    
    return currentData;
  },

  // Guardar datos históricos
  saveHistoricalData(playlistId, date, data) {
    const key = `spotify_${playlistId}_${date}`;
    localStorage.setItem(key, JSON.stringify(data));
    
    // También guardar en índice de fechas
    const indexKey = `spotify_dates_${playlistId}`;
    const dates = JSON.parse(localStorage.getItem(indexKey) || '[]');
    if (!dates.includes(date)) {
      dates.push(date);
      localStorage.setItem(indexKey, JSON.stringify(dates));
    }
  },

  // Obtener todas las fechas con datos históricos de una playlist
  getHistoricalDates(playlistId) {
    const indexKey = `spotify_dates_${playlistId}`;
    return JSON.parse(localStorage.getItem(indexKey) || '[]');
  },

  // Comparar dos periodos
  async comparePeriodsData(playlistId, startDate, endDate) {
    const startData = await this.getHistoricalData(playlistId, startDate);
    const endData = await this.getHistoricalData(playlistId, endDate);
    
    if (!startData || !endData) return null;
    
    return {
      followersGrowth: endData.followers - startData.followers,
      popularityChange: endData.popularity - startData.popularity,
      growthPercentage: ((endData.followers - startData.followers) / startData.followers * 100).toFixed(2),
      startFollowers: startData.followers,
      endFollowers: endData.followers,
      startDate,
      endDate
    };
  },

  // Obtener todos los tracks de una playlist con popularidad
  async getPlaylistTracks(playlistId, limit = 100) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${CONFIG.spotify.apiUrl}/playlists/${playlistId}/tracks?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn(`Error obteniendo tracks de playlist ${playlistId}`);
        return null;
      }

      const data = await response.json();
      
      // Extraer tracks con popularidad
      const tracks = data.items
        .filter(item => item.track) // Filtrar tracks válidos
        .map(item => ({
          id: item.track.id,
          name: item.track.name,
          popularity: item.track.popularity, // 0-100
          artists: item.track.artists.map(a => a.name).join(', '),
          album: item.track.album.name,
          url: item.track.external_urls.spotify
        }));
      
      return {
        total: data.total,
        tracks: tracks
      };
    } catch (error) {
      console.error(`Error obteniendo tracks de playlist ${playlistId}:`, error);
      return null;
    }
  },
  
  // Analizar salud de playlist (popularidad de tracks)
  async analyzePlaylistHealth(playlistId) {
    const tracksData = await this.getPlaylistTracks(playlistId);
    if (!tracksData || !tracksData.tracks) return null;
    
    const tracks = tracksData.tracks;
    const total = tracks.length;
    
    // Clasificar tracks por popularidad
    const lowPopularity = tracks.filter(t => t.popularity < 40).length;
    const mediumPopularity = tracks.filter(t => t.popularity >= 40 && t.popularity < 70).length;
    const highPopularity = tracks.filter(t => t.popularity >= 70).length;
    
    // Calcular promedios
    const avgPopularity = total > 0 
      ? (tracks.reduce((sum, t) => sum + t.popularity, 0) / total).toFixed(1)
      : 0;
    
    // Análisis de salud
    const lowPercentage = ((lowPopularity / total) * 100).toFixed(1);
    const mediumPercentage = ((mediumPopularity / total) * 100).toFixed(1);
    const highPercentage = ((highPopularity / total) * 100).toFixed(1);
    
    // Determinar estado de salud
    let healthStatus = 'excellent';
    let bottleneck = null;
    
    if (lowPopularity / total > 0.6) {
      healthStatus = 'poor';
      bottleneck = `${lowPercentage}% de tracks con baja popularidad (<40) es el principal cuello de botella`;
    } else if (lowPopularity / total > 0.4) {
      healthStatus = 'fair';
      bottleneck = `${lowPercentage}% de tracks con baja popularidad puede limitar el crecimiento`;
    } else if (lowPopularity / total > 0.2) {
      healthStatus = 'good';
    } else {
      healthStatus = 'excellent';
    }
    
    return {
      totalTracks: tracksData.total,
      analyzedTracks: total,
      avgPopularity: parseFloat(avgPopularity),
      distribution: {
        low: { count: lowPopularity, percentage: parseFloat(lowPercentage) },
        medium: { count: mediumPopularity, percentage: parseFloat(mediumPercentage) },
        high: { count: highPopularity, percentage: parseFloat(highPercentage) }
      },
      healthStatus: healthStatus,
      bottleneck: bottleneck,
      recommendations: this._getPlaylistHealthRecommendations(healthStatus, lowPercentage, total, tracksData.total)
    };
  },
  
  // Recomendaciones basadas en salud de playlist
  _getPlaylistHealthRecommendations(status, lowPercentage, analyzedTracks, totalTracks) {
    const recommendations = [];
    
    if (status === 'poor') {
      recommendations.push('🔴 URGENTE: Reemplazar tracks de baja popularidad (<40) con tracks más populares');
      recommendations.push('🎯 Objetivo: Reducir tracks de baja popularidad a menos del 40%');
      recommendations.push('🔍 Buscar tracks con popularidad >50 en el mismo género');
    } else if (status === 'fair') {
      recommendations.push('⚠️ Mejorar: Aumentar número de tracks con popularidad media-alta (40-70)');
      recommendations.push('🎵 Considerar rotar tracks de baja popularidad gradualmente');
    } else if (status === 'good') {
      recommendations.push('✅ Buena distribución de popularidad');
      recommendations.push('📈 Mantener equilibrio actual y añadir más tracks populares');
    } else {
      recommendations.push('🔥 Playlist en excelente estado');
      recommendations.push('✅ Continuar con la estrategia actual de curaduría');
    }
    
    // Recomendación de longitud
    if (totalTracks > 60) {
      recommendations.push(`⚠️ Playlist demasiado larga (${totalTracks} tracks) - Recomendado: máximo 60 tracks`);
      recommendations.push('✂️ Reducir longitud puede mejorar engagement y tiempo de escucha');
    } else if (totalTracks < 20) {
      recommendations.push(`📝 Playlist corta (${totalTracks} tracks) - Considerar añadir más contenido`);
    }
    
    return recommendations;
  },

  // Obtener datos de un track
  async getTrackData(trackId) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${CONFIG.spotify.apiUrl}/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo track ${trackId}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        popularity: data.popularity,
        url: data.external_urls.spotify,
        artists: data.artists.map(a => a.name).join(', '),
        album: data.album.name,
        imageUrl: data.album.images[0]?.url || null
      };
    } catch (error) {
      console.error(`Error obteniendo datos de track ${trackId}:`, error);
      return null;
    }
  },

  // Obtener número de saves de un track (aproximado via popularidad)
  async getTrackSaves(trackId) {
    const trackData = await this.getTrackData(trackId);
    if (!trackData) return null;
    
    // Spotify no da saves directamente, estimamos basado en popularidad
    // Popularidad 0-100 -> Estimación de saves
    const popularity = trackData.popularity;
    let estimatedSaves = 0;
    
    if (popularity >= 80) estimatedSaves = 50000 + (popularity - 80) * 5000;
    else if (popularity >= 60) estimatedSaves = 10000 + (popularity - 60) * 2000;
    else if (popularity >= 40) estimatedSaves = 2000 + (popularity - 40) * 400;
    else if (popularity >= 20) estimatedSaves = 500 + (popularity - 20) * 75;
    else estimatedSaves = popularity * 25;
    
    return {
      ...trackData,
      estimatedSaves: Math.floor(estimatedSaves)
    };
  },

  // Actualizar todos los datos de Spotify (ejecutar diariamente)
  async updateAllData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const allData = await this.getAllPlaylistsData();
      
      // Guardar datos de hoy
      for (const data of allData) {
        const artist = CONFIG.artists.find(a => a.name === data.artist);
        if (artist) {
          this.saveHistoricalData(artist.playlistId, today, data);
        }
      }
      
      // Actualizar tracks TrackBoost si están configurados
      const trackboostData = await this.updateTrackboostTracks();
      
      // Guardar snapshot completo
      localStorage.setItem(`spotify_snapshot_${today}`, JSON.stringify(allData));
      localStorage.setItem(`spotify_trackboost_${today}`, JSON.stringify(trackboostData));
      
      return { playlists: allData, tracks: trackboostData };
    } catch (error) {
      console.error('Error actualizando datos Spotify:', error);
      throw error;
    }
  },

  // Actualizar datos de tracks TrackBoost
  async updateTrackboostTracks() {
    const results = [];
    const tracks = HistoricalData.trackboostTracks;
    
    for (const [artistName, trackConfig] of Object.entries(tracks)) {
      if (trackConfig.trackId) {
        const trackData = await this.getTrackSaves(trackConfig.trackId);
        if (trackData) {
          const increase = trackConfig.baselineSaves > 0 
            ? trackData.estimatedSaves - trackConfig.baselineSaves 
            : 0;
            
          results.push({
            artist: artistName,
            ...trackData,
            baselineSaves: trackConfig.baselineSaves,
            savesIncrease: increase
          });
        }
      }
    }
    
    return results;
  }
};
