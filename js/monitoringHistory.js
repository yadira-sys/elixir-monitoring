// ============================================
// SISTEMA DE HISTORIAL DE MONITORINGS
// ============================================

const MonitoringHistory = {
  
  // Guardar snapshot de monitoring
  saveSnapshot(monitoringData, startDate, endDate) {
    const snapshots = this.getAllSnapshots();
    
    const snapshot = {
      id: Date.now(),
      date: new Date().toISOString(),
      period: {
        start: startDate,
        end: endDate
      },
      data: monitoringData,
      createdAt: new Date().toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
    };
    
    snapshots.push(snapshot);
    localStorage.setItem('monitoring_history', JSON.stringify(snapshots));
    
    console.log('📊 Monitoring guardado:', snapshot.createdAt);
    return snapshot;
  },
  
  // Obtener todos los snapshots
  getAllSnapshots() {
    const stored = localStorage.getItem('monitoring_history');
    return stored ? JSON.parse(stored) : [];
  },
  
  // Obtener último snapshot
  getLatestSnapshot() {
    const snapshots = this.getAllSnapshots();
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  },
  
  // Obtener snapshot por fecha
  getSnapshotByDate(startDate, endDate) {
    const snapshots = this.getAllSnapshots();
    return snapshots.find(s => 
      s.period.start === startDate && s.period.end === endDate
    );
  },
  
  // Obtener historial de un artista
  getArtistHistory(artistName) {
    const snapshots = this.getAllSnapshots();
    const history = [];
    
    snapshots.forEach(snapshot => {
      const artistData = snapshot.data.find(d => d.artist === artistName);
      if (artistData) {
        history.push({
          date: snapshot.createdAt,
          period: snapshot.period,
          ...artistData
        });
      }
    });
    
    return history;
  },
  
  // Comparar dos periodos
  compareSnapshots(snapshot1Id, snapshot2Id) {
    const snapshots = this.getAllSnapshots();
    const s1 = snapshots.find(s => s.id === snapshot1Id);
    const s2 = snapshots.find(s => s.id === snapshot2Id);
    
    if (!s1 || !s2) return null;
    
    const comparison = [];
    
    // Comparar cada artista
    s1.data.forEach(artist1 => {
      const artist2 = s2.data.find(a => a.artist === artist1.artist);
      if (artist2) {
        comparison.push({
          artist: artist1.artist,
          period1: s1.period,
          period2: s2.period,
          cpfChange: (parseFloat(artist2.costPerFollower) - parseFloat(artist1.costPerFollower)).toFixed(2),
          followersChange: parseInt(artist2.increaseFollowers) - parseInt(artist1.increaseFollowers),
          spentChange: (parseFloat(artist2.spent) - parseFloat(artist1.spent)).toFixed(2)
        });
      }
    });
    
    return comparison;
  },
  
  // Exportar historial a Excel
  exportToExcel() {
    const snapshots = this.getAllSnapshots();
    if (snapshots.length === 0) {
      alert('No hay snapshots guardados');
      return;
    }
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Historial Monitorings - ELIXIR</title>
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th { background: #EA34FA; color: white; padding: 10px; }
    td { padding: 8px; border: 1px solid #ddd; }
    tr:nth-child(even) { background: #f9f9f9; }
    h1 { color: #EA34FA; }
    .snapshot { margin-bottom: 40px; page-break-after: always; }
  </style>
</head>
<body>
  <h1>📊 HISTORIAL DE MONITORINGS - ELIXIR</h1>
  <p>Total de monitorings: ${snapshots.length}</p>
`;

    snapshots.forEach((snapshot, index) => {
      html += `
  <div class="snapshot">
    <h2>Monitoring ${index + 1} - ${snapshot.createdAt}</h2>
    <p><strong>Periodo:</strong> ${snapshot.period.start} a ${snapshot.period.end}</p>
    <table>
      <thead>
        <tr>
          <th>Artista</th>
          <th>€/Follower</th>
          <th>Increase</th>
          <th>€ Gastado</th>
          <th>Conversiones</th>
          <th>Followers Inicio</th>
          <th>Followers Final</th>
        </tr>
      </thead>
      <tbody>
`;
      
      snapshot.data.forEach(artist => {
        html += `
        <tr>
          <td>${artist.artist}</td>
          <td>€${artist.costPerFollower}</td>
          <td>${artist.increaseFollowers >= 0 ? '+' : ''}${artist.increaseFollowers}</td>
          <td>€${artist.spent}</td>
          <td>${artist.conversions}</td>
          <td>${artist.followersStart}</td>
          <td>${artist.followersEnd}</td>
        </tr>
`;
      });
      
      html += `
      </tbody>
    </table>
  </div>
`;
    });
    
    html += `
</body>
</html>
`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Historial_Monitorings_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  // Limpiar historial
  clearHistory() {
    if (confirm('¿Estás seguro de eliminar todo el historial de monitorings?')) {
      localStorage.removeItem('monitoring_history');
      console.log('🗑️ Historial eliminado');
      return true;
    }
    return false;
  }
};
