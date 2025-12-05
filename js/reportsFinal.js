// ============================================
// GENERADOR DE REPORTES FINAL - FUNCIONANDO
// ============================================

const ReportsFinal = {
  
  // Obtener snapshot estimado del 01/12/2025
  getSnapshot_01_12_2025(artistName) {
    // Snapshots estimados al 01/12/2025
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
  
  // Generar report con TODAS las columnas
  async generateMonitoringReport(campaigns, startDate, endDate, snapshotBase = null) {
    const reportRows = [];
    
    // Determinar snapshot base a usar
    const baseDate = snapshotBase || (typeof App !== 'undefined' ? App.snapshotBaseDate : '31/10/2024');
    console.log(`📅 Usando Snapshot Base: ${baseDate}`);
    
    // DEBUG: Ver si Steban llega a esta función
    console.log(`🎯 generateMonitoringReport recibió ${campaigns.length} campañas`);
    const stebanCampaigns = campaigns.filter(c => c.campaignName && c.campaignName.toLowerCase().includes('stban'));
    if (stebanCampaigns.length > 0) {
      console.log(`🎯 Campañas Steban encontradas en generateMonitoringReport:`, stebanCampaigns.map(c => ({
        name: c.campaignName,
        artist: c.artist
      })));
    } else {
      console.warn(`⚠️ NO se encontraron campañas Steban en generateMonitoringReport`);
    }
    
    // Agrupar por artista
    const byArtist = {};
    campaigns.forEach(c => {
      if (!byArtist[c.artist]) {
        byArtist[c.artist] = [];
      }
      byArtist[c.artist].push(c);
    });
    
    // DEBUG: Ver artistas agrupados
    console.log(`📊 Artistas agrupados en byArtist:`, Object.keys(byArtist));
    if (Object.keys(byArtist).some(name => name.toLowerCase().includes('stban'))) {
      console.log(`✅ Steban encontrado en byArtist`);
    } else {
      console.warn(`❌ Steban NO encontrado en byArtist - revisar detección de artista`);
    }
    
    // Para cada artista
    for (const [artistName, artistCampaigns] of Object.entries(byArtist)) {
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
      let baselineFollowers = 0;
      
      if (baseDate === '31/10/2024') {
        // Usar baseline estándar de HistoricalData
        const baseline = HistoricalData.getArtistBaseline(realArtistName, '2024-10-31');
        if (!baseline) {
          console.log(`⚠️ No baseline para ${realArtistName} (original: ${artistName})`);
          continue;
        }
        baselineFollowers = baseline.playlistFollowers || 0;
      } else if (baseDate === '01/12/2025') {
        // Usar snapshot estimado del 01/12/2025
        baselineFollowers = this.getSnapshot_01_12_2025(realArtistName);
        if (baselineFollowers === 0) {
          console.log(`⚠️ No snapshot 01/12 para ${realArtistName}`);
          continue;
        }
      } else {
        // Snapshot manual personalizado
        const manualSnapshot = HistoricalData.manualSnapshots?.[baseDate]?.[realArtistName];
        baselineFollowers = manualSnapshot?.followers || 0;
        if (baselineFollowers === 0) {
          console.log(`⚠️ No snapshot manual (${baseDate}) para ${realArtistName}`);
          continue;
        }
      }
      
      console.log(`📊 ${realArtistName}: Baseline (${baseDate}) = ${baselineFollowers} followers`);
      
      // USAR DATOS MANUALES ACTUALES (02/12/2025)
      const artist = CONFIG.artists.find(a => a.name === realArtistName);
      let currentFollowers = baselineFollowers;
      
      if (DatosActualesSpotify.hasData(realArtistName)) {
        currentFollowers = DatosActualesSpotify.getFollowers(realArtistName);
        console.log(`✅ ${realArtistName}: Baseline ${baselineFollowers} → Actual ${currentFollowers} (+${currentFollowers - baselineFollowers})`);
      } else {
        console.log(`ℹ️ ${realArtistName}: Usando baseline (${baselineFollowers}) - No hay datos actuales`);
      }
      
      // Calcular métricas
      const totalSpent = artistCampaigns.reduce((s, c) => s + (c.amountSpent || 0), 0);
      const totalConversions = artistCampaigns.reduce((s, c) => s + (c.results || 0), 0);
      const totalReach = artistCampaigns.reduce((s, c) => s + (c.reach || 0), 0);
      const avgCostPerConv = totalConversions > 0 ? totalSpent / totalConversions : 0;
      
      // Increase followers (ACTUAL - BASELINE)
      const increaseFollowers = currentFollowers - baselineFollowers;
      const costPerFollower = increaseFollowers > 0 ? totalSpent / increaseFollowers : 0;
      
      // Acción recomendada (UMBRALES PLAYLIST: <0.50, 0.50-0.70, 0.70-0.99, >0.99)
      let action = '';
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
      
      reportRows.push({
        month: this.getMonth(startDate),
        fecha: `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
        artist: realArtistName,
        costPerFollower: costPerFollower.toFixed(2),
        increaseFollowers: increaseFollowers,
        spent: totalSpent.toFixed(2),
        conversions: totalConversions,
        reach: totalReach,
        costPerConv: avgCostPerConv.toFixed(2),
        followersStart: baselineFollowers,
        followersEnd: currentFollowers,
        oyentes: (baseDate === '31/10/2024' ? (HistoricalData.getArtistBaseline(realArtistName, '2024-10-31')?.monthlyListeners || 0) : 0),
        seguidoresPerfil: (baseDate === '31/10/2024' ? (HistoricalData.getArtistBaseline(realArtistName, '2024-10-31')?.profileFollowers || 0) : 0),
        diaInicio: this.formatDate(startDate),
        diaFin: this.formatDate(endDate),
        accion: action,
        playlistLink: artist?.playlistUrl || '',
        snapshotBase: baseDate // Añadir fecha snapshot para mostrar en reports
      });
    }
    
    // ORDENAR alfabéticamente por nombre de artista
    reportRows.sort((a, b) => a.artist.localeCompare(b.artist));
    
    // Añadir metadata del snapshot usado
    reportRows._snapshotBase = baseDate;
    
    return reportRows;
  },
  
  // Generar HTML/Excel
  generateExcelHTML(reportRows) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Monitoring Report ELIXIR</title>
  <style>
    body { 
      font-family: Calibri, Arial, sans-serif; 
      margin: 20px;
    }
    h1 { 
      color: #EA34FA; 
      border-bottom: 3px solid #EA34FA; 
      padding-bottom: 10px;
    }
    .summary {
      background: #f3e8ff;
      padding: 15px;
      margin: 20px 0;
      border-left: 4px solid #EA34FA;
      border-radius: 5px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
      font-size: 11px;
    }
    th { 
      background-color: #EA34FA; 
      color: white; 
      padding: 10px 5px; 
      text-align: left;
      font-weight: bold;
      border: 1px solid #ddd;
      font-size: 10px;
    }
    td { 
      padding: 8px 5px; 
      border: 1px solid #ddd;
    }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .excellent-cpf { background-color: #ffffff !important; font-weight: bold; }
    .good-cpf { background-color: #fef3c7 !important; font-weight: bold; }
    .warning-cpf { background-color: #fed7aa !important; font-weight: bold; }
    .critical-cpf { background-color: #fee2e2 !important; font-weight: bold; }
    .legend {
      margin-top: 30px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 5px;
    }
    .legend-item {
      display: inline-block;
      padding: 5px 10px;
      margin: 5px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>📊 MONITORING REPORT - ELIXIR</h1>
  <p><strong>Periodo:</strong> ${reportRows[0]?.diaInicio} - ${reportRows[0]?.diaFin}</p>
  
  <div class="summary">
    <h3>RESUMEN GENERAL</h3>
    <p><strong>Total Gasto:</strong> €${this.sumField(reportRows, 'spent')}</p>
    <p><strong>Total Increase Followers:</strong> +${this.sumField(reportRows, 'increaseFollowers')}</p>
    <p><strong>CPF Promedio:</strong> €${this.avgField(reportRows, 'costPerFollower')}</p>
    <p><strong>Total Artistas:</strong> ${reportRows.length}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>FECHA</th>
        <th>Artist</th>
        <th>€/follower</th>
        <th>Increase followers</th>
        <th>€ gastado</th>
        <th>Conversiones</th>
        <th>Alcance</th>
        <th>€/conv</th>
        <th>Playlist followers principio</th>
        <th>Playlist followers final</th>
        <th>Oyentes</th>
        <th>Seguidores al perfil</th>
        <th>Día principio</th>
        <th>Día final</th>
        <th>ACCION REALIZADA</th>
        <th>Playlist link</th>
      </tr>
    </thead>
    <tbody>
${reportRows.map(row => {
  const cpf = parseFloat(row.costPerFollower);
  let cssClass = 'excellent-cpf';
  if (cpf > 0.99) cssClass = 'critical-cpf';
  else if (cpf > 0.70) cssClass = 'warning-cpf';
  else if (cpf >= 0.50) cssClass = 'good-cpf';
  
  return `
      <tr>
        <td>${row.month}</td>
        <td>${row.fecha}</td>
        <td><strong>${row.artist}</strong></td>
        <td class="${cssClass}">€${row.costPerFollower}</td>
        <td>${row.increaseFollowers >= 0 ? '+' : ''}${row.increaseFollowers}</td>
        <td>€${row.spent}</td>
        <td>${row.conversions}</td>
        <td>${row.reach.toLocaleString()}</td>
        <td>€${row.costPerConv}</td>
        <td>${row.followersStart.toLocaleString()}</td>
        <td>${row.followersEnd.toLocaleString()}</td>
        <td>${row.oyentes.toLocaleString()}</td>
        <td>${row.seguidoresPerfil.toLocaleString()}</td>
        <td>${row.diaInicio}</td>
        <td>${row.diaFin}</td>
        <td>${row.accion}</td>
        <td><a href="${row.playlistLink}" target="_blank">Ver</a></td>
      </tr>`;
}).join('')}
    </tbody>
  </table>
  
  <div class="legend">
    <h3>LEYENDA</h3>
    <span class="legend-item excellent-cpf">€/Follower < €0.50 - Excelente</span>
    <span class="legend-item good-cpf">€/Follower €0.50-0.70 - Bueno</span>
    <span class="legend-item warning-cpf">€/Follower €0.70-0.99 - Revisar</span>
    <span class="legend-item critical-cpf">€/Follower > €0.99 - Crítico</span>
  </div>
  
  <footer style="margin-top: 40px; text-align: center; color: #666; border-top: 2px solid #EA34FA; padding-top: 20px;">
    <p>Report generado por ELIXIR Dashboard - ${new Date().toLocaleDateString('es-ES')}</p>
  </footer>
</body>
</html>`;
    
    return html;
  },
  
  // Descargar Excel
  downloadExcel(reportRows, startDate, endDate) {
    const html = this.generateExcelHTML(reportRows);
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monitoring_${startDate}_${endDate}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  // Helpers
  getMonth(dateStr) {
    const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const d = new Date(dateStr);
    return months[d.getMonth()];
  },
  
  formatDate(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },
  
  sumField(rows, field) {
    return rows.reduce((s, r) => s + parseFloat(r[field] || 0), 0).toFixed(2);
  },
  
  avgField(rows, field) {
    const sum = rows.reduce((s, r) => s + parseFloat(r[field] || 0), 0);
    return (sum / rows.length).toFixed(2);
  }
};
