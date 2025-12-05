// ============================================
// ELIXIR DASHBOARD - CONFIGURACIÓN
// VERSION: 3.1 - STEBAN FORZADO (02/12/2025 - 22:30)
// ============================================

const CONFIG = {
  version: '3.1-steban-fix',
  // Credenciales Spotify API
  spotify: {
    clientId: 'd7a63fa3d16f4f42a105b482c37d0625',
    clientSecret: '3bd0331bf727485da62892da662c5345',
    apiUrl: 'https://api.spotify.com/v1'
  },

  // Presupuesto y Compromisos
  budget: {
    monthlyPerArtist: 150, // €150/mes por artista
    weeklyPerArtist: 37.5,  // €37.5/semana
    dailyPerArtist: 5.36,   // €5.36/día
    followerCommitment: 250 // 250 followers/mes objetivo
  },

  // Umbrales de Análisis
  thresholds: {
    targetCPF: 0.60,        // €0.60/follower objetivo
    goodCPF: 2.00,          // ≤€2.00 = buen rendimiento
    mediumCPF: 3.50,        // €2-3.50 = rendimiento medio
    highCPF: 3.50,          // >€3.50 = rendimiento bajo
    minFollowers: 50,       // Mínimo followers para considerar éxito
    minPopularity: 60       // Mínimo score popularidad Spotify
  },

  // Artistas y Playlists
  artists: [
    {
      name: 'MIKY Larus',
      playlistId: '1vFO8jmiG757zOsEMNdSUe',
      playlistUrl: 'https://open.spotify.com/playlist/1vFO8jmiG757zOsEMNdSUe',
      active: true,
      campaignKeywords: ['MIKY', 'Miky']
    },
    {
      name: 'JULIEN vertigo',
      playlistId: '5FI2qU3PgIJDKSF7hFBREo',
      playlistUrl: 'https://open.spotify.com/playlist/5FI2qU3PgIJDKSF7hFBREo',
      active: true,
      campaignKeywords: ['JULIEN', 'Julien']
    },
    {
      name: 'WILLEN',
      playlistId: '4GSqs7MZLxni1C6iaIJds4',
      playlistUrl: 'https://open.spotify.com/playlist/4GSqs7MZLxni1C6iaIJds4',
      active: true,
      campaignKeywords: ['WILLEN', 'Willen']
    },
    {
      name: 'ALEX KISLOV',
      playlistId: '5T9KBjEDNOP2rzBFq8Ears',
      playlistUrl: 'https://open.spotify.com/playlist/5T9KBjEDNOP2rzBFq8Ears',
      active: true,
      campaignKeywords: ['ALEX', 'Alex K']
    },
    {
      name: 'CHEMTRAILZ',
      playlistId: '1PYVPF72ApKIKj1q9HY3Po',
      playlistUrl: 'https://open.spotify.com/playlist/1PYVPF72ApKIKj1q9HY3Po',
      active: true,
      campaignKeywords: ['CHEMTRAILZ', 'Chemtrailz']
    },
    {
      name: 'Guimero',
      playlistId: '095wbl4L3vfhe2ykrTY6xR',
      playlistUrl: 'https://open.spotify.com/playlist/095wbl4L3vfhe2ykrTY6xR',
      active: true,
      campaignKeywords: ['Guimero', 'GUIMERO']
    },
    {
      name: 'Luna Lucci',
      playlistId: '1MOakk9Faadt2CWbFLSFuI',
      playlistUrl: 'https://open.spotify.com/playlist/1MOakk9Faadt2CWbFLSFuI',
      active: true,
      campaignKeywords: ['Luna', 'LUNA']
    },
    {
      name: 'Monsai',
      playlistId: '3aXy8ZkqBDz6sTPzrGuSzf',
      playlistUrl: 'https://open.spotify.com/playlist/3aXy8ZkqBDz6sTPzrGuSzf',
      active: true,
      campaignKeywords: ['Monsai', 'MONSAI']
    },
    {
      name: 'HEWKI',
      playlistId: '6qiOcuozSxbSfHfSZMhHxO',
      playlistUrl: 'https://open.spotify.com/playlist/6qiOcuozSxbSfHfSZMhHxO',
      active: true,
      campaignKeywords: ['HEWKI', 'Hewki']
    },
    {
      name: 'Honey',
      playlistId: '1EWmffKvfcERZzaVIXneg1',
      playlistUrl: 'https://open.spotify.com/playlist/1EWmffKvfcERZzaVIXneg1',
      active: true,
      campaignKeywords: ['Honey', 'HONEY']
    },
    {
      name: 'Fawad',
      playlistId: '1vjUPHCBa2hOLM7Z9n3FZb',
      playlistUrl: 'https://open.spotify.com/playlist/1vjUPHCBa2hOLM7Z9n3FZb',
      active: true,
      campaignKeywords: ['Fawad', 'FAWAD']
    },
    {
      name: 'XGuardians',
      playlistId: '3CzkPUjOIlIYyLCMcYmXAX',
      playlistUrl: 'https://open.spotify.com/playlist/3CzkPUjOIlIYyLCMcYmXAX',
      active: true,
      campaignKeywords: ['XGuardians', 'XGuard']
    },
    {
      name: 'PATO PESCIO',
      playlistId: '0MPwZB0Q3z7eMhHIfJLk4z',
      playlistUrl: 'https://open.spotify.com/playlist/0MPwZB0Q3z7eMhHIfJLk4z',
      active: true,
      campaignKeywords: ['PATO', 'Pato']
    },
    {
      name: 'Esther Lam', // UNIFICADO: Esther Lam = ESTHR (misma persona)
      playlistId: '5VUnoAgKh7ZDF89buKoHXW',
      playlistUrl: 'https://open.spotify.com/playlist/5VUnoAgKh7ZDF89buKoHXW',
      active: true,
      campaignKeywords: ['Esther', 'ESTHER', 'Esther Lam', 'ESTH', 'Espe', 'ESPE', 'ESTHR']
    },
    {
      name: 'MARK WISE',
      playlistId: '1TOdmi1ivfNb6VoNA3YI10',
      playlistUrl: 'https://open.spotify.com/playlist/1TOdmi1ivfNb6VoNA3YI10',
      active: true,
      campaignKeywords: ['MARK', 'Mark']
    },
    {
      name: 'Daniel Dee',
      playlistId: '4HrYvkTo2eiyiXRgewC0Fq',
      playlistUrl: 'https://open.spotify.com/playlist/4HrYvkTo2eiyiXRgewC0Fq',
      active: true,
      campaignKeywords: ['Daniel', 'DANIEL']
    },
    {
      name: 'Amadis',
      playlistId: '7MYdTYlTHoAg358pmNPjtA',
      playlistUrl: 'https://open.spotify.com/playlist/7MYdTYlTHoAg358pmNPjtA',
      active: true,
      campaignKeywords: ['Amadis', 'AMADIS']
    },
    {
      name: 'The Amplified Pianist',
      playlistId: '0sCksuVhoPwmOoIXzbONtT',
      playlistUrl: 'https://open.spotify.com/playlist/0sCksuVhoPwmOoIXzbONtT',
      active: true,
      campaignKeywords: ['Pianist', 'PIANIST', 'JOE']
    },
    {
      name: 'Steban',
      playlistId: '0beoPII2glh2MOROKA9gx0',
      playlistUrl: 'https://open.spotify.com/playlist/0beoPII2glh2MOROKA9gx0',
      active: true,
      campaignKeywords: ['Stban playlist', 'stban playlist'] // Solo keywords específicos, no genéricos
    },
    {
      name: 'Steban (TRCKBST Luz)',
      playlistId: null,
      playlistUrl: null,
      active: true,
      campaignKeywords: ['trckbst Stban', 'trckbst stban', 'trckbst luz'],
      isTrackboost: true,
      skipSpotify: true,
      budgetType: 'normal',
      budgetTotal: 500
    },
    {
      name: 'PATO PESCIO (TRCKBST Minotaur)',
      playlistId: null,
      playlistUrl: null,
      active: true,
      campaignKeywords: ['trckbst pato', 'trckbst PATO', 'minotaur', 'Minotaur'],
      isTrackboost: true,
      skipSpotify: true,
      budgetType: 'lite',
      budgetTotal: 200
    },
    {
      name: 'Kamadev',
      playlistId: '1KJlLjn2XYWCmZG3coodak',
      playlistUrl: 'https://open.spotify.com/playlist/1KJlLjn2XYWCmZG3coodak',
      active: true,
      campaignKeywords: ['Kamadev', 'KAMADEV']
    },
    {
      name: 'Andrew Weiss',
      playlistId: '7pZXm75VGAJSFlfwEZJAd8',
      playlistUrl: 'https://open.spotify.com/playlist/7pZXm75VGAJSFlfwEZJAd8',
      active: true,
      campaignKeywords: ['Andrew', 'ANDREW']
    },
    {
      name: 'Mainterm',
      playlistId: '21vs1sba7chaYFHT30JHuF',
      playlistUrl: 'https://open.spotify.com/playlist/21vs1sba7chaYFHT30JHuF',
      active: true,
      campaignKeywords: ['Mainterm', 'MAINTERM', 'Evan', 'EVAN']
    },
    {
      name: 'Rainbow',
      playlistId: '5rbWrTkhlYxCfVqxEwaXhG',
      playlistUrl: 'https://open.spotify.com/playlist/5rbWrTkhlYxCfVqxEwaXhG',
      active: true,
      campaignKeywords: ['Rainbow', 'RAINBOW']
    }
  ],

  // Formato de fechas
  dateFormat: {
    display: 'DD/MM/YYYY',
    api: 'YYYY-MM-DD'
  },

  // Columnas CSV Meta Ads
  metaAdsColumns: {
    startDate: 'Reporting starts',
    endDate: 'Reporting ends',
    campaignName: 'Campaign name',
    results: 'Results',
    costPerResult: 'Cost per results',
    amountSpent: 'Amount spent (EUR)',
    impressions: 'Impressions',
    reach: 'Reach'
  },

  // Lógica de Decisiones Estratégicas
  decisionMatrix: {
    // CPF ≤ €2 + Followers < 50 = Problema de cover/video
    goodCPF_lowFollowers: {
      condition: (cpf, followers) => cpf <= 2 && followers < 50,
      diagnosis: 'Buen CPF pero pocos followers',
      primaryAction: 'Cambiar cover de playlist',
      secondaryAction: 'Si no mejora en 1 semana, cambiar video',
      reasoning: 'Problema de atractivo visual, no de targeting'
    },
    // CPF ≤ €2 + Followers ≥ 50 = Rendimiento óptimo
    optimalPerformance: {
      condition: (cpf, followers) => cpf <= 2 && followers >= 50,
      diagnosis: 'Rendimiento óptimo',
      primaryAction: 'Mantener estrategia actual',
      secondaryAction: 'Considerar escalar presupuesto 20%',
      reasoning: 'Excelente eficiencia y volumen'
    },
    // CPF > €3.5 = Problema de campaña/targeting
    highCPF: {
      condition: (cpf) => cpf > 3.5,
      diagnosis: 'CPF alto - Problema de targeting',
      primaryAction: 'Revisar y optimizar targeting de campaña',
      secondaryAction: 'Probar audiencias similares o lookalike',
      reasoning: 'Segmentación de audiencia ineficiente'
    },
    // CPF medio (€2-3.5)
    mediumPerformance: {
      condition: (cpf, followers) => cpf > 2 && cpf <= 3.5,
      diagnosis: 'Rendimiento aceptable con margen de mejora',
      primaryAction: 'Optimizar ambos: cover + targeting',
      secondaryAction: 'A/B testing de creativos',
      reasoning: 'Múltiples factores afectando rendimiento'
    }
  }
};

// Función helper para encontrar artista por nombre de campaña
CONFIG.findArtistByCampaign = function(campaignName) {
  const campaignLower = campaignName.toLowerCase();
  
  // Recopilar todos los matches posibles con su longitud de keyword
  let matches = [];
  
  for (const artist of this.artists) {
    for (const keyword of artist.campaignKeywords) {
      const keywordLower = keyword.toLowerCase();
      if (campaignLower.includes(keywordLower)) {
        matches.push({
          artist: artist,
          keyword: keyword,
          keywordLength: keyword.length,
          isTrackboost: artist.isTrackboost || false
        });
      }
    }
  }
  
  if (matches.length === 0) return null;
  
  // REGLA 1: Si contiene "playlist" → forzar artista normal (no TrackBoost)
  if (campaignLower.includes('playlist')) {
    matches = matches.filter(m => !m.isTrackboost);
    if (matches.length === 0) return null;
  }
  
  // REGLA 2: Si contiene "trckbst" → forzar TrackBoost
  if (campaignLower.includes('trckbst')) {
    matches = matches.filter(m => m.isTrackboost);
    if (matches.length === 0) return null;
  }
  
  // Ordenar por longitud de keyword (más largo primero = más específico)
  matches.sort((a, b) => b.keywordLength - a.keywordLength);
  
  // Retornar el match más específico (keyword más largo)
  return matches[0].artist;
};

// Función helper para obtener decisión estratégica
CONFIG.getStrategicDecision = function(cpf, followers, popularity) {
  const matrix = this.decisionMatrix;
  
  if (matrix.goodCPF_lowFollowers.condition(cpf, followers)) {
    return matrix.goodCPF_lowFollowers;
  }
  if (matrix.optimalPerformance.condition(cpf, followers)) {
    return matrix.optimalPerformance;
  }
  if (matrix.highCPF.condition(cpf)) {
    return matrix.highCPF;
  }
  if (matrix.mediumPerformance.condition(cpf, followers)) {
    return matrix.mediumPerformance;
  }
  
  return null;
};
