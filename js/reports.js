// ============================================
// GENERADOR DE REPORTES - WORD Y EXCEL
// ============================================

const ReportGenerator = {
  
  // Generar reporte individual en Word (HTML convertible)
  generateIndividualReport(artistData, period) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report ${artistData.artist} - ${period.start} a ${period.end}</title>
  <style>
    body {
      font-family: 'Calibri', Arial, sans-serif;
      line-height: 1.6;
      color: #1C1C1C;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #EA34FA;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #EA34FA;
      font-size: 28px;
      margin: 0;
    }
    .header .period {
      color: #666;
      font-size: 14px;
      margin-top: 10px;
    }
    .kpi-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .kpi-card {
      border: 2px solid #EA34FA;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .kpi-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: bold;
      color: #EA34FA;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #EA34FA;
      border-bottom: 2px solid #EA34FA;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .insight-list {
      list-style: none;
      padding: 0;
    }
    .insight-list li {
      padding: 10px;
      margin: 8px 0;
      background: #f5f5f5;
      border-left: 4px solid #EA34FA;
    }
    .recommendation {
      background: #fff3cd;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 10px 0;
    }
    .recommendation strong {
      color: #f59e0b;
    }
    .alert {
      background: #fee;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 10px 0;
    }
    .success {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 10px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #EA34FA;
      color: white;
      font-weight: bold;
    }
    tr:hover {
      background: #f5f5f5;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #EA34FA;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${artistData.artist}</h1>
    <div class="period">Periodo: ${this.formatDate(period.start)} - ${this.formatDate(period.end)}</div>
  </div>

  <div class="kpi-section">
    <div class="kpi-card">
      <div class="kpi-label">Inversión Total</div>
      <div class="kpi-value">€${artistData.totalSpent.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Followers Ganados</div>
      <div class="kpi-value">+${artistData.totalResults}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Coste por Follower</div>
      <div class="kpi-value">€${artistData.avgCostPerResult}</div>
    </div>
  </div>

  ${this.generateSpotifySection(artistData.spotifyData)}
  
  ${this.generateAnalysisSection(artistData.analysis)}
  
  ${this.generateRecommendationsSection(artistData.analysis)}
  
  ${this.generateCampaignsTable(artistData.campaigns)}
  
  <div class="footer">
    <p>Report generado por ELIXIR Marketing Dashboard</p>
    <p>${new Date().toLocaleDateString('es-ES')}</p>
  </div>
</body>
</html>
    `;
    
    return html;
  },

  // Sección de datos Spotify
  generateSpotifySection(spotifyData) {
    if (!spotifyData) {
      return '<div class="section"><p>Datos de Spotify no disponibles</p></div>';
    }

    return `
      <div class="section">
        <h2 class="section-title">Datos Spotify</h2>
        <table>
          <tr>
            <th>Métrica</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Followers Actuales</td>
            <td><strong>${spotifyData.followers.toLocaleString()}</strong></td>
          </tr>
          <tr>
            <td>Popularidad Playlist</td>
            <td><strong>${spotifyData.popularity}/100</strong></td>
          </tr>
          <tr>
            <td>Total Tracks</td>
            <td>${spotifyData.tracks}</td>
          </tr>
          <tr>
            <td>Última Actualización</td>
            <td>${this.formatDate(spotifyData.lastUpdated)}</td>
          </tr>
        </table>
      </div>
    `;
  },

  // Sección de análisis
  generateAnalysisSection(analysis) {
    if (!analysis) return '';

    const statusClass = analysis.isOnTrack ? 'success' : 'alert';
    
    return `
      <div class="section">
        <h2 class="section-title">Análisis de Rendimiento</h2>
        
        <div class="${statusClass}">
          <strong>Cumplimiento de Compromiso:</strong> ${analysis.commitmentFulfillment}%
          ${analysis.isOnTrack ? '✓ En objetivo' : '⚠ Por debajo del objetivo'}
        </div>

        ${analysis.decision ? `
          <div class="recommendation">
            <strong>Diagnóstico:</strong> ${analysis.decision.diagnosis}<br>
            <strong>Razón:</strong> ${analysis.decision.reasoning}
          </div>
        ` : ''}

        <h3>Insights Principales</h3>
        <ul class="insight-list">
          ${analysis.insights.map(insight => `<li>${insight}</li>`).join('')}
        </ul>
      </div>
    `;
  },

  // Sección de recomendaciones
  generateRecommendationsSection(analysis) {
    if (!analysis || !analysis.recommendations || analysis.recommendations.length === 0) {
      return '';
    }

    return `
      <div class="section">
        <h2 class="section-title">Recomendaciones Estratégicas</h2>
        ${analysis.recommendations.map((rec, index) => `
          <div class="recommendation">
            <strong>${index === 0 ? 'Acción Principal' : 'Acción Secundaria'}:</strong> ${rec}
          </div>
        `).join('')}
      </div>
    `;
  },

  // Tabla de campañas
  generateCampaignsTable(campaigns) {
    if (!campaigns || campaigns.length === 0) return '';

    return `
      <div class="section">
        <h2 class="section-title">Detalle de Campañas</h2>
        <table>
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Fecha</th>
              <th>Gasto</th>
              <th>Conversiones</th>
              <th>Coste Click Meta</th>
              <th>Alcance</th>
            </tr>
          </thead>
          <tbody>
            ${campaigns.map(c => {
              const costPerClick = c.costPerResult;
              const highlightClass = costPerClick > 0.20 ? 'style="background-color: #FEE2E2; font-weight: bold;"' : '';
              return `
              <tr>
                <td>${c.campaignName}</td>
                <td>${this.formatDate(c.startDate)}</td>
                <td>€${c.amountSpent.toFixed(2)}</td>
                <td>${c.results}</td>
                <td ${highlightClass}>€${costPerClick.toFixed(2)}</td>
                <td>${c.reach.toLocaleString()}</td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // Descargar reporte Word
  downloadWordReport(artistData, period) {
    const html = this.generateIndividualReport(artistData, period);
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${artistData.artist}_${period.start}_${period.end}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Generar Excel general (CSV con formato)
  generateGeneralExcel(reportData) {
    let csv = 'Artista,Gasto Total (€),Followers Ganados,€/Follower,Campañas,Cumplimiento (%)\n';
    
    reportData.byArtist.forEach(artist => {
      const fulfillment = this.calculateCommitment(
        artist.totalResults,
        reportData.period.days
      );
      
      csv += `"${artist.artist}",${artist.totalSpent.toFixed(2)},${artist.totalResults},${artist.avgCostPerResult},${artist.totalCampaigns},${fulfillment}\n`;
    });
    
    csv += '\n\n';
    csv += 'RESUMEN GENERAL\n';
    csv += `Gasto Total,€${reportData.summary.totalSpent.toFixed(2)}\n`;
    csv += `Followers Totales,${reportData.summary.totalResults}\n`;
    csv += `CPF Promedio,€${reportData.summary.avgCPF}\n`;
    csv += `Total Campañas,${reportData.summary.totalCampaigns}\n`;
    
    csv += '\n\nINSIGHTS\n';
    reportData.insights.forEach(insight => {
      csv += `"${insight}"\n`;
    });
    
    return csv;
  },

  // Descargar Excel
  downloadExcelReport(reportData) {
    const csv = this.generateGeneralExcel(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_General_${reportData.period.start}_${reportData.period.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Calcular cumplimiento de compromiso
  calculateCommitment(followers, days) {
    const expected = (CONFIG.budget.followerCommitment / 30) * days;
    return (followers / expected * 100).toFixed(0);
  },

  // Formatear fecha
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
};
