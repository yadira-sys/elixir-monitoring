// ============================================
// GENERADOR DE REPORTES TRACKBOOST COMPLETO
// Con: Presupuesto, Gráfico, Colores, Streams
// ============================================

const TrackBoostReportComplete = {
  
  async generateCompleteHTMLReport(campaigns, startDate, endDate) {
    const trackBoostByArtist = {};
    
    // AGRUPAR campañas por artista
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
    
    // Obtener datos de cada artista TrackBoost
    for (const [artistName, artistData] of Object.entries(trackBoostByArtist)) {
      const trackConfig = HistoricalData.getTrackboostTrack(artistName);
      const artistConfig = CONFIG.artists.find(a => a.name === artistName);
      
      // PRESUPUESTO
      const budgetType = artistConfig?.budgetType || 'normal';
      const budgetTotal = artistConfig?.budgetTotal || (budgetType === 'lite' ? 200 : 500);
      const budgetUsed = artistData.totalGasto;
      const budgetRemaining = budgetTotal - budgetUsed;
      const budgetPercentage = (budgetUsed / budgetTotal) * 100;
      
      // COLOR DEL PRESUPUESTO
      let budgetColor = '#10b981'; // Verde
      if (budgetPercentage >= 80) budgetColor = '#ef4444'; // Rojo
      else if (budgetPercentage >= 60) budgetColor = '#f59e0b'; // Amarillo
      
      if (!trackConfig || !trackConfig.trackId) {
        // CAMPOS PUNTO B incluso sin config
        const gastoEsteCorte = artistData.totalGasto;
        const currentSaves = 0;
        const lastSaves = 0;
        const savesGanados = 0;
        const costeSave = 0;
        
        let budgetStatus = '✅ Buen ritmo';
        if (budgetPercentage >= 100) budgetStatus = '🔴 SOBREPASADO';
        else if (budgetPercentage >= 80) budgetStatus = '⚠️ Casi agotado';
        else if (budgetPercentage >= 60) budgetStatus = '👍 Normal';
        
        trackBoostData.push({
          artist: artistName,
          trackName: trackConfig?.trackName || 'N/A',
          gasto: artistData.totalGasto,
          conversiones: artistData.totalConversiones,
          alcance: artistData.totalAlcance,
          costPerConversion: artistData.totalConversiones > 0 ? (artistData.totalGasto / artistData.totalConversiones).toFixed(2) : '0.00',
          saves: 'N/A',
          popularidad: 'N/A',
          streams: 'No disponible',
          targetCost: 'N/A',
          budgetType: budgetType.toUpperCase(),
          budgetTotal: budgetTotal,
          budgetUsed: budgetUsed,
          budgetRemaining: budgetRemaining,
          budgetPercentage: budgetPercentage,
          budgetColor: budgetColor,
          budgetStatus: budgetStatus,
          gastoTotalCampana: 0,
          gastoEsteCorte: gastoEsteCorte,
          currentSaves: currentSaves,
          lastSaves: lastSaves,
          savesGanados: savesGanados,
          costeSave: costeSave,
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
        
        // Target Cost (basado en presupuesto)
        const targetCost = budgetType === 'lite' ? '€0.90' : '€0.50';
        
        // NUEVOS CAMPOS PUNTO B: Coste/Save
        const gastoTotalCampana = trackConfig?.gastoTotalCampana || 0;
        const gastoEsteCorte = artistData.totalGasto; // Del CSV automáticamente
        const currentSaves = trackConfig?.currentSaves || 0;
        const lastSaves = trackConfig?.lastSaves || 0;
        const savesGanados = currentSaves - lastSaves;
        const costeSave = savesGanados > 0 ? (gastoEsteCorte / savesGanados) : 0;
        
        // Estado presupuesto
        let budgetStatus = '✅ Buen ritmo';
        if (budgetPercentage >= 100) budgetStatus = '🔴 SOBREPASADO';
        else if (budgetPercentage >= 80) budgetStatus = '⚠️ Casi agotado';
        else if (budgetPercentage >= 60) budgetStatus = '👍 Normal';
        
        trackBoostData.push({
          artist: artistName,
          trackName: trackData?.name || trackConfig.trackName,
          gasto: artistData.totalGasto,
          conversiones: artistData.totalConversiones,
          alcance: artistData.totalAlcance,
          costPerConversion: artistData.totalConversiones > 0 ? (artistData.totalGasto / artistData.totalConversiones).toFixed(2) : '0.00',
          saves: estimatedSaves,
          popularidad: trackData?.popularity || 'N/A',
          streams: trackConfig?.streams || 'No disponible',
          targetCost: targetCost,
          budgetType: budgetType.toUpperCase(),
          budgetTotal: budgetTotal,
          budgetUsed: budgetUsed,
          budgetRemaining: budgetRemaining,
          budgetPercentage: budgetPercentage,
          budgetColor: budgetColor,
          budgetStatus: budgetStatus,
          // NUEVOS CAMPOS
          gastoTotalCampana: gastoTotalCampana,
          gastoEsteCorte: gastoEsteCorte,
          currentSaves: currentSaves,
          lastSaves: lastSaves,
          savesGanados: savesGanados,
          costeSave: costeSave,
          error: null
        });
      } catch (error) {
        console.error(`Error obteniendo datos de track para ${artistName}:`, error);
        
        // CAMPOS PUNTO B para caso de error también
        const gastoTotalCampana = trackConfig?.gastoTotalCampana || 0;
        const gastoEsteCorte = artistData.totalGasto;
        const currentSaves = trackConfig?.currentSaves || 0;
        const lastSaves = trackConfig?.lastSaves || 0;
        const savesGanados = currentSaves - lastSaves;
        const costeSave = savesGanados > 0 ? (gastoEsteCorte / savesGanados) : 0;
        
        let budgetStatus = '✅ Buen ritmo';
        if (budgetPercentage >= 100) budgetStatus = '🔴 SOBREPASADO';
        else if (budgetPercentage >= 80) budgetStatus = '⚠️ Casi agotado';
        else if (budgetPercentage >= 60) budgetStatus = '👍 Normal';
        
        trackBoostData.push({
          artist: artistName,
          trackName: trackConfig.trackName,
          gasto: artistData.totalGasto,
          conversiones: artistData.totalConversiones,
          alcance: artistData.totalAlcance,
          costPerConversion: artistData.totalConversiones > 0 ? (artistData.totalGasto / artistData.totalConversiones).toFixed(2) : '0.00',
          saves: 'Config faltante',
          popularidad: 'Config faltante',
          streams: trackConfig?.streams || 'No disponible',
          targetCost: 'N/A',
          budgetType: budgetType.toUpperCase(),
          budgetTotal: budgetTotal,
          budgetUsed: budgetUsed,
          budgetRemaining: budgetRemaining,
          budgetPercentage: budgetPercentage,
          budgetColor: budgetColor,
          budgetStatus: budgetStatus,
          gastoTotalCampana: gastoTotalCampana,
          gastoEsteCorte: gastoEsteCorte,
          currentSaves: currentSaves,
          lastSaves: lastSaves,
          savesGanados: savesGanados,
          costeSave: costeSave,
          error: 'Track ID no configurado o inválido'
        });
      }
    }
    
    const totalGasto = trackBoostData.reduce((s, t) => s + t.gasto, 0);
    const totalConv = trackBoostData.reduce((s, t) => s + t.conversiones, 0);
    const totalAlcance = trackBoostData.reduce((s, t) => s + t.alcance, 0);
    
    return this._generateHTML(trackBoostData, startDate, endDate, totalGasto, totalConv, totalAlcance);
  },
  
  _generateHTML(trackBoostData, startDate, endDate, totalGasto, totalConv, totalAlcance) {
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
    
    .artist-card {
      background: rgba(7, 6, 22, 0.7);
      border: 2px solid rgba(234, 52, 250, 0.3);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      transition: all 0.3s ease;
    }
    .artist-card:hover {
      border-color: #EA34FA;
      box-shadow: 0 8px 32px rgba(234, 52, 250, 0.2);
      transform: translateY(-2px);
    }
    
    .artist-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(234, 52, 250, 0.2);
    }
    .artist-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: #EA34FA;
    }
    .track-name {
      font-size: 1.1rem;
      color: #9ca3af;
      font-style: italic;
    }
    .budget-badge {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .budget-lite {
      background: rgba(59, 130, 246, 0.2);
      border: 2px solid #3b82f6;
      color: #60a5fa;
    }
    .budget-normal {
      background: rgba(234, 52, 250, 0.2);
      border: 2px solid #EA34FA;
      color: #ff6bff;
    }
    
    .budget-section {
      background: rgba(234, 52, 250, 0.05);
      border: 2px solid rgba(234, 52, 250, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .budget-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #EA34FA;
      margin-bottom: 1rem;
    }
    .budget-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .budget-item {
      text-align: center;
    }
    .budget-item-label {
      font-size: 0.85rem;
      color: #9ca3af;
      margin-bottom: 0.25rem;
    }
    .budget-item-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    
    .budget-bar-container {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      height: 30px;
      overflow: hidden;
      position: relative;
      margin-bottom: 0.5rem;
    }
    .budget-bar {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }
    .budget-percentage {
      text-align: center;
      font-size: 0.9rem;
      color: #9ca3af;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    .metric-item {
      background: rgba(234, 52, 250, 0.05);
      border: 1px solid rgba(234, 52, 250, 0.2);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }
    .metric-label {
      font-size: 0.85rem;
      color: #9ca3af;
      margin-bottom: 0.5rem;
    }
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #EA34FA;
    }
    
    .alert-info {
      background: rgba(59, 130, 246, 0.1);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 2rem 0;
      color: #60a5fa;
    }
    .alert-warning {
      background: rgba(245, 158, 11, 0.1);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 2rem 0;
      color: #fbbf24;
    }
    
    footer {
      margin-top: 3rem;
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
      <h1>🚀 TrackBoost Report</h1>
      <div class="subtitle">ELIXIR Marketing Dashboard</div>
      <div class="period">${startDate} - ${endDate}</div>
    </header>
    
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Gasto Total</div>
        <div class="kpi-value">€${totalGasto.toFixed(2)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Conversiones</div>
        <div class="kpi-value">${totalConv.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Alcance Total</div>
        <div class="kpi-value">${totalAlcance.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">€/Conversión</div>
        <div class="kpi-value">€${(totalGasto / totalConv).toFixed(2)}</div>
      </div>
    </div>
    
    
    ${trackBoostData.map(data => `
    <div class="artist-card">
      <div class="artist-header">
        <div>
          <div class="artist-name">${data.artist}</div>
          <div class="track-name">🎵 ${data.trackName}</div>
        </div>
        <div class="budget-badge budget-${data.budgetType.toLowerCase()}">${data.budgetType} - €${data.budgetTotal}</div>
      </div>
      
      <div class="budget-section">
        <div class="budget-title">💰 Presupuesto</div>
        <div class="budget-info">
          <div class="budget-item">
            <div class="budget-item-label">Usado</div>
            <div class="budget-item-value">€${data.budgetUsed.toFixed(2)}</div>
          </div>
          <div class="budget-item">
            <div class="budget-item-label">Restante</div>
            <div class="budget-item-value">€${data.budgetRemaining.toFixed(2)}</div>
          </div>
          <div class="budget-item">
            <div class="budget-item-label">Target Cost</div>
            <div class="budget-item-value">${data.targetCost}</div>
          </div>
        </div>
        <div class="budget-bar-container">
          <div class="budget-bar" style="width: ${data.budgetPercentage.toFixed(1)}%; background: ${data.budgetColor};">
            ${data.budgetPercentage.toFixed(1)}%
          </div>
        </div>
        <div class="budget-percentage">
          ${data.budgetPercentage < 60 ? '✅ Buen ritmo de gasto' : data.budgetPercentage < 80 ? '⚠️ Acercándose al límite' : '🔴 Presupuesto casi agotado'}
        </div>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">Gasto</div>
          <div class="metric-value">€${data.gasto.toFixed(2)}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Conversiones</div>
          <div class="metric-value">${data.conversiones.toLocaleString()}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">€/Conversión</div>
          <div class="metric-value">€${data.costPerConversion}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Alcance</div>
          <div class="metric-value">${data.alcance.toLocaleString()}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Popularidad</div>
          <div class="metric-value">${data.popularidad}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Saves Actuales</div>
          <div class="metric-value">${data.currentSaves > 0 ? data.currentSaves.toLocaleString() : 'N/A'}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Saves Ganados</div>
          <div class="metric-value" style="color: ${data.savesGanados > 0 ? '#10b981' : '#9ca3af'};">
            +${data.savesGanados || 0}
          </div>
        </div>
        <div class="metric-item">
          <div class="metric-label">💎 Coste/Save</div>
          <div class="metric-value" style="color: ${data.costeSave > 0.50 ? '#ef4444' : '#10b981'};">
            €${(data.costeSave || 0).toFixed(2)}
          </div>
        </div>
        <div class="metric-item">
          <div class="metric-label">📈 Estado</div>
          <div class="metric-value" style="font-size: 1.2rem;">${data.budgetStatus}</div>
        </div>
      </div>
      
      ${data.error ? `<div class="alert-warning">⚠️ ${data.error}</div>` : ''}
    </div>
    `).join('')}
    
    <footer>
      <p><strong>ELIXIR</strong> Marketing Dashboard - Report TrackBoost generado el ${new Date().toLocaleDateString('es-ES')}</p>
      <p style="margin-top: 0.5rem; font-size: 0.9rem;">🎯 Colores de presupuesto: Verde (&lt;60%) | Amarillo (60-80%) | Rojo (&gt;80%)</p>
    </footer>
  </div>
</body>
</html>`;
  }
};
