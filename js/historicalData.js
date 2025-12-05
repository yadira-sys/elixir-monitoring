// ============================================
// DATOS HISTÓRICOS REALES - 31/10/2024
// ============================================

const HistoricalData = {
  // Snapshots manuales personalizados (creados por el usuario)
  manualSnapshots: {
    // Formato: '01/12/2025': { 'Artist': { followers: 3322, date: '01/12/2025' } }
  },
  
  // Histórico de reports generados
  reportHistory: [
    // Formato: { 
    //   fecha: '01/12/2025',
    //   startDate: '2025-12-01', 
    //   endDate: '2025-12-05',
    //   snapshotBase: '01/12/2025',
    //   generatedAt: '2025-12-05T10:30:00Z',
    //   data: {
    //     'Alex Kislov': { cpf: 0.38, increaseFollowers: 42, spent: 16.00, followersStart: 3280, followersEnd: 3322 }
    //   }
    // }
  ],
  
  // Datos REALES del 31/10/2024
  baseline: {
    '2024-10-31': {
      'ALEX KISLOV': { followers: 3197, oyentes: 0, seguidoresPerfil: 0 },
      'Amadis': { followers: 1807, oyentes: 0, seguidoresPerfil: 0 },
      'Andrew Weiss': { followers: 798, oyentes: 0, seguidoresPerfil: 0 },
      'CHEMTRAILZ': { followers: 2695, oyentes: 0, seguidoresPerfil: 0 },
      'Daniel Dee': { followers: 350, oyentes: 0, seguidoresPerfil: 0 },
      'ESTHR': { followers: 264, oyentes: 0, seguidoresPerfil: 0 },
      'Esther Lam': { followers: 264, oyentes: 0, seguidoresPerfil: 0 }, // Mismo que ESTHR
      'MARK WISE': { followers: 485, oyentes: 0, seguidoresPerfil: 0 },
      'Fawad': { followers: 2578, oyentes: 0, seguidoresPerfil: 0 },
      'Guimero': { followers: 4124, oyentes: 0, seguidoresPerfil: 0 },
      'HEWKI': { followers: 3722, oyentes: 0, seguidoresPerfil: 0 },
      'Honey': { followers: 2787, oyentes: 0, seguidoresPerfil: 0 },
      'JULIEN vertigo': { followers: 21544, oyentes: 0, seguidoresPerfil: 0 },
      'Kamadev': { followers: 10712, oyentes: 0, seguidoresPerfil: 0 },
      'Luna Lucci': { followers: 1987, oyentes: 0, seguidoresPerfil: 0 },
      'Mainterm': { followers: 47886, oyentes: 0, seguidoresPerfil: 0 },
      'MIKY Larus': { followers: 7702, oyentes: 0, seguidoresPerfil: 0 },
      'Monsai': { followers: 2307, oyentes: 0, seguidoresPerfil: 0 },
      'PATO PESCIO': { followers: 954, oyentes: 0, seguidoresPerfil: 0 },
      'The Amplified Pianist': { followers: 3257, oyentes: 0, seguidoresPerfil: 0 },
      'Rainbow': { followers: 261, oyentes: 0, seguidoresPerfil: 0 },
      'WILLEN': { followers: 8150, oyentes: 0, seguidoresPerfil: 0 },
      'XGuardians': { followers: 2010, oyentes: 0, seguidoresPerfil: 0 },
      'Steban': { followers: 135, oyentes: 0, seguidoresPerfil: 0 }
    },
    '2025-10-31': {
      'ALEX KISLOV': { followers: 3197, oyentes: 0, seguidoresPerfil: 0 },
      'Amadis': { followers: 1807, oyentes: 0, seguidoresPerfil: 0 },
      'Andrew Weiss': { followers: 798, oyentes: 0, seguidoresPerfil: 0 },
      'CHEMTRAILZ': { followers: 2695, oyentes: 0, seguidoresPerfil: 0 },
      'Daniel Dee': { followers: 350, oyentes: 0, seguidoresPerfil: 0 },
      'ESTHR': { followers: 264, oyentes: 0, seguidoresPerfil: 0 },
      'Esther Lam': { followers: 264, oyentes: 0, seguidoresPerfil: 0 }, // Mismo que ESTHR
      'MARK WISE': { followers: 485, oyentes: 0, seguidoresPerfil: 0 },
      'Fawad': { followers: 2578, oyentes: 0, seguidoresPerfil: 0 },
      'Guimero': { followers: 4124, oyentes: 0, seguidoresPerfil: 0 },
      'HEWKI': { followers: 3722, oyentes: 0, seguidoresPerfil: 0 },
      'Honey': { followers: 2787, oyentes: 0, seguidoresPerfil: 0 },
      'JULIEN vertigo': { followers: 21544, oyentes: 0, seguidoresPerfil: 0 },
      'Kamadev': { followers: 10712, oyentes: 0, seguidoresPerfil: 0 },
      'Luna Lucci': { followers: 1987, oyentes: 0, seguidoresPerfil: 0 },
      'Mainterm': { followers: 47886, oyentes: 0, seguidoresPerfil: 0 },
      'MIKY Larus': { followers: 7702, oyentes: 0, seguidoresPerfil: 0 },
      'Monsai': { followers: 2307, oyentes: 0, seguidoresPerfil: 0 },
      'PATO PESCIO': { followers: 954, oyentes: 0, seguidoresPerfil: 0 },
      'The Amplified Pianist': { followers: 3257, oyentes: 0, seguidoresPerfil: 0 },
      'Rainbow': { followers: 261, oyentes: 0, seguidoresPerfil: 0 },
      'WILLEN': { followers: 8150, oyentes: 0, seguidoresPerfil: 0 },
      'XGuardians': { followers: 2010, oyentes: 0, seguidoresPerfil: 0 },
      'Steban': { followers: 135, oyentes: 0, seguidoresPerfil: 0 }
    }
  },

  // Histórico mensual (primer día de cada mes)
  monthlySnapshots: {
    '2024-10-01': {},  // Histórico real
    '2024-11-01': {},  // Histórico real
    '2025-11-01': {},
    '2025-12-01': {}
  },

  // Tracks TrackBoost (configuración manual)
  trackboostTracks: {
    'PATO PESCIO (TRCKBST Minotaur)': {
      trackId: '',
      trackUrl: '',
      trackName: 'Minotaur',
      baselineSaves: 0,
      currentSaves: 0,     // MANUAL - Saves actuales
      lastSaves: 0,        // MANUAL - Saves del corte anterior (para calcular Coste/Save)
      streams: 0,          // MANUAL
      baselineDate: '2025-10-31',
      // NUEVOS CAMPOS PUNTO B
      gastoTotalCampana: 0    // MANUAL - Gasto total desde inicio
    },
    'Steban (TRCKBST Luz)': {
      trackId: '',
      trackUrl: '',
      trackName: 'Luz',
      baselineSaves: 0,
      currentSaves: 0,     // MANUAL - Saves actuales
      lastSaves: 0,        // MANUAL - Saves del corte anterior (para calcular Coste/Save)
      streams: 0,          // MANUAL
      baselineDate: '2025-10-31',
      // NUEVOS CAMPOS PUNTO B
      gastoTotalCampana: 0    // MANUAL - Gasto total desde inicio
    }
  },

  // Obtener baseline de un artista para una fecha
  getArtistBaseline(artistName, date = '2025-10-31') {
    const snapshot = this.baseline[date];
    if (!snapshot) return null;
    
    const data = snapshot[artistName];
    if (!data) return null;
    
    // Obtener playlist link del config
    const artist = CONFIG.artists.find(a => a.name === artistName);
    const playlistLink = artist ? artist.playlistUrl : '';
    
    return {
      playlistFollowers: data.followers,
      monthlyListeners: data.oyentes,
      profileFollowers: data.seguidoresPerfil,
      playlistLink: playlistLink,
      date: date
    };
  },

  // Guardar snapshot del primer día del mes
  saveMonthlySnapshot(date, artistName, data) {
    const monthKey = this.getFirstDayOfMonth(date);
    
    if (!this.monthlySnapshots[monthKey]) {
      this.monthlySnapshots[monthKey] = {};
    }
    
    this.monthlySnapshots[monthKey][artistName] = {
      followers: data.followers,
      oyentes: data.oyentes || 0,
      seguidoresPerfil: data.seguidoresPerfil || 0,
      date: date
    };
    
    // Guardar en localStorage
    localStorage.setItem('monthly_snapshots', JSON.stringify(this.monthlySnapshots));
  },

  // Obtener primer día del mes de una fecha
  getFirstDayOfMonth(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  },

  // Verificar si hoy es día 1 y guardar snapshot
  async checkAndSaveMonthlySnapshot() {
    const today = new Date();
    const day = today.getDate();
    
    if (day === 1) {
      // Es día 1 del mes, guardar snapshot de todos los artistas
      console.log('🗓️ Día 1 del mes - Guardando snapshot mensual...');
      
      const todayStr = today.toISOString().split('T')[0];
      const monthKey = this.getFirstDayOfMonth(todayStr);
      
      // Obtener datos actuales de Spotify
      const spotifyData = await SpotifyAPI.getAllPlaylistsData();
      
      spotifyData.forEach(data => {
        this.saveMonthlySnapshot(todayStr, data.artist, {
          followers: data.followers,
          oyentes: 0,  // Manual
          seguidoresPerfil: 0  // Manual
        });
      });
      
      console.log('✅ Snapshot mensual guardado');
      return true;
    }
    
    return false;
  },

  // Obtener track TrackBoost
  getTrackboostTrack(artistName) {
    return this.trackboostTracks[artistName] || null;
  },

  // Calcular increase de followers
  calculateFollowerIncrease(artistName, currentFollowers, baselineDate = '2025-10-31') {
    const baseline = this.getArtistBaseline(artistName, baselineDate);
    if (!baseline) return null;
    
    return {
      baseline: baseline.playlistFollowers,
      current: currentFollowers,
      increase: currentFollowers - baseline.playlistFollowers,
      increasePercentage: ((currentFollowers - baseline.playlistFollowers) / baseline.playlistFollowers * 100).toFixed(2)
    };
  },

  // Actualizar configuración TrackBoost
  updateTrackboostConfig(artistName, config) {
    if (this.trackboostTracks[artistName]) {
      this.trackboostTracks[artistName] = {
        ...this.trackboostTracks[artistName],
        ...config
      };
      // Guardar en localStorage
      localStorage.setItem('trackboost_config', JSON.stringify(this.trackboostTracks));
    }
  },

  // Cargar configuración guardada
  loadSavedConfig() {
    const saved = localStorage.getItem('trackboost_config');
    if (saved) {
      this.trackboostTracks = JSON.parse(saved);
    }
    
    const snapshots = localStorage.getItem('monthly_snapshots');
    if (snapshots) {
      this.monthlySnapshots = JSON.parse(snapshots);
    }
  },

  // Actualizar datos manuales (oyentes, seguidores perfil)
  updateManualData(artistName, date, oyentes, seguidoresPerfil) {
    const monthKey = this.getFirstDayOfMonth(date);
    
    if (!this.monthlySnapshots[monthKey]) {
      this.monthlySnapshots[monthKey] = {};
    }
    
    if (!this.monthlySnapshots[monthKey][artistName]) {
      this.monthlySnapshots[monthKey][artistName] = {
        followers: 0,
        oyentes: 0,
        seguidoresPerfil: 0
      };
    }
    
    this.monthlySnapshots[monthKey][artistName].oyentes = oyentes;
    this.monthlySnapshots[monthKey][artistName].seguidoresPerfil = seguidoresPerfil;
    
    localStorage.setItem('monthly_snapshots', JSON.stringify(this.monthlySnapshots));
  }
};

// Cargar config guardada al iniciar
HistoricalData.loadSavedConfig();

// Verificar si es día 1 y guardar snapshot automáticamente
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    HistoricalData.checkAndSaveMonthlySnapshot();
  }, 2000);
});
