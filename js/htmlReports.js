// ============================================
// GENERADOR DE REPORTES HTML CON BRANDING ELIXIR
// ============================================

const HTMLReports = {
  
  // Generar report individual por artista (procesado + HTML)
  async generateArtistHTMLReport(artistName, startDate, endDate) {
    // Obtener datos del artista
    const campaigns = App.data.enrichedData.filter(c => 
      c.artist === artistName && 
      !c.artistData?.isTrackboost
    );
    
    if (campaigns.length === 0) {
      throw new Error(`No hay campañas para ${artistName} en este periodo`);
    }
    
    // FORZAR mapeo para Steban
    let realArtistName = artistName;
    if (artistName.toLowerCase() === 'stban' || artistName.toLowerCase() === 'steban') {
      realArtistName = 'Steban'; // FORZAR artista de playlist
    }
    
    // Baseline
    const baseline = HistoricalData.getArtistBaseline(realArtistName, '2024-10-31');
    if (!baseline) {
      throw new Error(`No hay baseline para ${realArtistName} (original: ${artistName})`);
    }
    
    // Artista config
    const artist = CONFIG.artists.find(a => a.name === realArtistName);
    if (!artist) {
      throw new Error(`Artista ${realArtistName} (original: ${artistName}) no encontrado en configuración`);
    }
    
    // Spotify data - CORREGIDO: usar playlistFollowers
    let spotifyData = null;
    let playlistHealth = null;
    let currentFollowers = baseline.playlistFollowers || 0;
    
    if (artist.playlistId && !artist.skipSpotify) {
      try {
        spotifyData = await SpotifyAPI.getPlaylistData(artist.playlistId);
        if (spotifyData) {
          currentFollowers = spotifyData.followers;
        }
        
        // NUEVO: Analizar salud de playlist
        console.log(`📊 Analizando salud de playlist para ${artistName}...`);
        playlistHealth = await SpotifyAPI.analyzePlaylistHealth(artist.playlistId);
        if (playlistHealth) {
          console.log(`✅ Análisis de salud completado:`, playlistHealth);
        }
      } catch (error) {
        console.warn(`No se pudo obtener datos de Spotify para ${artistName}`);
      }
    }
    
    // Calcular métricas - CORREGIDO: usar playlistFollowers
    const totalSpent = campaigns.reduce((s, c) => s + (c.amountSpent || 0), 0);
    const totalResults = campaigns.reduce((s, c) => s + (c.results || 0), 0);
    const totalReach = campaigns.reduce((s, c) => s + (c.reach || 0), 0);
    const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
    const baselineFollowers = baseline.playlistFollowers || 0;
    const increase = currentFollowers - baselineFollowers;
    const costPerFollower = increase > 0 ? totalSpent / increase : 0;
    
    // NUEVAS MÉTRICAS AVANZADAS
    const avgCTR = totalImpressions > 0 ? (totalResults / totalImpressions * 100).toFixed(2) : 0;
    const avgCPM = totalImpressions > 0 ? (totalSpent / totalImpressions * 1000).toFixed(2) : 0;
    const avgCostPerClick = totalResults > 0 ? (totalSpent / totalResults).toFixed(2) : 0;
    const conversionRate = totalReach > 0 ? (increase / totalReach * 100).toFixed(2) : 0;
    
    // Preparar data para el HTML generator
    const data = {
      artist: artistName,
      period: { start: startDate, end: endDate },
      metrics: {
        spent: totalSpent || 0,
        results: totalResults || 0,
        reach: totalReach || 0,
        impressions: totalImpressions || 0,
        followersStart: baselineFollowers,
        followersEnd: currentFollowers,
        increase: increase,
        costPerFollower: costPerFollower || 0,
        monthlyListeners: baseline.monthlyListeners || 0,
        profileFollowers: baseline.profileFollowers || 0,
        // Nuevas métricas avanzadas
        avgCTR: avgCTR,
        avgCPM: avgCPM,
        avgCostPerClick: avgCostPerClick,
        conversionRate: conversionRate
      },
      spotifyData: spotifyData || { popularity: 'N/A' },
      playlistHealth: playlistHealth, // NUEVO: Análisis de salud
      campaigns: campaigns
    };
    
    // Generar HTML
    return this._generateArtistHTML(data);
  },
  
  // Generar HTML (interno)
  _generateArtistHTML(data) {
    const { artist, period, metrics, spotifyData, playlistHealth, campaigns } = data;
    
    // Agrupar campañas para evitar duplicados
    const totalConversions = metrics.results || 0;
    const totalReach = metrics.reach || 0;
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report ${artist} - ELIXIR</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #070616 0%, #0a0824 100%);
      color: #FFFFFF;
      padding: 20px;
      line-height: 1.6;
      min-height: 100vh;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto;
      width: 100%;
    }
    
    /* RESPONSIVE MOBILE */
    @media (max-width: 768px) {
      body { padding: 10px; }
      .container { padding: 0; }
    }
    
    /* Header */
    header {
      background: rgba(7, 6, 22, 0.9);
      backdrop-filter: blur(15px);
      padding: 2rem 1.5rem;
      border-radius: 20px;
      border: 3px solid #EA34FA;
      margin-bottom: 2rem;
      text-align: center;
      box-shadow: 0 10px 40px rgba(234, 52, 250, 0.3);
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #EA34FA 0%, #ff6bff 50%, #EA34FA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      word-wrap: break-word;
    }
    .artist-name {
      font-size: 1.5rem;
      color: #FFFFFF;
      font-weight: 700;
      margin: 1rem 0;
      word-wrap: break-word;
    }
    .period {
      color: #9ca3af;
      font-size: 1rem;
      font-weight: 500;
    }
    
    /* RESPONSIVE HEADER */
    @media (max-width: 768px) {
      header {
        padding: 1.5rem 1rem;
        border-radius: 15px;
        border-width: 2px;
        margin-bottom: 1.5rem;
      }
      h1 {
        font-size: 1.8rem;
        letter-spacing: 1px;
      }
      .artist-name {
        font-size: 1.3rem;
        margin: 0.75rem 0;
      }
      .period {
        font-size: 0.9rem;
      }
    }
    
    @media (max-width: 480px) {
      h1 { font-size: 1.5rem; }
      .artist-name { font-size: 1.1rem; }
      .period { font-size: 0.85rem; }
    }
    
    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }
    
    /* RESPONSIVE KPI GRID */
    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin: 1.5rem 0;
      }
    }
    
    @media (max-width: 480px) {
      .kpi-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
        margin: 1rem 0;
      }
    }
    .kpi-card {
      background: linear-gradient(135deg, rgba(234, 52, 250, 0.15) 0%, rgba(234, 52, 250, 0.05) 100%);
      border: 2px solid rgba(234, 52, 250, 0.4);
      border-radius: 16px;
      padding: 1.5rem 1rem;
      text-align: center;
      transition: transform 0.3s, box-shadow 0.3s;
      position: relative;
      overflow: hidden;
    }
    
    /* RESPONSIVE KPI CARD */
    @media (max-width: 768px) {
      .kpi-card {
        padding: 1.25rem 1rem;
        border-radius: 12px;
      }
    }
    
    @media (max-width: 480px) {
      .kpi-card {
        padding: 1rem 0.75rem;
        border-radius: 10px;
      }
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, #EA34FA 0%, #ff6bff 100%);
    }
    .kpi-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(234, 52, 250, 0.4);
    }
    .kpi-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      filter: drop-shadow(0 4px 8px rgba(234, 52, 250, 0.5));
    }
    .kpi-label {
      font-size: 0.85rem;
      color: #c4b5fd;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .kpi-value {
      font-size: 2rem;
      font-weight: 900;
      background: linear-gradient(135deg, #EA34FA 0%, #ff6bff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-top: 0.5rem;
      word-wrap: break-word;
    }
    .kpi-sublabel {
      font-size: 0.8rem;
      color: #9ca3af;
      margin-top: 0.5rem;
      word-wrap: break-word;
    }
    
    /* RESPONSIVE KPI CONTENT */
    @media (max-width: 768px) {
      .kpi-icon { font-size: 2rem; }
      .kpi-label { font-size: 0.75rem; }
      .kpi-value { font-size: 1.75rem; }
      .kpi-sublabel { font-size: 0.75rem; }
    }
    
    @media (max-width: 480px) {
      .kpi-icon { font-size: 1.75rem; }
      .kpi-label { font-size: 0.7rem; letter-spacing: 0; }
      .kpi-value { font-size: 1.5rem; }
      .kpi-sublabel { font-size: 0.7rem; }
    }
    .positive { color: #6ee7b7 !important; }
    .negative { color: #fca5a5 !important; }
    
    /* Sections */
    .section {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2.5rem;
      border: 1px solid rgba(234, 52, 250, 0.2);
      margin-bottom: 2.5rem;
    }
    .section-title {
      font-size: 1.75rem;
      color: #EA34FA;
      margin-bottom: 2rem;
      border-bottom: 3px solid #EA34FA;
      padding-bottom: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* Spotify Data */
    .spotify-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin: 1.5rem 0;
    }
    .spotify-item {
      background: rgba(234, 52, 250, 0.1);
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(234, 52, 250, 0.3);
    }
    .spotify-item-label {
      font-size: 0.9rem;
      color: #c4b5fd;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    .spotify-item-value {
      font-size: 1.75rem;
      color: #FFFFFF;
      font-weight: 700;
    }
    
    /* Analysis */
    .analysis {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
      border-left: 5px solid #10b981;
      padding: 1.5rem;
      border-radius: 12px;
      margin: 1.5rem 0;
    }
    .analysis h3 {
      color: #6ee7b7;
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    .insight-item {
      padding: 0.75rem 0;
      font-size: 1rem;
      color: #FFFFFF;
    }
    
    /* Progress Bar */
    .progress-container {
      background: rgba(0,0,0,0.3);
      border-radius: 10px;
      height: 30px;
      margin: 1.5rem 0;
      overflow: hidden;
      position: relative;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #EA34FA 0%, #ff6bff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      transition: width 0.5s ease;
    }
    
    /* Footer */
    footer {
      text-align: center;
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 3px solid #EA34FA;
      color: #9ca3af;
      font-size: 0.95rem;
    }
    footer p { margin: 0.5rem 0; }
    .elixir-logo {
      font-size: 1.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #EA34FA 0%, #ff6bff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎵 REPORT INDIVIDUAL</h1>
      <div class="artist-name">${artist}</div>
      <p class="period">Periodo: ${this.formatDate(period.start)} - ${this.formatDate(period.end)}</p>
    </header>
    
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">👥</div>
        <div class="kpi-label">Followers Ganados</div>
        <div class="kpi-value ${metrics.increase > 0 ? 'positive' : 'negative'}">
          ${metrics.increase >= 0 ? '+' : ''}${metrics.increase}
        </div>
        <div class="kpi-sublabel">${(metrics.followersStart || 0).toLocaleString()} → ${(metrics.followersEnd || 0).toLocaleString()}</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">💵</div>
        <div class="kpi-label">€/Follower</div>
        <div class="kpi-value">€${metrics.costPerFollower.toFixed(2)}</div>
        <div class="kpi-sublabel">${metrics.costPerFollower < 0.50 ? 'Excelente ✓' : metrics.costPerFollower < 0.70 ? 'Bueno' : metrics.costPerFollower < 0.99 ? 'Revisar ⚠️' : 'Crítico 🔴'}</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div class="kpi-label">Conversiones</div>
        <div class="kpi-value">${totalConversions}</div>
        <div class="kpi-sublabel">Clicks totales</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">📡</div>
        <div class="kpi-label">Alcance Total</div>
        <div class="kpi-value">${(totalReach || 0).toLocaleString()}</div>
        <div class="kpi-sublabel">Personas alcanzadas</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">📈 Datos Spotify</h2>
      <div class="spotify-grid">
        <div class="spotify-item">
          <div class="spotify-item-label">Playlist Followers Inicio</div>
          <div class="spotify-item-value">${(metrics.followersStart || 0).toLocaleString()}</div>
        </div>
        <div class="spotify-item">
          <div class="spotify-item-label">Playlist Followers Final</div>
          <div class="spotify-item-value">${(metrics.followersEnd || 0).toLocaleString()}</div>
        </div>
        <div class="spotify-item">
          <div class="spotify-item-label">Increase</div>
          <div class="spotify-item-value ${metrics.increase > 0 ? 'positive' : 'negative'}">
            ${metrics.increase >= 0 ? '+' : ''}${metrics.increase}
          </div>
        </div>
        <div class="spotify-item">
          <div class="spotify-item-label">Popularidad</div>
          <div class="spotify-item-value">${spotifyData?.popularity || 'N/A'}/100</div>
        </div>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar" style="width: ${Math.min((metrics.increase / 250) * 100, 100)}%">
          ${Math.round((metrics.increase / 250) * 100)}% del objetivo (250 followers)
        </div>
      </div>
    </div>
    
    ${this._generatePlaylistHealthSection(playlistHealth, metrics, period, spotifyData)}
    
    ${this._generateMilestonesSection(metrics, period)}
    
    <!-- NUEVA SECCIÓN: MÉTRICAS META ADS -->
    <div class="section">
      <h2 class="section-title">📊 Métricas Meta Ads (Detalladas)</h2>
      <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        <div class="kpi-card" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));">
          <div class="kpi-icon" style="font-size: 1.8rem;">👁️</div>
          <div class="kpi-label">Impressions</div>
          <div class="kpi-value" style="font-size: 1.5rem;">${metrics.impressions.toLocaleString()}</div>
          <div class="kpi-sublabel">Veces que se mostró el ad</div>
        </div>
        
        <div class="kpi-card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));">
          <div class="kpi-icon" style="font-size: 1.8rem;">📡</div>
          <div class="kpi-label">Reach</div>
          <div class="kpi-value" style="font-size: 1.5rem;">${metrics.reach.toLocaleString()}</div>
          <div class="kpi-sublabel">Personas únicas alcanzadas</div>
        </div>
        
        <div class="kpi-card" style="background: linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(251, 146, 60, 0.05));">
          <div class="kpi-icon" style="font-size: 1.8rem;">🎯</div>
          <div class="kpi-label">CTR (Click-Through Rate)</div>
          <div class="kpi-value" style="font-size: 1.5rem;">${metrics.avgCTR}%</div>
          <div class="kpi-sublabel">${metrics.avgCTR < 0.5 ? 'Bajo - Mejorar creatividad' : metrics.avgCTR < 1.5 ? 'Normal' : metrics.avgCTR < 3 ? 'Bueno ✓' : 'Excelente! 🔥'}</div>
        </div>
        
        <div class="kpi-card" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05));">
          <div class="kpi-icon" style="font-size: 1.8rem;">💰</div>
          <div class="kpi-label">CPM (Cost Per Mille)</div>
          <div class="kpi-value" style="font-size: 1.5rem;">€${metrics.avgCPM}</div>
          <div class="kpi-sublabel">Por cada 1,000 impresiones</div>
        </div>
        
        <div class="kpi-card" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.05));">
          <div class="kpi-icon" style="font-size: 1.8rem;">👆</div>
          <div class="kpi-label">Coste/Click</div>
          <div class="kpi-value" style="font-size: 1.5rem;">€${metrics.avgCostPerClick}</div>
          <div class="kpi-sublabel">${metrics.avgCostPerClick > 0.20 ? '🔴 Alto (>€0.20)' : '✅ Óptimo'}</div>
        </div>
        
        <div class="kpi-card" style="background: linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(34, 211, 238, 0.05));">
          <div class="kpi-icon" style="font-size: 1.8rem;">🎵</div>
          <div class="kpi-label">Tasa Conversión Playlist</div>
          <div class="kpi-value" style="font-size: 1.5rem;">${metrics.conversionRate}%</div>
          <div class="kpi-sublabel">Reach → Followers</div>
        </div>
      </div>
    </div>
    
    <!-- NUEVA SECCIÓN: ANÁLISIS COMPLETO -->
    <div class="section">
      <h2 class="section-title">💡 Análisis Profundo & Insights</h2>
      <div class="analysis">
        <h3 style="margin-bottom: 1rem; color: #EA34FA;">📈 Rendimiento General</h3>
        <div class="insight-item" style="padding: 15px; background: ${metrics.increase > 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 146, 60, 0.1)'}; border-left: 4px solid ${metrics.increase > 50 ? '#10b981' : '#fb923c'}; margin-bottom: 10px;">
          <strong>Crecimiento de Followers:</strong> ${metrics.increase >= 0 ? '+' : ''}${metrics.increase} followers (${metrics.followersStart} → ${metrics.followersEnd})
          <br><small style="color: #9ca3af;">${metrics.increase >= 100 ? '🔥 Crecimiento excepcional!' : metrics.increase >= 50 ? '✅ Buen volumen de crecimiento' : metrics.increase >= 20 ? '👍 Crecimiento moderado' : '⚠️ Volumen bajo - Considera aumentar presupuesto o mejorar targeting'}</small>
        </div>
        
        <div class="insight-item" style="padding: 15px; background: ${metrics.costPerFollower < 0.50 ? 'rgba(16, 185, 129, 0.1)' : metrics.costPerFollower < 0.70 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-left: 4px solid ${metrics.costPerFollower < 0.50 ? '#10b981' : metrics.costPerFollower < 0.70 ? '#eab308' : '#ef4444'}; margin-bottom: 10px;">
          <strong>Eficiencia de Coste (CPF):</strong> €${metrics.costPerFollower.toFixed(2)}/follower
          <br><small style="color: #9ca3af;">${
            metrics.costPerFollower < 0.50 ? '✅ Excelente eficiencia - Mantener estrategia actual' : 
            metrics.costPerFollower < 0.70 ? '👍 Buena eficiencia - Dentro del rango óptimo' : 
            metrics.costPerFollower < 0.99 ? '⚠️ CPF elevado - Revisar targeting, creatividad y audiencias' :
            '🔴 CPF crítico - Optimización urgente: cambiar cover de playlist, refinar targeting, probar nuevas audiencias'
          }</small>
        </div>
        
        <div class="insight-item" style="padding: 15px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; margin-bottom: 10px;">
          <strong>Engagement Meta Ads:</strong> CTR ${metrics.avgCTR}% | CPM €${metrics.avgCPM} | Coste/Click €${metrics.avgCostPerClick}
          <br><small style="color: #9ca3af;">${
            metrics.avgCTR >= 2 ? '🔥 CTR excelente - Tu creatividad está funcionando muy bien' :
            metrics.avgCTR >= 1 ? '✅ CTR bueno - Anuncios efectivos' :
            metrics.avgCTR >= 0.5 ? '👍 CTR aceptable - Considera A/B testing de creatividades' :
            '⚠️ CTR bajo - Urgente mejorar copy, imágenes o video del anuncio'
          }</small>
        </div>
        
        <div class="insight-item" style="padding: 15px; background: rgba(236, 72, 153, 0.1); border-left: 4px solid #ec4899; margin-bottom: 10px;">
          <strong>Conversión Reach → Playlist:</strong> ${metrics.conversionRate}% (${metrics.reach.toLocaleString()} personas → ${metrics.increase} followers)
          <br><small style="color: #9ca3af;">${
            metrics.conversionRate >= 5 ? '🔥 Conversión excepcional - Tu playlist es muy atractiva' :
            metrics.conversionRate >= 2 ? '✅ Conversión buena - La playlist conecta con la audiencia' :
            metrics.conversionRate >= 1 ? '👍 Conversión aceptable' :
            '⚠️ Conversión baja - Mejorar cover de playlist, descripción y primeras canciones'
          }</small>
        </div>
        
        <h3 style="margin: 2rem 0 1rem 0; color: #EA34FA;">🎯 Recomendaciones Estratégicas</h3>
        <div style="background: linear-gradient(135deg, rgba(234, 52, 250, 0.1), rgba(139, 92, 246, 0.1)); padding: 20px; border-radius: 12px; border: 2px solid rgba(234, 52, 250, 0.3);">
          ${this._generateRecommendations(metrics, spotifyData)}
        </div>
        
        <h3 style="margin: 2rem 0 1rem 0; color: #EA34FA;">📊 Proyección de Crecimiento</h3>
        <div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 12px; border: 2px solid rgba(59, 130, 246, 0.3);">
          ${this._generateProjections(metrics, period)}
        </div>
      </div>
    </div>
    
    <footer>
      <p>Report generado por ELIXIR Dashboard</p>
      <p>${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      <div class="elixir-logo">ELIXIR</div>
    </footer>
  </div>
</body>
</html>
    `;
  },
  
  // Generar report TrackBoost (HTML visual) - AGRUPADO POR ARTISTA
  async generateTrackBoostHTMLReport(campaigns, startDate, endDate) {
    const trackBoostByArtist = {};
    
    // AGRUPAR campañas por artista primero
    campaigns.forEach(campaign => {
      const artistName = campaign.artist;
      if (!trackBoostByArtist[artistName]) {
        trackBoostByArtist[artistName] = {
          artist: artistName,
          campaigns: [],
          totalGasto: 0,
          totalConversiones: 0,
          totalAlcance: 0
        };
      }
      trackBoostByArtist[artistName].campaigns.push(campaign);
      trackBoostByArtist[artistName].totalGasto += campaign.amountSpent;
      trackBoostByArtist[artistName].totalConversiones += campaign.results;
      trackBoostByArtist[artistName].totalAlcance += campaign.reach;
    });
    
    const trackBoostData = [];
    
    // Obtener datos de cada artista TrackBoost (AGRUPADO)
    for (const [artistName, artistData] of Object.entries(trackBoostByArtist)) {
      const trackConfig = HistoricalData.getTrackboostTrack(artistName);
      
      if (!trackConfig || !trackConfig.trackId) {
        trackBoostData.push({
          artist: artistName,
          trackName: trackConfig?.trackName || 'N/A',
          gasto: artistData.totalGasto,
          conversiones: artistData.totalConversiones,
          alcance: artistData.totalAlcance,
          saves: 'N/A',
          popularidad: 'N/A',
          error: 'Track ID no configurado'
        });
        continue;
      }
      
      // Obtener datos reales del track de Spotify
      try {
        const trackData = await SpotifyAPI.getTrackData(trackConfig.trackId);
        
        // Estimar saves basados en popularidad
        let estimatedSaves = 'N/A';
        if (trackData && trackData.popularity) {
          const pop = trackData.popularity;
          if (pop >= 80) estimatedSaves = Math.floor(50000 + (pop - 80) * 5000);
          else if (pop >= 60) estimatedSaves = Math.floor(10000 + (pop - 60) * 2000);
          else if (pop >= 40) estimatedSaves = Math.floor(2000 + (pop - 40) * 400);
          else if (pop >= 20) estimatedSaves = Math.floor(500 + (pop - 20) * 75);
          else estimatedSaves = Math.floor(pop * 25);
        }
        
        trackBoostData.push({
          artist: artistName,
          trackName: trackData?.name || trackConfig.trackName,
          gasto: artistData.totalGasto,
          conversiones: artistData.totalConversiones,
          alcance: artistData.totalAlcance,
          saves: estimatedSaves,
          popularidad: trackData?.popularity || 'N/A',
          error: null
        });
      } catch (error) {
        console.error(`Error obteniendo datos de track para ${artistName}:`, error);
        trackBoostData.push({
          artist: artistName,
          trackName: trackConfig.trackName,
          gasto: artistData.totalGasto,
          conversiones: artistData.totalConversiones,
          alcance: artistData.totalAlcance,
          saves: 'Config faltante',
          popularidad: 'Config faltante',
          error: 'Track ID no configurado o inválido'
        });
      }
    }
    
    const totalGasto = trackBoostData.reduce((s, t) => s + t.gasto, 0);
    const totalConv = trackBoostData.reduce((s, t) => s + t.conversiones, 0);
    const totalAlcance = trackBoostData.reduce((s, t) => s + t.alcance, 0);
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report TrackBoost - ELIXIR</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #070616 0%, #0a0824 100%);
      color: #FFFFFF;
      padding: 40px;
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    
    header {
      background: rgba(7, 6, 22, 0.9);
      backdrop-filter: blur(15px);
      padding: 3rem 2rem;
      border-radius: 20px;
      border: 3px solid #EA34FA;
      margin-bottom: 2.5rem;
      text-align: center;
      box-shadow: 0 10px 40px rgba(234, 52, 250, 0.3);
    }
    h1 {
      font-size: 3rem;
      font-weight: 900;
      background: linear-gradient(135deg, #EA34FA 0%, #ff6bff 50%, #EA34FA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .subtitle {
      color: #ff6bff;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0.5rem 0;
    }
    .period {
      color: #9ca3af;
      font-size: 1.1rem;
      font-weight: 500;
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin: 2.5rem 0;
    }
    .kpi-card {
      background: linear-gradient(135deg, rgba(234, 52, 250, 0.15) 0%, rgba(234, 52, 250, 0.05) 100%);
      border: 2px solid rgba(234, 52, 250, 0.4);
      border-radius: 16px;
      padding: 2rem 1.5rem;
      text-align: center;
      position: relative;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, #EA34FA 0%, #ff6bff 100%);
    }
    .kpi-icon {
      font-size: 3rem;
      margin-bottom: 0.75rem;
      filter: drop-shadow(0 4px 8px rgba(234, 52, 250, 0.5));
    }
    .kpi-label {
      font-size: 0.9rem;
      color: #ff6bff;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 2.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #EA34FA 0%, #ff6bff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-top: 0.5rem;
    }
    
    .section {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2.5rem;
      border: 1px solid rgba(234, 52, 250, 0.2);
      margin-bottom: 2.5rem;
    }
    .section-title {
      font-size: 1.75rem;
      color: #EA34FA;
      margin-bottom: 2rem;
      border-bottom: 3px solid #EA34FA;
      padding-bottom: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 1.5rem 0;
    }
    th {
      background: rgba(234, 52, 250, 0.3);
      color: #FFFFFF;
      padding: 1rem;
      text-align: left;
      font-weight: 700;
      border-bottom: 3px solid #EA34FA;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:first-child { border-radius: 12px 0 0 0; }
    th:last-child { border-radius: 0 12px 0 0; }
    td {
      padding: 1rem;
      border-bottom: 1px solid rgba(234, 52, 250, 0.15);
      font-size: 0.95rem;
    }
    tr:hover td {
      background: rgba(234, 52, 250, 0.1);
    }
    
    footer {
      text-align: center;
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 3px solid #EA34FA;
      color: #9ca3af;
      font-size: 0.95rem;
    }
    .elixir-logo {
      font-size: 1.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #EA34FA 0%, #ff6bff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>⚡ TRACKBOOST REPORT</h1>
      <div class="subtitle">Track-Level Campaigns</div>
      <p class="period">Periodo: ${this.formatDate(startDate)} - ${this.formatDate(endDate)}</p>
    </header>
    
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-label">Gasto Total</div>
        <div class="kpi-value">€${totalGasto.toFixed(2)}</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">🎯</div>
        <div class="kpi-label">Conversiones</div>
        <div class="kpi-value">${totalConv}</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">📡</div>
        <div class="kpi-label">Alcance Total</div>
        <div class="kpi-value">${totalAlcance.toLocaleString()}</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">🎵</div>
        <div class="kpi-label">Tracks Activos</div>
        <div class="kpi-value">${trackBoostData.length}</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">📊 Tracks TrackBoost</h2>
      <table>
        <thead>
          <tr>
            <th>Artista</th>
            <th>Track</th>
            <th>Gasto</th>
            <th>Conversiones</th>
            <th>Alcance</th>
            <th>Saves</th>
            <th>Popularidad</th>
          </tr>
        </thead>
        <tbody>
          ${trackBoostData.map(track => `
            <tr>
              <td><strong>${track.artist}</strong></td>
              <td>${track.trackName}</td>
              <td>€${track.gasto.toFixed(2)}</td>
              <td>${track.conversiones}</td>
              <td>${track.alcance.toLocaleString()}</td>
              <td>${track.saves !== 'N/A' && track.saves !== 'Config faltante' ? track.saves.toLocaleString() : track.saves}</td>
              <td>${track.popularidad !== 'N/A' && track.popularidad !== 'Config faltante' ? track.popularidad + '/100' : track.popularidad}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <footer>
      <p>Report generado por ELIXIR Dashboard</p>
      <p>${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      <div class="elixir-logo">ELIXIR</div>
    </footer>
  </div>
</body>
</html>
    `;
  },
  
  // Helper
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  
  // Generar recomendaciones estratégicas
  _generateRecommendations(metrics, spotifyData) {
    const recommendations = [];
    
    // Recomendaciones basadas en CPF
    if (metrics.costPerFollower < 0.50) {
      recommendations.push('✅ <strong>Mantener estrategia actual</strong> - Tu CPF es excelente (< €0.50)');
      recommendations.push('🎨 <strong>Optimizar cover playlist</strong> - Aumentar atracción visual para más clicks orgánicos');
      recommendations.push('🎯 <strong>Testear nuevos creativos</strong> - Probar variaciones manteniendo la eficiencia');
    } else if (metrics.costPerFollower < 0.70) {
      recommendations.push('👍 <strong>Eficiencia buena</strong> - CPF dentro del rango óptimo (€0.50-0.70)');
      recommendations.push('🔍 <strong>A/B Testing</strong> - Probar nuevas creatividades para mejorar aún más');
      recommendations.push('📊 <strong>Analizar audiencias top</strong> - Identificar segmentos más rentables');
    } else if (metrics.costPerFollower < 0.99) {
      recommendations.push('⚠️ <strong>Revisar targeting</strong> - CPF elevado (€0.70-0.99), refinar audiencias');
      recommendations.push('🎨 <strong>Mejorar creatividades</strong> - Cambiar cover de playlist, probar nuevos formatos de anuncios');
      recommendations.push('💰 <strong>Ajustar puja</strong> - Considerar estrategias de puja más conservadoras');
    } else {
      recommendations.push('🔴 <strong>ACCIÓN URGENTE</strong> - CPF crítico (>€0.99), requiere optimización inmediata');
      recommendations.push('🔄 <strong>Cambiar cover playlist</strong> - Primera prioridad, mejora visual atractiva');
      recommendations.push('🎯 <strong>Redefinir targeting</strong> - Audiencias actuales no están convirtiendo bien');
      recommendations.push('⏸️ <strong>Considerar pausar campaña</strong> - Optimizar antes de gastar más presupuesto');
    }
    
    // Recomendaciones basadas en CTR
    if (metrics.avgCTR < 0.5) {
      recommendations.push('📸 <strong>Urgente: Mejorar creatividad</strong> - CTR muy bajo, el anuncio no atrae');
      recommendations.push('📝 <strong>Cambiar copy</strong> - Mensaje no resuena con audiencia, probar hooks diferentes');
    } else if (metrics.avgCTR >= 2) {
      recommendations.push('🔥 <strong>Creatividad excelente</strong> - CTR alto, tus anuncios son muy efectivos');
    }
    
    // Recomendaciones basadas en volumen
    if (metrics.increase < 20) {
      recommendations.push('💵 <strong>Aumentar presupuesto</strong> - Volumen de followers bajo, necesitas más reach');
      recommendations.push('⏰ <strong>Extender duración campaña</strong> - Más tiempo = más followers');
    }
    
    // Recomendaciones basadas en conversión
    if (metrics.conversionRate < 1) {
      recommendations.push('🎵 <strong>Optimizar playlist</strong> - Baja conversión Reach→Followers');
      recommendations.push('📝 <strong>Mejorar descripción playlist</strong> - Claridad en el valor que ofreces');
      recommendations.push('🎧 <strong>Revisar primeras 3 canciones</strong> - Son las más importantes para conversión');
    }
    
    // Recomendaciones basadas en Spotify popularity
    const popularity = spotifyData?.popularity || 0;
    if (popularity !== 'N/A' && popularity < 40) {
      recommendations.push('🎤 <strong>Fortalecer presencia Spotify</strong> - Popularidad baja, trabajar en promoción orgánica');
      recommendations.push('📻 <strong>Aumentar streams</strong> - Más plays = más popularidad = mejor conversión');
    }
    
    return recommendations.map((rec, i) => `
      <div style="padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #EA34FA;">
        ${rec}
      </div>
    `).join('');
  },
  
  // Generar proyecciones de crecimiento
  _generateProjections(metrics, period) {
    // Calcular días del periodo
    const start = new Date(period.start);
    const end = new Date(period.end);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Calcular tasa de crecimiento diario
    const dailyGrowth = days > 0 ? (metrics.increase / days) : 0;
    
    // Proyecciones
    const proj7days = Math.round(dailyGrowth * 7);
    const proj30days = Math.round(dailyGrowth * 30);
    const proj90days = Math.round(dailyGrowth * 90);
    
    const currentFollowers = metrics.followersEnd;
    
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; text-align: center;">
          <div style="color: #9ca3af; font-size: 0.85rem; margin-bottom: 5px;">📅 Próximos 7 días</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: #EA34FA;">+${proj7days}</div>
          <div style="color: #9ca3af; font-size: 0.8rem; margin-top: 5px;">${currentFollowers} → ${currentFollowers + proj7days} followers</div>
        </div>
        
        <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; text-align: center;">
          <div style="color: #9ca3af; font-size: 0.85rem; margin-bottom: 5px;">📅 Próximos 30 días</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: #8b5cf6;">+${proj30days}</div>
          <div style="color: #9ca3af; font-size: 0.8rem; margin-top: 5px;">${currentFollowers} → ${currentFollowers + proj30days} followers</div>
        </div>
        
        <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; text-align: center;">
          <div style="color: #9ca3af; font-size: 0.85rem; margin-bottom: 5px;">📅 Próximos 90 días</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: #3b82f6;">+${proj90days}</div>
          <div style="color: #9ca3af; font-size: 0.8rem; margin-top: 5px;">${currentFollowers} → ${currentFollowers + proj90days} followers</div>
        </div>
      </div>
      
      <div style="margin-top: 15px; padding: 15px; background: rgba(234, 52, 250, 0.1); border-radius: 10px; border: 1px solid rgba(234, 52, 250, 0.3);">
        <strong>📊 Proyección basada en:</strong>
        <br><small style="color: #9ca3af;">
          • Tasa de crecimiento: ${dailyGrowth.toFixed(1)} followers/día (promedio del periodo ${days} días)
          <br>• Asumiendo: misma estrategia y eficiencia actuales
          <br>⚠️ <em>Estas son estimaciones. Resultados reales pueden variar según optimizaciones y cambios en audiencia.</em>
        </small>
      </div>
    `;
  },
  
  // Generar sección de Playlist Health & Growth Analysis
  _generatePlaylistHealthSection(playlistHealth, metrics, period, spotifyData) {
    if (!playlistHealth) {
      return ''; // Si no hay datos, no mostrar sección
    }
    
    const { totalTracks, avgPopularity, distribution, healthStatus, bottleneck, recommendations } = playlistHealth;
    
    // Colores según estado de salud
    const healthColors = {
      'excellent': { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', icon: '🔥' },
      'good': { bg: 'rgba(34, 211, 238, 0.15)', border: '#22d3ee', icon: '✅' },
      'fair': { bg: 'rgba(251, 146, 60, 0.15)', border: '#fb923c', icon: '⚠️' },
      'poor': { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', icon: '🔴' }
    };
    
    const colors = healthColors[healthStatus] || healthColors['good'];
    
    // Calcular porcentaje de crecimiento
    const growthPercentage = metrics.followersStart > 0 
      ? ((metrics.increase / metrics.followersStart) * 100).toFixed(1)
      : 0;
    
    return `
    <div class="section">
      <h2 class="section-title">🎵 Playlist Health & Growth Analysis</h2>
      
      ${bottleneck ? `
        <div style="background: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: ${colors.border};">${colors.icon} ${bottleneck}</strong>
        </div>
      ` : ''}
      
      <div style="background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #c4b5fd; font-size: 1rem;">📅 Follower window used for this report:</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <div style="color: #9ca3af; font-size: 0.85rem;">Fecha Inicio</div>
            <div style="font-size: 1.3rem; font-weight: 700; color: #EA34FA;">${this.formatDate(period.start)}</div>
            <div style="color: #9ca3af; font-size: 0.85rem; margin-top: 5px;">Followers: ${metrics.followersStart.toLocaleString()}</div>
          </div>
          
          <div>
            <div style="color: #9ca3af; font-size: 0.85rem;">Fecha Final</div>
            <div style="font-size: 1.3rem; font-weight: 700; color: #8b5cf6;">${this.formatDate(period.end)}</div>
            <div style="color: #9ca3af; font-size: 0.85rem; margin-top: 5px;">Followers: ${metrics.followersEnd.toLocaleString()}</div>
          </div>
          
          <div>
            <div style="color: #9ca3af; font-size: 0.85rem;">Growth in reporting window</div>
            <div style="font-size: 1.3rem; font-weight: 700; color: #10b981;">+${metrics.increase} followers</div>
            <div style="color: #10b981; font-size: 0.85rem; margin-top: 5px;">(+${growthPercentage}%)</div>
          </div>
        </div>
      </div>
      
      <div style="background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 12px;">
        <h3 style="margin: 0 0 15px 0; color: #c4b5fd; font-size: 1rem;">📊 Playlist Composition</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div style="text-align: center; padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 10px;">
            <div style="font-size: 2rem; font-weight: 700; color: #8b5cf6;">${totalTracks}</div>
            <div style="color: #9ca3af; font-size: 0.85rem; margin-top: 5px;">Total Tracks</div>
            ${totalTracks > 60 ? '<div style="color: #fb923c; font-size: 0.75rem; margin-top: 5px;">⚠️ Recomendado: max 60</div>' : ''}
          </div>
          
          <div style="text-align: center; padding: 15px; background: rgba(234, 52, 250, 0.1); border-radius: 10px;">
            <div style="font-size: 2rem; font-weight: 700; color: #EA34FA;">${avgPopularity}</div>
            <div style="color: #9ca3af; font-size: 0.85rem; margin-top: 5px;">Avg Popularity</div>
            <div style="color: #9ca3af; font-size: 0.75rem; margin-top: 5px;">de 100</div>
          </div>
        </div>
        
        <h4 style="margin: 20px 0 10px 0; color: #c4b5fd; font-size: 0.95rem;">Distribución por Popularidad:</h4>
        
        <div style="display: flex; height: 40px; border-radius: 8px; overflow: hidden; margin-bottom: 15px;">
          <div style="width: ${distribution.low.percentage}%; background: #ef4444; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.85rem; font-weight: 600;">
            ${distribution.low.percentage > 10 ? distribution.low.percentage + '%' : ''}
          </div>
          <div style="width: ${distribution.medium.percentage}%; background: #fb923c; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.85rem; font-weight: 600;">
            ${distribution.medium.percentage > 10 ? distribution.medium.percentage + '%' : ''}
          </div>
          <div style="width: ${distribution.high.percentage}%; background: #10b981; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.85rem; font-weight: 600;">
            ${distribution.high.percentage > 10 ? distribution.high.percentage + '%' : ''}
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 0.85rem;">
          <div style="text-align: center;">
            <div style="color: #ef4444; font-weight: 600;">${distribution.low.count} tracks (${distribution.low.percentage}%)</div>
            <div style="color: #9ca3af; margin-top: 3px;">Baja (&lt;40)</div>
          </div>
          <div style="text-align: center;">
            <div style="color: #fb923c; font-weight: 600;">${distribution.medium.count} tracks (${distribution.medium.percentage}%)</div>
            <div style="color: #9ca3af; margin-top: 3px;">Media (40-69)</div>
          </div>
          <div style="text-align: center;">
            <div style="color: #10b981; font-weight: 600;">${distribution.high.count} tracks (${distribution.high.percentage}%)</div>
            <div style="color: #9ca3af; margin-top: 3px;">Alta (70-100)</div>
          </div>
        </div>
      </div>
      
      ${recommendations.length > 0 ? `
        <div style="margin-top: 20px; background: linear-gradient(135deg, rgba(234, 52, 250, 0.1), rgba(139, 92, 246, 0.1)); padding: 20px; border-radius: 12px; border: 2px solid rgba(234, 52, 250, 0.3);">
          <h3 style="margin: 0 0 15px 0; color: #EA34FA;">💡 Recomendaciones de Salud de Playlist</h3>
          ${recommendations.map(rec => `
            <div style="padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #EA34FA;">
              ${rec}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    `;
  },
  
  // Generar sección de Milestones
  _generateMilestonesSection(metrics, period) {
    const currentFollowers = metrics.followersEnd;
    const startFollowers = metrics.followersStart;
    
    // Definir milestones
    const milestones = [
      { value: 1000, label: '1K Followers', emoji: '🎯' },
      { value: 2000, label: '2K Followers', emoji: '🚀' },
      { value: 3000, label: '3K Followers', emoji: '⭐' },
      { value: 4000, label: '4K Followers (Trending Artist)', emoji: '🔥' },
      { value: 5000, label: '5K Followers', emoji: '💎' },
      { value: 10000, label: '10K Followers', emoji: '👑' },
      { value: 50000, label: '50K Followers', emoji: '🏆' },
      { value: 100000, label: '100K Followers', emoji: '🌟' }
    ];
    
    // Encontrar milestones alcanzados y próximo
    const achieved = milestones.filter(m => currentFollowers >= m.value);
    const nextMilestone = milestones.find(m => currentFollowers < m.value);
    
    if (!nextMilestone && achieved.length === 0) {
      return ''; // No mostrar si no hay milestones relevantes
    }
    
    return `
    <div class="section">
      <h2 class="section-title">🎯 Niveles & Milestones</h2>
      
      ${achieved.length > 0 ? `
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05)); padding: 20px; border-radius: 12px; border: 2px solid rgba(16, 185, 129, 0.4); margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #10b981;">✅ Milestones Alcanzados</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${achieved.map(m => `
              <div style="background: rgba(16, 185, 129, 0.2); padding: 10px 20px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.5);">
                <span style="font-size: 1.3rem; margin-right: 5px;">${m.emoji}</span>
                <span style="color: #10b981; font-weight: 600;">${m.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${nextMilestone ? `
        <div style="background: linear-gradient(135deg, rgba(234, 52, 250, 0.15), rgba(139, 92, 246, 0.15)); padding: 20px; border-radius: 12px; border: 2px solid rgba(234, 52, 250, 0.4);">
          <h3 style="margin: 0 0 15px 0; color: #EA34FA;">🎯 Próximo Milestone</h3>
          
          <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 20px; align-items: center;">
            <div style="font-size: 3rem;">${nextMilestone.emoji}</div>
            
            <div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #EA34FA; margin-bottom: 5px;">
                ${nextMilestone.label}
              </div>
              <div style="color: #9ca3af; margin-bottom: 10px;">
                Faltan ${(nextMilestone.value - currentFollowers).toLocaleString()} followers
              </div>
              
              <div style="background: rgba(255, 255, 255, 0.1); height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #EA34FA, #8b5cf6); height: 100%; width: ${((currentFollowers / nextMilestone.value) * 100).toFixed(1)}%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: 600;">
                  ${((currentFollowers / nextMilestone.value) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div style="text-align: right;">
              <div style="font-size: 0.85rem; color: #9ca3af;">Actual</div>
              <div style="font-size: 1.8rem; font-weight: 700; color: #8b5cf6;">${currentFollowers.toLocaleString()}</div>
              <div style="font-size: 0.85rem; color: #9ca3af;">/ ${nextMilestone.value.toLocaleString()}</div>
            </div>
          </div>
          
          <div style="margin-top: 15px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 3px solid #3b82f6;">
            <strong style="color: #3b82f6;">🎯 Compromiso:</strong> 
            <span style="color: #9ca3af;">250 followers/mes. Al mantener este ritmo, alcanzarás ${nextMilestone.label} en aproximadamente <strong style="color: #3b82f6;">${Math.ceil((nextMilestone.value - currentFollowers) / 250)} meses</strong></span>
          </div>
        </div>
      ` : `
        <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05)); padding: 20px; border-radius: 12px; border: 2px solid rgba(251, 191, 36, 0.4); text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 10px;">🏆</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #fbbf24; margin-bottom: 10px;">
            ¡Todos los milestones principales alcanzados!
          </div>
          <div style="color: #9ca3af;">Has superado los 100K followers. ¡Sigue construyendo tu comunidad!</div>
        </div>
      `}
    </div>
    `;
  }
};
