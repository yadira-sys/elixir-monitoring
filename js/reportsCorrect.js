// ============================================
// SISTEMA DE REPORTS CORREGIDO - DICIEMBRE 2025
// ============================================

const ReportsCorrect = {
  
  // ========== NUEVAS REGLAS DE COLORES ==========
  colors: {
    // Monitoring Campaign (Cost per Follower)
    monitoring: {
      excellent: '#10B981', // Verde < 0.50
      lightOrange: '#FB923C', // Naranja claro 0.50-0.70
      darkOrange: '#F97316', // Naranja oscuro 0.70-0.99
      critical: '#EF4444' // Rojo >= 1.00
    },
    // TrackBoost
    trackboost: {
      excellent: '#10B981', // Verde <= 0.50
      warning: '#FBBF24', // Amarillo 0.51-0.90
      critical: '#EF4444' // Rojo > 0.90
    },
    // Conversiones
    conversion: {
      normal: '#374151',
      warning: '#DC2626' // Destacar si > umbral
    },
    // Elixir branding
    elixir: {
      primary: '#EA34FA',
      secondary: '#ff6bff',
      dark: '#1f2937',
      light: '#f9fafb'
    }
  },

  // Obtener color según CPF (Monitoring)
  getMonitoringCPFColor(cpf) {
    if (cpf < 0.50) return this.colors.monitoring.excellent;
    if (cpf < 0.70) return this.colors.monitoring.lightOrange;
    if (cpf < 1.00) return this.colors.monitoring.darkOrange;
    return this.colors.monitoring.critical;
  },

  // Obtener color según CPF (TrackBoost)
  getTrackboostCPFColor(cpf) {
    if (cpf <= 0.50) return this.colors.trackboost.excellent;
    if (cpf <= 0.90) return this.colors.trackboost.warning;
    return this.colors.trackboost.critical;
  },

  // Destacar conversión (Playlist)
  shouldHighlightConversion(costPerConv, threshold = 0.20) {
    return costPerConv > threshold;
  },

  // Destacar coste por click/conversión (salvo TrackBoost)
  shouldHighlightTrackboostConv(costPerClick) {
    return costPerClick > 0.20; // Resaltar si coste click > €0.20
  },

  // ========== REPORT HTML VISUAL (MONITORING + TRACKBOOST) ==========
  async generateHTMLReport(enrichedData, startDate, endDate) {
    try {
      // Filtrar datos por fecha
      const filtered = enrichedData.filter(item => {
        if (!item.startDate) return false;
        const itemDate = new Date(item.startDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });

      // SEPARAR: Monitoring (sin TrackBoost) vs TrackBoost
      const monitoringData = filtered.filter(item => !item.isTrackboost);
      const trackboostData = filtered.filter(item => item.isTrackboost);

      // Generar HTML
      const html = this.generateBrandedHTML(monitoringData, trackboostData, startDate, endDate);

      // Descargar
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Monitoring_Visual_${startDate}_${endDate}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`✅ HTML Visual Report downloaded: ${startDate} to ${endDate}`);
    } catch (error) {
      console.error('Error generating HTML report:', error);
      alert('❌ Error generating HTML report: ' + error.message);
    }
  },

  // ========== HTML CON BRANDING ELIXIR (MONITORING + TRACKBOOST) ==========
  generateBrandedHTML(monitoringData, trackboostData, startDate, endDate) {
    // Calcular KPIs Monitoring
    const totalSpent = monitoringData.reduce((sum, item) => sum + (item.amountSpent || 0), 0);
    const totalConversions = monitoringData.reduce((sum, item) => sum + (item.results || 0), 0);
    const totalReach = monitoringData.reduce((sum, item) => sum + (item.reach || 0), 0);

    // Calcular followers ganados (requiere datos históricos)
    let totalFollowersGained = 0;
    monitoringData.forEach(item => {
      const artist = item.artist;
      const baseline = HistoricalData.getArtistBaseline(artist, '2025-10-31');
      const currentFollowers = item.spotifyFollowers || 0;
      const baselineFollowers = baseline ? baseline.followers : 0;
      const gain = currentFollowers - baselineFollowers;
      if (gain > 0) totalFollowersGained += gain;
    });

    const avgCPF = totalFollowersGained > 0 ? totalSpent / totalFollowersGained : 0;
    const totalArtists = new Set(monitoringData.map(item => item.artist)).size;

    // Calcular KPIs TrackBoost
    const tbSpent = trackboostData.reduce((sum, item) => sum + (item.amountSpent || 0), 0);
    const tbConversions = trackboostData.reduce((sum, item) => sum + (item.results || 0), 0);
    const tbTracks = trackboostData.length;

    // Generar filas de tabla MONITORING
    const monitoringRows = monitoringData.map(item => {
      const artist = item.artist || 'Unknown';
      const baseline = HistoricalData.getArtistBaseline(artist, '2025-10-31');
      const baselineFollowers = baseline ? baseline.followers : 0;
      const currentFollowers = item.spotifyFollowers || baselineFollowers;
      const increase = currentFollowers - baselineFollowers;
      const cpf = increase > 0 ? (item.amountSpent || 0) / increase : 0;
      const cpfColor = this.getMonitoringCPFColor(cpf);
      const convCost = item.costPerResult || 0;
      const convHighlight = this.shouldHighlightConversion(convCost) ? 'background-color: #FEE2E2;' : '';

      return `
        <tr>
          <td>${artist}</td>
          <td style="background-color: ${cpfColor}; color: white; font-weight: 700;">€${cpf.toFixed(2)}</td>
          <td style="color: ${increase >= 0 ? '#10B981' : '#EF4444'}; font-weight: 600;">${increase >= 0 ? '+' : ''}${increase}</td>
          <td>€${(item.amountSpent || 0).toFixed(2)}</td>
          <td>${item.results || 0}</td>
          <td style="${convHighlight}">€${convCost.toFixed(3)}</td>
          <td>${item.reach || 0}</td>
          <td>${baselineFollowers}</td>
          <td>${currentFollowers}</td>
          <td>${item.startDate || 'N/A'}</td>
          <td>${item.endDate || 'N/A'}</td>
        </tr>
      `;
    }).join('');

    // Generar filas de tabla TRACKBOOST
    const trackboostRows = trackboostData.map(item => {
      const artist = item.artist || 'Unknown';
      const cpf = (item.results || 0) > 0 ? (item.amountSpent || 0) / (item.results || 1) : 0;
      const cpfColor = this.getTrackboostCPFColor(cpf);
      const convCost = item.costPerResult || 0;
      const convHighlight = this.shouldHighlightTrackboostConv(convCost) ? 'background-color: #FEE2E2;' : '';

      // Datos de Spotify (si existen)
      const popularity = item.trackPopularity || 'N/A';
      const saves = item.trackSaves || 'N/A';
      const streams = item.trackStreams || 'N/A';

      return `
        <tr>
          <td>${artist}</td>
          <td>${item.trackName || 'N/A'}</td>
          <td style="background-color: ${cpfColor}; color: white; font-weight: 700;">€${cpf.toFixed(2)}</td>
          <td>€${(item.amountSpent || 0).toFixed(2)}</td>
          <td>${item.results || 0}</td>
          <td style="${convHighlight}">€${convCost.toFixed(3)}</td>
          <td>${popularity}</td>
          <td>${saves}</td>
          <td>${streams}</td>
          <td>${item.reach || 0}</td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELIXIR Monitoring Report - ${startDate} to ${endDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      color: #1f2937;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 4px solid ${this.colors.elixir.primary};
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .period {
      font-size: 1.1rem;
      color: #6b7280;
      font-weight: 500;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    .kpi-card {
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(234, 52, 250, 0.2);
    }
    .kpi-label {
      font-size: 0.9rem;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }
    .kpi-value {
      font-size: 2.2rem;
      font-weight: 900;
      color: ${this.colors.elixir.primary};
    }
    .section {
      margin-bottom: 3rem;
    }
    .section-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid ${this.colors.elixir.primary};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      overflow-x: auto;
      display: block;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    thead {
      background: linear-gradient(135deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      color: white;
    }
    th {
      padding: 1rem;
      text-align: left;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
    }
    td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }
    tbody tr:hover {
      background-color: #f9fafb;
    }
    .legend {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid ${this.colors.elixir.primary};
    }
    .legend-title {
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      color: #1f2937;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }
    .legend-color {
      width: 30px;
      height: 20px;
      border-radius: 4px;
      margin-right: 10px;
    }
    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 3px solid ${this.colors.elixir.primary};
      color: #6b7280;
    }
    .elixir-logo {
      font-size: 2rem;
      font-weight: 900;
      background: linear-gradient(135deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎵 ELIXIR MONITORING REPORT</h1>
      <p class="period">Period: ${startDate} - ${endDate}</p>
    </header>
    
    <!-- KPIs MONITORING -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Spent</div>
        <div class="kpi-value">€${totalSpent.toFixed(2)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Followers Gained</div>
        <div class="kpi-value">+${totalFollowersGained}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Avg CPF</div>
        <div class="kpi-value">€${avgCPF.toFixed(2)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Artists</div>
        <div class="kpi-value">${totalArtists}</div>
      </div>
    </div>
    
    <!-- TABLA MONITORING -->
    <div class="section">
      <h2 class="section-title">📊 Monitoring por Artista</h2>
      <table>
        <thead>
          <tr>
            <th>Artist</th>
            <th>€/Follower</th>
            <th>Increase</th>
            <th>€ Spent</th>
            <th>Conversions</th>
            <th>€/Conv</th>
            <th>Reach</th>
            <th>Followers Start</th>
            <th>Followers End</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
          ${monitoringRows || '<tr><td colspan="11" style="text-align:center;">No monitoring data available</td></tr>'}
        </tbody>
      </table>
      
      <!-- LEYENDA MONITORING -->
      <div class="legend">
        <div class="legend-title">Cost per Follower (CPF) Legend:</div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${this.colors.monitoring.excellent};"></div>
          <span><strong>Excellent:</strong> CPF < €0.50</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${this.colors.monitoring.lightOrange};"></div>
          <span><strong>Good:</strong> CPF €0.50 - €0.70</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${this.colors.monitoring.darkOrange};"></div>
          <span><strong>Warning:</strong> CPF €0.70 - €0.99</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${this.colors.monitoring.critical};"></div>
          <span><strong>Critical:</strong> CPF ≥ €1.00</span>
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
          <strong>Conversion Cost:</strong> Highlighted in red if > €0.20
        </div>
      </div>
    </div>
    
    <!-- TABLA TRACKBOOST -->
    ${trackboostData.length > 0 ? `
    <div class="section">
      <h2 class="section-title">🚀 TrackBoost Campaigns</h2>
      <div class="kpi-grid" style="margin-bottom: 1.5rem;">
        <div class="kpi-card">
          <div class="kpi-label">TB Total Spent</div>
          <div class="kpi-value">€${tbSpent.toFixed(2)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TB Conversions</div>
          <div class="kpi-value">${tbConversions}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TB Tracks</div>
          <div class="kpi-value">${tbTracks}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Artist</th>
            <th>Track</th>
            <th>€/Conv (CPF)</th>
            <th>€ Spent</th>
            <th>Conversions</th>
            <th>€/Result</th>
            <th>Popularity</th>
            <th>Saves</th>
            <th>Streams</th>
            <th>Reach</th>
          </tr>
        </thead>
        <tbody>
          ${trackboostRows}
        </tbody>
      </table>
      
      <!-- LEYENDA TRACKBOOST -->
      <div class="legend">
        <div class="legend-title">TrackBoost CPF Legend:</div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${this.colors.trackboost.excellent};"></div>
          <span><strong>Excellent:</strong> CPF ≤ €0.50</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${this.colors.trackboost.warning};"></div>
          <span><strong>Warning:</strong> CPF €0.51 - €0.90</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${this.colors.trackboost.critical};"></div>
          <span><strong>Critical:</strong> CPF > €0.90</span>
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
          <strong>Conversion Cost:</strong> Highlighted in red if > €0.50
        </div>
      </div>
    </div>
    ` : '<p style="text-align:center; color:#6b7280; font-style:italic;">No TrackBoost campaigns in this period</p>'}
    
    <footer>
      <div class="elixir-logo">ELIXIR</div>
      <p>Marketing Musical Dashboard © 2025</p>
      <p style="font-size: 0.8rem; margin-top: 0.5rem;">Generated: ${new Date().toLocaleString()}</p>
    </footer>
  </div>
</body>
</html>
    `;
  },

  // ========== REPORT INDIVIDUAL ARTISTA (EN INGLÉS) ==========
  async generateArtistReport(artist, enrichedData, startDate, endDate) {
    try {
      // Filtrar campañas del artista
      const artistCampaigns = enrichedData.filter(item => {
        const matchArtist = item.artist === artist;
        const itemDate = new Date(item.startDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const matchDate = itemDate >= start && itemDate <= end;
        return matchArtist && matchDate && !item.isTrackboost; // Excluir TrackBoost
      });

      if (artistCampaigns.length === 0) {
        alert(`⚠️ No campaigns found for ${artist} in this period`);
        return;
      }

      // Obtener datos históricos
      const baseline = HistoricalData.getArtistBaseline(artist, '2025-10-31');
      const baselineFollowers = baseline ? baseline.followers : 0;

      // Obtener datos actuales de Spotify
      const artistConfig = CONFIG.artists.find(a => a.name === artist);
      let currentFollowers = baselineFollowers;
      let popularity = 'N/A';

      if (artistConfig && artistConfig.playlistId) {
        const spotifyData = await SpotifyAPI.getPlaylistData(artistConfig.playlistId);
        if (spotifyData) {
          currentFollowers = spotifyData.followers;
          popularity = spotifyData.popularity;
        }
      }

      // Calcular métricas
      const totalSpent = artistCampaigns.reduce((sum, c) => sum + (c.amountSpent || 0), 0);
      const totalConversions = artistCampaigns.reduce((sum, c) => sum + (c.results || 0), 0);
      const totalReach = artistCampaigns.reduce((sum, c) => sum + (c.reach || 0), 0);
      const followersGained = currentFollowers - baselineFollowers;
      const costPerFollower = followersGained > 0 ? totalSpent / followersGained : 0;
      const costPerConversion = totalConversions > 0 ? totalSpent / totalConversions : 0;

      // Generar HTML
      const html = this.generateArtistHTML({
        artist,
        period: { start: startDate, end: endDate },
        metrics: {
          followersStart: baselineFollowers,
          followersEnd: currentFollowers,
          increase: followersGained,
          costPerFollower: costPerFollower || 0,
          costPerConversion: costPerConversion || 0
        },
        totalSpent,
        totalConversions,
        totalReach,
        popularity,
        campaigns: artistCampaigns
      });

      // Descargar
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${artist.replace(/\s/g, '_')}_${startDate}_${endDate}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`✅ Artist report for ${artist} downloaded`);
    } catch (error) {
      console.error('Error generating artist report:', error);
      alert('❌ Error generating artist report: ' + error.message);
    }
  },

  // HTML para report individual (EN INGLÉS)
  generateArtistHTML(data) {
    const { artist, period, metrics, totalSpent, totalConversions, totalReach, popularity, campaigns } = data;

    // Validar métricas
    const cpf = metrics.costPerFollower !== undefined && !isNaN(metrics.costPerFollower) ? metrics.costPerFollower : 0;
    const cpc = metrics.costPerConversion !== undefined && !isNaN(metrics.costPerConversion) ? metrics.costPerConversion : 0;
    const increase = metrics.increase !== undefined && !isNaN(metrics.increase) ? metrics.increase : 0;

    // Determinar performance
    let performance = 'Needs optimization';
    if (cpf <= 0.50) performance = 'Excellent';
    else if (cpf <= 0.70) performance = 'Good';
    else if (cpf <= 0.99) performance = 'Warning';

    // Generar filas de campañas
    const campaignRows = campaigns.map(c => `
      <tr>
        <td>${c.campaignName || 'N/A'}</td>
        <td>€${(c.amountSpent || 0).toFixed(2)}</td>
        <td>${c.results || 0}</td>
        <td>€${(c.costPerResult || 0).toFixed(3)}</td>
        <td>${c.reach || 0}</td>
        <td>${c.impressions || 0}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artist Report - ${artist}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      color: #1f2937;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 4px solid ${this.colors.elixir.primary};
    }
    h1 {
      font-size: 2rem;
      font-weight: 900;
      background: linear-gradient(135deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .artist-name {
      font-size: 1.8rem;
      font-weight: 800;
      color: #1f2937;
      margin: 0.5rem 0;
    }
    .period {
      font-size: 1rem;
      color: #6b7280;
      font-weight: 500;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    .kpi-card {
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: transform 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(234, 52, 250, 0.2);
    }
    .kpi-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .kpi-label {
      font-size: 0.85rem;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }
    .kpi-value {
      font-size: 1.8rem;
      font-weight: 900;
      color: ${this.colors.elixir.primary};
    }
    .kpi-sublabel {
      font-size: 0.8rem;
      color: #9ca3af;
      margin-top: 0.3rem;
    }
    .positive { color: #10B981 !important; }
    .negative { color: #EF4444 !important; }
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid ${this.colors.elixir.primary};
    }
    .performance-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
      margin-top: 1rem;
    }
    .performance-excellent { background: #10B981; color: white; }
    .performance-good { background: #FB923C; color: white; }
    .performance-warning { background: #F97316; color: white; }
    .performance-critical { background: #EF4444; color: white; }
    .progress-container {
      width: 100%;
      height: 40px;
      background: #e5e7eb;
      border-radius: 20px;
      overflow: hidden;
      margin-top: 1rem;
      position: relative;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      transition: width 0.5s ease;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    thead {
      background: linear-gradient(135deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      color: white;
    }
    th {
      padding: 1rem;
      text-align: left;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
    }
    td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }
    tbody tr:hover {
      background-color: #f9fafb;
    }
    .chart-container {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 8px;
      text-align: center;
    }
    .chart-bar {
      display: flex;
      align-items: center;
      margin: 1rem 0;
    }
    .chart-label {
      width: 150px;
      text-align: right;
      margin-right: 1rem;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .chart-bar-fill {
      height: 30px;
      background: linear-gradient(90deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      border-radius: 4px;
      display: flex;
      align-items: center;
      padding-left: 10px;
      color: white;
      font-weight: 700;
      font-size: 0.85rem;
    }
    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 3px solid ${this.colors.elixir.primary};
      color: #6b7280;
    }
    .elixir-logo {
      font-size: 1.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎵 ARTIST INDIVIDUAL REPORT</h1>
      <div class="artist-name">${artist}</div>
      <p class="period">Period: ${period.start} - ${period.end}</p>
    </header>
    
    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">👥</div>
        <div class="kpi-label">Followers Gained</div>
        <div class="kpi-value ${increase >= 0 ? 'positive' : 'negative'}">
          ${increase >= 0 ? '+' : ''}${increase}
        </div>
        <div class="kpi-sublabel">${metrics.followersStart.toLocaleString()} → ${metrics.followersEnd.toLocaleString()}</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">💵</div>
        <div class="kpi-label">Cost per Follower</div>
        <div class="kpi-value">€${cpf.toFixed(2)}</div>
        <div class="kpi-sublabel">${performance}</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div class="kpi-label">Conversions</div>
        <div class="kpi-value">${totalConversions}</div>
        <div class="kpi-sublabel">Total clicks</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">📡</div>
        <div class="kpi-label">Total Reach</div>
        <div class="kpi-value">${totalReach.toLocaleString()}</div>
        <div class="kpi-sublabel">People reached</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-label">Total Spent</div>
        <div class="kpi-value">€${totalSpent.toFixed(2)}</div>
        <div class="kpi-sublabel">Campaign budget</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">⭐</div>
        <div class="kpi-label">Popularity</div>
        <div class="kpi-value">${popularity !== 'N/A' ? popularity : 'N/A'}</div>
        <div class="kpi-sublabel">Spotify score</div>
      </div>
    </div>
    
    <!-- Performance Badge -->
    <div style="text-align: center;">
      <div class="performance-badge performance-${performance.toLowerCase().replace(' ', '-')}">
        Performance: ${performance}
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="section">
      <h2 class="section-title">📈 Progress to Goal</h2>
      <div class="progress-container">
        <div class="progress-bar" style="width: ${Math.min((increase / 250) * 100, 100)}%">
          ${Math.round((increase / 250) * 100)}% of goal (250 followers)
        </div>
      </div>
      <p style="text-align: center; margin-top: 0.5rem; color: #6b7280; font-size: 0.9rem;">
        ${increase >= 250 ? '🎉 Goal achieved!' : `${250 - increase} followers to reach goal`}
      </p>
    </div>
    
    <!-- Visual Charts -->
    <div class="section">
      <h2 class="section-title">📊 Metrics Overview</h2>
      <div class="chart-container">
        <div class="chart-bar">
          <div class="chart-label">Followers Gained</div>
          <div class="chart-bar-fill" style="width: ${Math.min((increase / 250) * 100, 100)}%">
            ${increase}
          </div>
        </div>
        <div class="chart-bar">
          <div class="chart-label">Total Conversions</div>
          <div class="chart-bar-fill" style="width: ${Math.min((totalConversions / 1000) * 100, 100)}%">
            ${totalConversions}
          </div>
        </div>
        <div class="chart-bar">
          <div class="chart-label">Total Spent</div>
          <div class="chart-bar-fill" style="width: ${Math.min((totalSpent / 150) * 100, 100)}%">
            €${totalSpent.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Campaign Details -->
    <div class="section">
      <h2 class="section-title">📋 Campaign Details</h2>
      <table>
        <thead>
          <tr>
            <th>Campaign Name</th>
            <th>€ Spent</th>
            <th>Conversions</th>
            <th>€/Conv</th>
            <th>Reach</th>
            <th>Impressions</th>
          </tr>
        </thead>
        <tbody>
          ${campaignRows}
        </tbody>
      </table>
    </div>
    
    <!-- Recommendations -->
    <div class="section">
      <h2 class="section-title">💡 Recommendations</h2>
      <div style="padding: 1.5rem; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${this.colors.elixir.primary};">
        ${cpf < 0.50 ? '<p><strong>Excellent performance!</strong> Keep the current strategy and consider scaling budget by 20%.</p>' :
          cpf < 0.70 ? '<p><strong>Good performance.</strong> Maintain current strategy and test new creatives.</p>' :
          cpf < 1.00 ? '<p><strong>Performance needs improvement.</strong> Consider optimizing targeting and testing new playlist covers.</p>' :
          '<p><strong>Critical performance.</strong> Review targeting strategy, refresh creatives, and analyze audience engagement.</p>'}
        ${increase < 250 ? '<p style="margin-top: 1rem;">Continue campaigns to reach monthly goal of 250 followers.</p>' : ''}
      </div>
    </div>
    
    <footer>
      <div class="elixir-logo">ELIXIR</div>
      <p>Marketing Musical Dashboard © 2025</p>
      <p style="font-size: 0.8rem; margin-top: 0.5rem;">Generated: ${new Date().toLocaleString()}</p>
      <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.5rem;">All data sourced from Meta Ads and Spotify API | No estimated data</p>
    </footer>
  </div>
</body>
</html>
    `;
  },

  // ========== REPORT TRACKBOOST (CON DATOS REALES SPOTIFY) ==========
  async generateTrackboostReport(enrichedData, startDate, endDate) {
    try {
      // Filtrar TrackBoost campaigns
      const trackboostCampaigns = enrichedData.filter(item => {
        if (!item.isTrackboost) return false;
        const itemDate = new Date(item.startDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });

      if (trackboostCampaigns.length === 0) {
        alert('⚠️ No TrackBoost campaigns found in this period');
        return;
      }

      // Agrupar por artista (para unificar múltiples ads)
      const grouped = {};
      trackboostCampaigns.forEach(campaign => {
        const artist = campaign.artist;
        if (!grouped[artist]) {
          grouped[artist] = {
            artist,
            campaigns: [],
            totalSpent: 0,
            totalConversions: 0,
            totalReach: 0,
            trackName: campaign.trackName || 'N/A',
            trackId: campaign.trackId || ''
          };
        }
        grouped[artist].campaigns.push(campaign);
        grouped[artist].totalSpent += campaign.amountSpent || 0;
        grouped[artist].totalConversions += campaign.results || 0;
        grouped[artist].totalReach += campaign.reach || 0;
      });

      // Obtener datos de Spotify para cada track
      const rows = [];
      for (const artist in grouped) {
        const data = grouped[artist];
        const cpf = data.totalConversions > 0 ? data.totalSpent / data.totalConversions : 0;
        const costPerResult = data.totalConversions > 0 ? data.totalSpent / data.totalConversions : 0;

        // Obtener datos de Spotify
        let popularity = 'N/A';
        let saves = 'Data not available';
        let streams = 'Data not available';
        let lastSaves = 'No history';

        if (data.trackId) {
          const trackData = await SpotifyAPI.getTrackData(data.trackId);
          if (trackData) {
            popularity = trackData.popularity || 'N/A';
            // Nota: Spotify API no proporciona saves ni streams directamente
            saves = 'Data not available from Spotify API';
            streams = 'Data not available from Spotify API';
          }
        }

        rows.push({
          artist: data.artist,
          trackName: data.trackName,
          totalSpent: data.totalSpent,
          conversions: data.totalConversions,
          costPerResult,
          cpf,
          reach: data.totalReach,
          popularity,
          saves,
          streams,
          lastSaves,
          targetCost: '€0.50', // Meta objetivo
          campaigns: data.campaigns.map(c => c.campaignName).join(', ')
        });
      }

      // Generar HTML
      const html = this.generateTrackboostHTML(rows, startDate, endDate);

      // Descargar
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_TrackBoost_${startDate}_${endDate}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`✅ TrackBoost report downloaded: ${startDate} to ${endDate}`);
    } catch (error) {
      console.error('Error generating TrackBoost report:', error);
      alert('❌ Error generating TrackBoost report: ' + error.message);
    }
  },

  // HTML TrackBoost
  generateTrackboostHTML(rows, startDate, endDate) {
    const totalSpent = rows.reduce((sum, r) => sum + r.totalSpent, 0);
    const totalConv = rows.reduce((sum, r) => sum + r.conversions, 0);
    const avgCPF = totalConv > 0 ? totalSpent / totalConv : 0;

    const tableRows = rows.map(r => {
      const cpfColor = this.getTrackboostCPFColor(r.cpf);
      const convHighlight = this.shouldHighlightTrackboostConv(r.costPerResult) ? 'background-color: #FEE2E2;' : '';

      return `
        <tr>
          <td>${r.artist}</td>
          <td>${r.trackName}</td>
          <td style="background-color: ${cpfColor}; color: white; font-weight: 700;">€${r.cpf.toFixed(2)}</td>
          <td>€${r.totalSpent.toFixed(2)}</td>
          <td>${r.conversions}</td>
          <td style="${convHighlight}">€${r.costPerResult.toFixed(3)}</td>
          <td>${r.reach.toLocaleString()}</td>
          <td>${r.popularity}</td>
          <td>${r.targetCost}</td>
          <td>${r.saves}</td>
          <td>${r.streams}</td>
          <td>${r.lastSaves}</td>
          <td style="font-size: 0.75rem;">${r.campaigns}</td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELIXIR TrackBoost Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      color: #1f2937;
    }
    .container {
      max-width: 1600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 4px solid ${this.colors.elixir.primary};
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .period {
      font-size: 1.1rem;
      color: #6b7280;
      font-weight: 500;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    .kpi-card {
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    .kpi-label {
      font-size: 0.9rem;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .kpi-value {
      font-size: 2.2rem;
      font-weight: 900;
      color: ${this.colors.elixir.primary};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      overflow-x: auto;
      display: block;
    }
    thead {
      background: linear-gradient(135deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      color: white;
    }
    th {
      padding: 1rem;
      text-align: left;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.7rem;
    }
    td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }
    tbody tr:hover {
      background-color: #f9fafb;
    }
    .legend {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid ${this.colors.elixir.primary};
    }
    .legend-title {
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }
    .legend-color {
      width: 30px;
      height: 20px;
      border-radius: 4px;
      margin-right: 10px;
    }
    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 3px solid ${this.colors.elixir.primary};
      color: #6b7280;
    }
    .elixir-logo {
      font-size: 2rem;
      font-weight: 900;
      background: linear-gradient(135deg, ${this.colors.elixir.primary} 0%, ${this.colors.elixir.secondary} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .data-note {
      background: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 1rem;
      margin: 1.5rem 0;
      border-radius: 4px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 ELIXIR TRACKBOOST REPORT</h1>
      <p class="period">Period: ${startDate} - ${endDate}</p>
    </header>
    
    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Spent</div>
        <div class="kpi-value">€${totalSpent.toFixed(2)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Conversions</div>
        <div class="kpi-value">${totalConv}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Avg CPF</div>
        <div class="kpi-value">€${avgCPF.toFixed(2)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Tracks</div>
        <div class="kpi-value">${rows.length}</div>
      </div>
    </div>
    
    <!-- Nota sobre datos -->
    <div class="data-note">
      <strong>📊 Data Note:</strong> Spotify API does not provide direct access to track saves or streams data. 
      Popularity score (0-100) is provided where available. All financial data is sourced from Meta Ads campaigns.
    </div>
    
    <!-- Tabla -->
    <table>
      <thead>
        <tr>
          <th>Artist</th>
          <th>Track</th>
          <th>€/Conv (CPF)</th>
          <th>€ Spent</th>
          <th>Conversions</th>
          <th>€/Result</th>
          <th>Reach</th>
          <th>Popularity</th>
          <th>Target Cost</th>
          <th>Total Saves</th>
          <th>Streams</th>
          <th>Last Monitoring Increase</th>
          <th>Campaigns</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    
    <!-- Leyenda -->
    <div class="legend">
      <div class="legend-title">TrackBoost CPF Legend:</div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${this.colors.trackboost.excellent};"></div>
        <span><strong>Excellent:</strong> CPF ≤ €0.50</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${this.colors.trackboost.warning};"></div>
        <span><strong>Warning:</strong> CPF €0.51 - €0.90</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${this.colors.trackboost.critical};"></div>
        <span><strong>Critical:</strong> CPF > €0.90</span>
      </div>
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
        <strong>Conversion Cost:</strong> Highlighted in red if > €0.50
      </div>
    </div>
    
    <footer>
      <div class="elixir-logo">ELIXIR</div>
      <p>Marketing Musical Dashboard © 2025</p>
      <p style="font-size: 0.8rem; margin-top: 0.5rem;">Generated: ${new Date().toLocaleString()}</p>
      <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.5rem;">Real data from Meta Ads and Spotify API | No estimated values</p>
    </footer>
  </div>
</body>
</html>
    `;
  }
};
