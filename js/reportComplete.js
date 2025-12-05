// ============================================
// GENERADOR DE REPORT COMPLETO
// Monitoring + TrackBoost en UN SOLO documento
// ============================================

const ReportComplete = {
  
  // Método auxiliar para obtener snapshot del 01/12/2025
  getSnapshot_01_12_2025(artistName) {
    const estimatedSnapshots = {
      'Steban': 135,
      'ALEX KISLOV': 3280,
      'The Amplified Pianist': 3600,
      'Honey': 1045,
      'Mainterm': 47850,
      'Pato Pescio': 3395
    };
    return estimatedSnapshots[artistName] || 0;
  },
  
  async generateCompleteReport(normalCampaigns, trackboostCampaigns, startDate, endDate, snapshotBase = null) {
    
    // Determinar snapshot base a usar
    const baseDate = snapshotBase || (typeof App !== 'undefined' ? App.snapshotBaseDate : '31/10/2024');
    console.log(`📅 Report usando Snapshot Base: ${baseDate}`);
    
    // ========================================
    // PARTE 1: CAMPAÑAS NORMALES (PLAYLIST)
    // ========================================
    const reportRows = [];
    const byArtist = {};
    
    normalCampaigns.forEach(c => {
      if (!byArtist[c.artist]) {
        byArtist[c.artist] = [];
      }
      byArtist[c.artist].push(c);
      
      // DEBUG ESPECIAL PARA STEBAN
      if (c.artist && c.artist.toLowerCase().includes('stban')) {
        console.log(`✅ CAMPAÑA STEBAN DETECTADA:`, {
          campaignName: c.campaignName,
          artist: c.artist,
          isTrackboost: c.artistData?.isTrackboost
        });
      }
    });
    
    console.log(`📊 Total artistas agrupados: ${Object.keys(byArtist).length}`);
    console.log(`📋 Artistas encontrados:`, Object.keys(byArtist));
    
    for (const [artistName, artistCampaigns] of Object.entries(byArtist)) {
      console.log(`🔍 Procesando artista: ${artistName}`);
      
      // Mapear nombre del artista (ej: 'stban' → 'Steban')
      // FORZAR mapeo correcto para Steban
      let realArtistName = artistName;
      if (artistName.toLowerCase() === 'stban' || artistName.toLowerCase() === 'steban') {
        realArtistName = 'Steban'; // FORZAR artista de playlist, NO TrackBoost
      } else {
        const artistConfig = CONFIG.artists.find(a => 
          a.campaignKeywords.some(k => artistName.toLowerCase().includes(k.toLowerCase()))
        );
        realArtistName = artistConfig ? artistConfig.name : artistName;
      }
      
      // Obtener baseline según snapshot base seleccionado
      let startFollowers = 0;
      
      if (baseDate === '31/10/2024') {
        // Usar baseline estándar de HistoricalData
        const baseline = HistoricalData.getArtistBaseline(realArtistName, '2024-10-31');
        if (!baseline) {
          console.error(`❌ No baseline para ${realArtistName} (original: ${artistName}) en fecha 2024-10-31`);
          continue;
        }
        startFollowers = baseline.playlistFollowers || 0;
        console.log(`📊 ${realArtistName}: Baseline 31/10/2024 = ${startFollowers} followers`);
      } else if (baseDate === '01/12/2025') {
        // Usar snapshot estimado del 01/12/2025
        startFollowers = this.getSnapshot_01_12_2025(realArtistName);
        if (startFollowers === 0) {
          console.log(`⚠️ No snapshot 01/12 para ${realArtistName}, buscando en baseline`);
          const baseline = HistoricalData.getArtistBaseline(realArtistName, '2024-10-31');
          if (!baseline) continue;
          startFollowers = baseline.playlistFollowers || 0;
        }
        console.log(`📅 ${realArtistName}: Snapshot 01/12/2025 = ${startFollowers} followers`);
      } else {
        // Snapshot manual personalizado
        const manualSnapshot = HistoricalData.manualSnapshots?.[baseDate]?.[realArtistName];
        if (manualSnapshot) {
          startFollowers = manualSnapshot.followers || 0;
          console.log(`📸 ${realArtistName}: Snapshot manual ${baseDate} = ${startFollowers} followers`);
        } else {
          console.log(`⚠️ No snapshot manual ${baseDate} para ${realArtistName}, usando baseline`);
          const baseline = HistoricalData.getArtistBaseline(realArtistName, '2024-10-31');
          if (!baseline) continue;
          startFollowers = baseline.playlistFollowers || 0;
        }
      }
      
      const artist = CONFIG.artists.find(a => a.name === realArtistName);
      let currentFollowers = startFollowers;
      
      // USAR DATOS ACTUALES (prioridad: 1. Spotify API, 2. Manual, 3. Baseline)
      // Intentar obtener de Spotify API primero
      try {
        if (artist && artist.playlistId && !artist.skipSpotify) {
          const spotifyData = await SpotifyAPI.getPlaylistData(artist.playlistId);
          if (spotifyData && spotifyData.followers) {
            currentFollowers = spotifyData.followers;
            console.log(`✅ ${realArtistName}: Spotify API → ${currentFollowers} followers`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ ${realArtistName}: Error Spotify, usando datos manuales`);
      }
      
      // Fallback a datos manuales
      if (currentFollowers === startFollowers && DatosActualesSpotify.hasData(realArtistName)) {
        currentFollowers = DatosActualesSpotify.getFollowers(realArtistName);
        console.log(`📝 ${realArtistName}: Datos manuales → ${currentFollowers} followers`);
      }
      
      // Si no hay datos actuales, usar inicio
      if (currentFollowers === startFollowers) {
        console.log(`ℹ️ ${realArtistName}: Sin datos actuales, usando inicio: ${currentFollowers}`);
      }
      
      // DEBUG
      console.log(`📊 RESUMEN ${realArtistName}:`, {
        start: startFollowers,
        current: currentFollowers,
        increase: currentFollowers - startFollowers
      });
      
      const totalSpent = artistCampaigns.reduce((s, c) => s + (c.amountSpent || 0), 0);
      const totalConversions = artistCampaigns.reduce((s, c) => s + (c.results || 0), 0);
      const totalReach = artistCampaigns.reduce((s, c) => s + (c.reach || 0), 0);
      const increaseFollowers = currentFollowers - startFollowers;
      const costPerFollower = increaseFollowers > 0 ? totalSpent / increaseFollowers : 0;
      
      let action = '';
      // UMBRALES PLAYLIST: <0.50, 0.50-0.70, 0.70-0.99, >0.99
      if (costPerFollower < 0.50 && increaseFollowers >= 50) {
        action = 'Mantener estrategia actual';
      } else if (costPerFollower < 0.50 && increaseFollowers < 50) {
        action = 'Cambiar cover de playlist';
      } else if (costPerFollower >= 0.50 && costPerFollower < 0.70) {
        action = 'Buen rendimiento - Optimizar cover';
      } else if (costPerFollower >= 0.70 && costPerFollower < 0.99) {
        action = 'Revisar targeting y creativos';
      } else {
        action = 'CPF crítico - Revisar estrategia completa';
      }
      
      const rowData = {
        artist: realArtistName,
        costPerFollower: costPerFollower,
        increaseFollowers: increaseFollowers,
        spent: totalSpent,
        conversions: totalConversions,
        reach: totalReach,
        followersStart: startFollowers, // Usar startFollowers del snapshot o baseline
        followersEnd: currentFollowers,
        action: action,
        playlistUrl: artist?.playlistUrl || ''
      };
      
      console.log(`✅ Row data para ${realArtistName}:`, {
        followersStart: rowData.followersStart,
        followersEnd: rowData.followersEnd,
        increaseFollowers: rowData.increaseFollowers
      });
      
      reportRows.push(rowData);
    }
    
    // ORDENAR alfabéticamente
    reportRows.sort((a, b) => a.artist.localeCompare(b.artist));
    
    // ========================================
    // PARTE 2: TRACKBOOST (CON TODA LA INFO)
    // ========================================
    const trackboostData = [];
    const trackboostByArtist = {};
    
    trackboostCampaigns.forEach(c => {
      if (!trackboostByArtist[c.artist]) {
        trackboostByArtist[c.artist] = {
          artist: c.artist,
          campaigns: [],
          totalGasto: 0,
          totalConversiones: 0,
          totalAlcance: 0
        };
      }
      trackboostByArtist[c.artist].campaigns.push(c);
      trackboostByArtist[c.artist].totalGasto += c.amountSpent;
      trackboostByArtist[c.artist].totalConversiones += c.results;
      trackboostByArtist[c.artist].totalAlcance += c.reach;
    });
    
    for (const [artistName, data] of Object.entries(trackboostByArtist)) {
      const trackConfig = HistoricalData.getTrackboostTrack(artistName);
      const artistConfig = CONFIG.artists.find(a => a.name === artistName);
      
      // PRESUPUESTO
      const budgetType = artistConfig?.budgetType || 'normal';
      const budgetTotal = artistConfig?.budgetTotal || (budgetType === 'lite' ? 200 : 500);
      const budgetUsed = data.totalGasto;
      const budgetRemaining = budgetTotal - budgetUsed;
      const budgetPercentage = (budgetUsed / budgetTotal) * 100;
      
      let budgetColor = '#10b981'; // Verde
      if (budgetPercentage >= 80) budgetColor = '#ef4444'; // Rojo
      else if (budgetPercentage >= 60) budgetColor = '#f59e0b'; // Amarillo
      
      const costPerConversion = data.totalConversiones > 0 ? (data.totalGasto / data.totalConversiones) : 0;
      const targetCost = budgetType === 'lite' ? 0.90 : 0.50;
      
      // NUEVOS CAMPOS PUNTO B
      const gastoTotalCampana = trackConfig?.gastoTotalCampana || 0;
      const gastoEsteCorte = data.totalGasto; // CORREGIDO: Obtener del CSV de Meta Ads
      const currentSaves = trackConfig?.currentSaves || 0;
      const lastSaves = trackConfig?.lastSaves || 0;
      const savesGanados = currentSaves - lastSaves; // Saves ganados en este corte
      const costeSave = savesGanados > 0 ? (gastoEsteCorte / savesGanados) : 0; // CORREGIDO: Gasto / Saves ganados
      
      let trackDetails = {
        trackName: trackConfig?.trackName || 'N/A',
        popularidad: 'N/A',
        saves: currentSaves,           // Saves actuales
        lastSaves: lastSaves,          // Saves corte anterior
        savesGanados: savesGanados,    // Saves ganados este corte
        streams: trackConfig?.streams || 0,
        trackUrl: trackConfig?.trackUrl || '#',
        // NUEVOS
        gastoTotalCampana: gastoTotalCampana,
        gastoEsteCorte: gastoEsteCorte, // Del CSV
        costeSave: costeSave            // Gasto Este Corte / Saves Ganados
      };
      
      // Obtener datos del track si está configurado (solo popularidad)
      if (trackConfig && trackConfig.trackId) {
        try {
          const trackData = await SpotifyAPI.getTrackData(trackConfig.trackId);
          if (trackData) {
            trackDetails.trackName = trackData.name;
            trackDetails.popularidad = trackData.popularity;
            trackDetails.trackUrl = trackData.url;
            
            // NO sobrescribir saves si hay dato manual
            if (!trackConfig.currentSaves || trackConfig.currentSaves === 0) {
              // Solo si NO hay dato manual, estimar
              const pop = trackData.popularity;
              let estimatedSaves = 0;
              if (pop >= 80) estimatedSaves = Math.floor(50000 + (pop - 80) * 5000);
              else if (pop >= 60) estimatedSaves = Math.floor(10000 + (pop - 60) * 2000);
              else if (pop >= 40) estimatedSaves = Math.floor(2000 + (pop - 40) * 400);
              else if (pop >= 20) estimatedSaves = Math.floor(500 + (pop - 20) * 75);
              else estimatedSaves = Math.floor(pop * 25);
              
              trackDetails.saves = estimatedSaves;
            }
          }
        } catch (error) {
          console.error(`Error obteniendo track data para ${artistName}:`, error);
        }
      }
      
      // Estado de presupuesto
      let budgetStatus = '✅ Buen ritmo';
      if (budgetPercentage >= 100) budgetStatus = '🔴 SOBREPASADO';
      else if (budgetPercentage >= 80) budgetStatus = '⚠️ Casi agotado';
      else if (budgetPercentage >= 60) budgetStatus = '👍 Normal';
      
      trackboostData.push({
        artist: artistName,
        ...trackDetails,
        gasto: data.totalGasto,
        conversiones: data.totalConversiones,
        alcance: data.totalAlcance,
        costPerConversion: costPerConversion,
        targetCost: targetCost,
        budgetType: budgetType.toUpperCase(),
        budgetTotal: budgetTotal,
        budgetUsed: budgetUsed,
        budgetRemaining: budgetRemaining,
        budgetPercentage: budgetPercentage,
        budgetColor: budgetColor,
        budgetStatus: budgetStatus
      });
    }
    
    // ========================================
    // PARTE 3: GENERAR HTML COMPLETO
    // ========================================
    console.log(`📊 Total reportRows generados: ${reportRows.length}`);
    console.log(`🚀 Total trackboostData generados: ${trackboostData.length}`);
    
    // Verificar que al menos uno tenga datos
    if (reportRows.length > 0) {
      console.log(`📋 Ejemplo de row:`, reportRows[0]);
    }
    
    // GUARDAR SNAPSHOT DEL REPORT para usar en próximos reports
    if (typeof ReportSnapshots !== 'undefined') {
      ReportSnapshots.saveReportSnapshot({
        startDate: startDate,
        endDate: endDate,
        artists: reportRows.map(r => ({
          name: r.artist,
          followersStart: r.followersStart,
          followersEnd: r.followersEnd,
          increase: r.increaseFollowers,
          spent: r.spent,
          cpf: r.costPerFollower
        }))
      });
    }
    
    // 🔥 AUTO-GUARDADO DE SNAPSHOTS PERSISTENTES
    if (typeof PersistenceManager !== 'undefined' && reportRows.length > 0) {
      console.log('💾 Guardando snapshot persistente...');
      try {
        await PersistenceManager.saveAfterReportGeneration({
          startDate,
          endDate,
          artists: reportRows.map(r => ({
            name: r.artist,
            followersStart: r.followersStart,
            followersEnd: r.followersEnd,
            increase: r.increaseFollowers,
            spent: r.spent,
            cpf: r.costPerFollower
          }))
        });
        console.log('✅ Snapshot persistente guardado correctamente');
      } catch (error) {
        console.warn('⚠️ Error guardando snapshot:', error);
      }
    }
    
    return this.generateHTML(reportRows, trackboostData, startDate, endDate, baseDate);
  },
  
  generateHTML(normalRows, trackboostRows, startDate, endDate, baseDate = '31/10/2024') {
    console.log(`🎨 Generando HTML con ${normalRows.length} rows normales y ${trackboostRows.length} TrackBoost`);
    const totalSpentNormal = normalRows.reduce((s, r) => s + r.spent, 0);
    const totalIncreaseNormal = normalRows.reduce((s, r) => s + r.increaseFollowers, 0);
    const avgCPF = totalIncreaseNormal > 0 ? totalSpentNormal / totalIncreaseNormal : 0;
    
    const totalSpentTrackboost = trackboostRows.reduce((s, r) => s + r.gasto, 0);
    const totalConvTrackboost = trackboostRows.reduce((s, r) => s + r.conversiones, 0);
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monitoring Completo ELIXIR - ${startDate} a ${endDate}</title>
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
    .container { max-width: 1600px; margin: 0 auto; }
    
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
      font-size: 1.4rem;
      font-weight: 600;
      margin: 0.5rem 0;
    }
    .period {
      color: #9ca3af;
      font-size: 1.1rem;
      font-weight: 500;
      margin-top: 0.5rem;
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }
    .kpi-card {
      background: linear-gradient(135deg, rgba(234, 52, 250, 0.15) 0%, rgba(234, 52, 250, 0.05) 100%);
      border: 2px solid rgba(234, 52, 250, 0.4);
      border-radius: 16px;
      padding: 2rem 1.5rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #EA34FA, #ff6bff);
    }
    .kpi-label {
      font-size: 0.9rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.75rem;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 2.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #EA34FA, #ff6bff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .section-title {
      font-size: 2rem;
      font-weight: 700;
      color: #EA34FA;
      margin: 3rem 0 1.5rem 0;
      padding-bottom: 1rem;
      border-bottom: 3px solid rgba(234, 52, 250, 0.3);
    }
    
    .card {
      background: rgba(7, 6, 22, 0.6);
      border: 2px solid rgba(234, 52, 250, 0.3);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    th {
      background: rgba(234, 52, 250, 0.2);
      color: #EA34FA;
      padding: 1rem;
      text-align: left;
      font-weight: 700;
      border-bottom: 2px solid #EA34FA;
    }
    td {
      padding: 1rem;
      border-bottom: 1px solid rgba(234, 52, 250, 0.1);
    }
    tr:hover {
      background: rgba(234, 52, 250, 0.05);
    }
    
    .excellent-cpf { color: #ffffff; font-weight: 700; }
    .good-cpf { color: #fbbf24; font-weight: 700; }
    .warning-cpf { color: #f97316; font-weight: 700; }
    .critical-cpf { color: #ef4444; font-weight: 700; }
    
    .budget-bar-container {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      height: 24px;
      overflow: hidden;
      position: relative;
      margin: 0.5rem 0;
    }
    .budget-bar {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      transition: all 0.3s ease;
    }
    
    .trackboost-detail {
      background: rgba(245, 158, 11, 0.05);
      border: 2px solid rgba(245, 158, 11, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1rem 0;
    }
    .trackboost-detail h3 {
      color: #f59e0b;
      margin-bottom: 1rem;
      font-size: 1.4rem;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .detail-item {
      background: rgba(0, 0, 0, 0.2);
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    .detail-label {
      font-size: 0.85rem;
      color: #9ca3af;
      margin-bottom: 0.25rem;
    }
    .detail-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    
    .legend {
      background: rgba(234, 52, 250, 0.1);
      border: 2px solid rgba(234, 52, 250, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      margin: 2rem 0;
      text-align: center;
    }
    .legend-item {
      display: inline-block;
      margin: 0 1rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
    }
    
    .note {
      background: rgba(59, 130, 246, 0.1);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 2rem 0;
      color: #60a5fa;
    }
    
    footer {
      margin-top: 4rem;
      text-align: center;
      color: #666;
      border-top: 2px solid #EA34FA;
      padding-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Monitoring Completo</h1>
      <div class="subtitle">ELIXIR Marketing Dashboard</div>
      <div class="period">${startDate} - ${endDate}</div>
    </header>
    
    <!-- KPIs GLOBALES -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Gasto Total Playlist</div>
        <div class="kpi-value">€${totalSpentNormal.toFixed(2)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Followers Ganados</div>
        <div class="kpi-value">${totalIncreaseNormal >= 0 ? '+' : ''}${totalIncreaseNormal}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">CPF Promedio</div>
        <div class="kpi-value">€${avgCPF.toFixed(2)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Gasto TrackBoost</div>
        <div class="kpi-value">€${totalSpentTrackboost.toFixed(2)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Artistas Activos</div>
        <div class="kpi-value">${normalRows.length}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Campañas TrackBoost</div>
        <div class="kpi-value">${trackboostRows.length}</div>
      </div>
    </div>
    
    <!-- SECCIÓN 1: CAMPAÑAS PLAYLIST -->
    <h2 class="section-title">🎵 Campañas Playlist</h2>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Artista</th>
            <th>€/Follower</th>
            <th>Ganados</th>
            <th>€ Gastado</th>
            <th>Conv</th>
            <th>Alcance</th>
            <th>F. Inicio</th>
            <th>F. Final</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
${normalRows.map(row => {
  const cpf = row.costPerFollower;
  let cssClass = 'excellent-cpf';
  if (cpf > 0.99) cssClass = 'critical-cpf';
  else if (cpf > 0.70) cssClass = 'warning-cpf';
  else if (cpf >= 0.50) cssClass = 'good-cpf';
  
  return `
          <tr>
            <td><strong>${row.artist}</strong></td>
            <td class="${cssClass}">€${cpf.toFixed(2)}</td>
            <td style="color: ${row.increaseFollowers >= 0 ? '#10b981' : '#ef4444'};">${row.increaseFollowers >= 0 ? '+' : ''}${row.increaseFollowers}</td>
            <td>€${row.spent.toFixed(2)}</td>
            <td>${row.conversions.toLocaleString()}</td>
            <td>${row.reach.toLocaleString()}</td>
            <td>${row.followersStart.toLocaleString()}</td>
            <td>${row.followersEnd.toLocaleString()}</td>
            <td style="font-size: 0.9rem;">${row.action}</td>
          </tr>`;
}).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="legend">
      <span class="legend-item excellent-cpf">€/Follower < €0.50 - Excelente</span>
      <span class="legend-item good-cpf">€/Follower €0.50-0.70 - Bueno</span>
      <span class="legend-item warning-cpf">€/Follower €0.70-0.99 - Revisar</span>
      <span class="legend-item critical-cpf">€/Follower > €0.99 - Crítico</span>
    </div>
    
    <!-- SECCIÓN 2: TRACKBOOST COMPLETO -->
    <h2 class="section-title">🚀 Campañas TrackBoost - Detalles Completos</h2>
    
${trackboostRows.map(tb => `
    <div class="trackboost-detail">
      <h3>
        ${tb.artist}
        <span style="float: right; background: ${tb.budgetType === 'LITE' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 52, 250, 0.2)'}; padding: 0.5rem 1rem; border-radius: 8px; font-size: 1rem;">
          ${tb.budgetType} - €${tb.budgetTotal}
        </span>
      </h3>
      
      <!-- Barra de Presupuesto -->
      <div style="margin: 1.5rem 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: #9ca3af;">Presupuesto Usado:</span>
          <span style="font-weight: 700;">€${tb.budgetUsed.toFixed(2)} / €${tb.budgetTotal}</span>
        </div>
        <div class="budget-bar-container">
          <div class="budget-bar" style="width: ${Math.min(tb.budgetPercentage, 100).toFixed(1)}%; background: ${tb.budgetColor};">
            ${tb.budgetPercentage.toFixed(1)}%
          </div>
        </div>
        <div style="text-align: center; margin-top: 0.5rem; color: ${tb.budgetColor}; font-weight: 600; font-size: 1.1rem;">
          ${tb.budgetStatus}
        </div>
        <div style="text-align: center; margin-top: 0.5rem;">
          <strong>Presupuesto Restante:</strong> <span style="color: ${tb.budgetRemaining > 0 ? '#10b981' : '#ef4444'}; font-size: 1.3rem; font-weight: 700;">€${tb.budgetRemaining.toFixed(2)}</span>
        </div>
      </div>
      
      <!-- Detalles del Track -->
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Track</div>
          <div class="detail-value">${tb.trackName}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Popularidad</div>
          <div class="detail-value">${tb.popularidad}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Saves (est.)</div>
          <div class="detail-value">${typeof tb.saves === 'number' ? tb.saves.toLocaleString() : tb.saves}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Streams</div>
          <div class="detail-value" style="font-size: 0.9rem; color: #9ca3af;">${tb.streams}</div>
        </div>
      </div>
      
      <!-- Métricas de Campaña -->
      <div class="detail-grid" style="margin-top: 1rem;">
        <div class="detail-item">
          <div class="detail-label">Gasto Total</div>
          <div class="detail-value">€${tb.gasto.toFixed(2)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Conversiones</div>
          <div class="detail-value">${tb.conversiones.toLocaleString()}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">€/Conversión</div>
          <div class="detail-value">€${tb.costPerConversion.toFixed(2)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Target Cost</div>
          <div class="detail-value">€${tb.targetCost.toFixed(2)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Alcance</div>
          <div class="detail-value">${tb.alcance.toLocaleString()}</div>
        </div>
      </div>
      
      <!-- NUEVAS MÉTRICAS PUNTO B -->
      <div class="detail-grid" style="margin-top: 1rem; background: linear-gradient(135deg, rgba(234, 52, 250, 0.1), rgba(139, 92, 246, 0.1)); padding: 1rem; border-radius: 10px; border: 2px solid rgba(234, 52, 250, 0.3);">
        <div class="detail-item">
          <div class="detail-label">💰 Gasto Total Campaña</div>
          <div class="detail-value" style="color: #EA34FA;">€${(tb.gastoTotalCampana || 0).toFixed(2)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">📊 Gasto Este Corte (CSV)</div>
          <div class="detail-value" style="color: #8b5cf6;">€${(tb.gastoEsteCorte || 0).toFixed(2)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">📈 Saves Ganados Este Corte</div>
          <div class="detail-value" style="color: #3b82f6; font-weight: 600;">
            +${tb.savesGanados || 0} (${tb.lastSaves || 0} → ${tb.saves || 0})
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">💎 Coste/Save</div>
          <div class="detail-value" style="color: ${tb.costeSave > 0.50 ? '#ef4444' : '#10b981'}; font-weight: 700;">
            €${(tb.costeSave || 0).toFixed(2)}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">📈 Estado Presupuesto</div>
          <div class="detail-value" style="color: ${tb.budgetColor}; font-weight: 700;">
            ${tb.budgetStatus}
          </div>
        </div>
      </div>
    </div>
`).join('')}
    

    
    <footer>
      <p style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem;">ELIXIR Marketing Dashboard</p>
      <p>Report Completo generado el ${new Date().toLocaleDateString('es-ES')}</p>
      <p style="margin-top: 0.5rem; color: #9ca3af;">Período: ${startDate} - ${endDate}</p>
      <p style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; color: #10b981; font-weight: 600;">
        📅 Snapshot Base: ${baseDate}
      </p>
    </footer>
  </div>
</body>
</html>`;
  }
};
