// ============================================
// GENERADOR DE REPORTES MEJORADO - EXCEL HTML
// ============================================

const ReportGeneratorNew = {
  
  // Generar report completo con datos reales de Spotify
  async generateFullMonitoringReport(campaigns, startDate, endDate) {
    const reportData = [];
    
    // Agrupar por artista
    const artistsData = {};
    
    for (const campaign of campaigns) {
      const artistName = campaign.artist;
      if (!artistsData[artistName]) {
        artistsData[artistName] = {
          artist: artistName,
          campaigns: [],
          totalSpent: 0,
          totalResults: 0,
          totalReach: 0
        };
      }
      
      artistsData[artistName].campaigns.push(campaign);
      artistsData[artistName].totalSpent += campaign.amountSpent;
      artistsData[artistName].totalResults += campaign.results;
      artistsData[artistName].totalReach += campaign.reach;
    }
    
    // Para cada artista, obtener datos de Spotify
    for (const [artistName, data] of Object.entries(artistsData)) {
      // Obtener baseline del 31/10
      const baseline = HistoricalData.getArtistBaseline(artistName);
      if (!baseline) continue;
      
      // Obtener datos actuales de Spotify
      const artist = CONFIG.artists.find(a => a.name === artistName);
      if (!artist || artist.skipSpotify || !artist.playlistId) continue;
      
      let spotifyData;
      try {
        spotifyData = await SpotifyAPI.getPlaylistData(artist.playlistId);
      } catch (error) {
        console.log(`No se pudieron obtener datos de Spotify para ${artistName}`);
        continue;
      }
      if (!spotifyData) continue;
      
      // Calcular increase
      const increase = spotifyData.followers - baseline.playlistFollowers;
      const costPerFollower = increase > 0 ? data.totalSpent / increase : 0;
      const costPerConversion = data.totalResults > 0 ? data.totalSpent / data.totalResults : 0;
      
      reportData.push({
        month: this.getMonthName(startDate),
        fecha: `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
        artist: artistName,
        costPerFollower: costPerFollower.toFixed(2),
        increaseFollowers: increase,
        spent: data.totalSpent.toFixed(2),
        conversions: data.totalResults,
        reach: data.totalReach,
        costPerConversion: costPerConversion.toFixed(2),
        followersStart: baseline.playlistFollowers,
        followersEnd: spotifyData.followers,
        monthlyListeners: baseline.monthlyListeners,  // Manual update needed
        profileFollowers: baseline.profileFollowers,   // Manual update needed
        startDay: this.formatDate(startDate),
        endDay: this.formatDate(endDate),
        actionTaken: this.getRecommendedAction(costPerFollower, increase),
        playlistLink: baseline.playlistLink
      });
    }
    
    return reportData;
  },

  // Generar Excel con formato HTML
  generateFormattedExcel(reportData) {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Monitoring Report - ELIXIR</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th { 
      background-color: #EA34FA; 
      color: white; 
      padding: 12px; 
      text-align: left;
      font-weight: bold;
      border: 1px solid #ddd;
    }
    td { 
      padding: 10px; 
      border: 1px solid #ddd;
      text-align: left;
    }
    tr:nth-child(even) { background-color: #f9f9f9; }
    tr:hover { background-color: #f5f5f5; }
    .low-cost { background-color: #d1fae5 !important; color: #065f46; font-weight: bold; }
    .medium-cost { background-color: #fef3c7 !important; color: #92400e; font-weight: bold; }
    .high-cost { background-color: #fee2e2 !important; color: #991b1b; font-weight: bold; }
    h1 { color: #EA34FA; border-bottom: 3px solid #EA34FA; padding-bottom: 10px; }
    .summary { 
      background: #f3e8ff; 
      padding: 15px; 
      border-radius: 8px; 
      margin: 20px 0;
      border-left: 4px solid #EA34FA;
    }
  </style>
</head>
<body>
  <h1>📊 MONITORING REPORT - ELIXIR</h1>
  <p><strong>Periodo:</strong> ${reportData[0]?.startDay} - ${reportData[0]?.endDay}</p>
  
  <div class="summary">
    <h3>RESUMEN GENERAL</h3>
    <p><strong>Total Gasto:</strong> €${this.calculateTotalSpent(reportData)}</p>
    <p><strong>Total Followers Ganados:</strong> +${this.calculateTotalIncrease(reportData)}</p>
    <p><strong>CPF Promedio:</strong> €${this.calculateAvgCPF(reportData)}</p>
    <p><strong>Total Artistas:</strong> ${reportData.length}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Artist</th>
        <th>€/Follower</th>
        <th>Increase Followers</th>
        <th>€ Gastado</th>
        <th>Conversiones</th>
        <th>Alcance</th>
        <th>€/Conv</th>
        <th>Followers Inicio</th>
        <th>Followers Final</th>
        <th>Oyentes</th>
        <th>Seguidores Perfil</th>
        <th>Acción Recomendada</th>
        <th>Playlist Link</th>
      </tr>
    </thead>
    <tbody>
`;

    reportData.forEach(row => {
      const cpf = parseFloat(row.costPerFollower);
      let rowClass = '';
      if (cpf <= 2) rowClass = 'low-cost';
      else if (cpf <= 3.5) rowClass = 'medium-cost';
      else if (cpf > 3.5) rowClass = 'high-cost';
      
      html += `
      <tr>
        <td>${row.month}</td>
        <td><strong>${row.artist}</strong></td>
        <td class="${rowClass}">€${row.costPerFollower}</td>
        <td>${row.increaseFollowers > 0 ? '+' : ''}${row.increaseFollowers}</td>
        <td>€${row.spent}</td>
        <td>${row.conversions}</td>
        <td>${row.reach.toLocaleString()}</td>
        <td>€${row.costPerConversion}</td>
        <td>${row.followersStart.toLocaleString()}</td>
        <td>${row.followersEnd.toLocaleString()}</td>
        <td>${row.monthlyListeners.toLocaleString()}</td>
        <td>${row.profileFollowers.toLocaleString()}</td>
        <td>${row.actionTaken}</td>
        <td><a href="${row.playlistLink}" target="_blank">Ver Playlist</a></td>
      </tr>
      `;
    });

    html += `
    </tbody>
  </table>
  
  <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <h3>LEYENDA DE COLORES</h3>
    <p><span class="low-cost" style="padding: 5px 10px; border-radius: 4px;">€/Follower < €0.50</span> - Excelente rendimiento</p>
    <p><span class="medium-cost" style="padding: 5px 10px; border-radius: 4px;">€/Follower €0.50-0.90</span> - Rendimiento aceptable</p>
    <p><span class="high-cost" style="padding: 5px 10px; border-radius: 4px;">€/Follower > €0.90</span> - Requiere optimización</p>
  </div>
  
  <footer style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #EA34FA; text-align: center; color: #666;">
    <p>Report generado por ELIXIR Marketing Dashboard - ${new Date().toLocaleDateString('es-ES')}</p>
  </footer>
</body>
</html>
    `;
    
    return html;
  },

  // Descargar como Excel (HTML que Excel puede abrir)
  downloadExcelReport(reportData) {
    const html = this.generateFormattedExcel(reportData);
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monitoring_Report_${reportData[0]?.startDay}_${reportData[0]?.endDay}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Generar report individual por artista
  async generateArtistReport(artistName, startDate, endDate) {
    const campaigns = App.data.enrichedData.filter(c => c.artist === artistName);
    if (campaigns.length === 0) return null;
    
    const baseline = HistoricalData.getArtistBaseline(artistName);
    if (!baseline) return null;
    
    const artist = CONFIG.artists.find(a => a.name === artistName);
    if (!artist) return null;
    
    const spotifyData = await SpotifyAPI.getPlaylistData(artist.playlistId);
    if (!spotifyData) return null;
    
    const totalSpent = campaigns.reduce((sum, c) => sum + c.amountSpent, 0);
    const totalResults = campaigns.reduce((sum, c) => sum + c.results, 0);
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
    
    const increase = spotifyData.followers - baseline.playlistFollowers;
    const costPerFollower = increase > 0 ? totalSpent / increase : 0;
    
    return {
      artist: artistName,
      period: { start: startDate, end: endDate },
      metrics: {
        spent: totalSpent,
        results: totalResults,
        reach: totalReach,
        followersStart: baseline.playlistFollowers,
        followersEnd: spotifyData.followers,
        increase: increase,
        costPerFollower: costPerFollower,
        monthlyListeners: baseline.monthlyListeners,
        profileFollowers: baseline.profileFollowers
      },
      campaigns: campaigns,
      spotifyData: spotifyData,
      analysis: this.analyzeArtistPerformance(costPerFollower, increase, spotifyData.popularity),
      recommendation: this.getRecommendedAction(costPerFollower, increase)
    };
  },

  // Helpers
  getMonthName(dateString) {
    const date = new Date(dateString);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[date.getMonth()];
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  getRecommendedAction(cpf, increase) {
    if (cpf <= 2 && increase < 50) return 'Cambiar cover de playlist';
    if (cpf <= 2 && increase >= 50) return 'Mantener estrategia';
    if (cpf > 3.5) return 'Revisar targeting';
    return 'Optimizar cover + targeting';
  },

  analyzeArtistPerformance(cpf, increase, popularity) {
    const insights = [];
    
    if (cpf <= 2) insights.push('✅ Excelente eficiencia de coste');
    else if (cpf > 3.5) insights.push('⚠️ CPF alto - requiere optimización');
    
    if (increase >= 50) insights.push('✅ Buen volumen de crecimiento');
    else insights.push('⚠️ Volumen bajo de followers');
    
    if (popularity >= 60) insights.push('✅ Playlist popular');
    
    return insights;
  },

  calculateTotalSpent(reportData) {
    return reportData.reduce((sum, r) => sum + parseFloat(r.spent), 0).toFixed(2);
  },

  calculateTotalIncrease(reportData) {
    return reportData.reduce((sum, r) => sum + parseInt(r.increaseFollowers), 0);
  },

  calculateAvgCPF(reportData) {
    const total = reportData.reduce((sum, r) => sum + parseFloat(r.costPerFollower), 0);
    return (total / reportData.length).toFixed(2);
  }
};
