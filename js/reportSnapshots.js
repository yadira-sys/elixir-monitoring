// ============================================
// REPORT SNAPSHOTS - Sistema de Seguimiento
// ============================================

const ReportSnapshots = {
  // Guardar snapshot de un report generado
  saveReportSnapshot(reportData) {
    const snapshots = this.getAllSnapshots();
    
    const snapshot = {
      id: `report_${Date.now()}`,
      startDate: reportData.startDate,
      endDate: reportData.endDate,
      generatedAt: new Date().toISOString(),
      artists: {}
    };
    
    // Guardar followers finales de cada artista
    reportData.artists.forEach(artist => {
      snapshot.artists[artist.name] = {
        followersStart: artist.followersStart,
        followersEnd: artist.followersEnd,
        increase: artist.increase,
        spent: artist.spent,
        cpf: artist.cpf
      };
    });
    
    // Añadir a lista de snapshots
    snapshots.push(snapshot);
    
    // Guardar en localStorage
    localStorage.setItem('report_snapshots', JSON.stringify(snapshots));
    
    console.log('📸 Snapshot de report guardado:', snapshot.id);
    return snapshot;
  },
  
  // Obtener todos los snapshots
  getAllSnapshots() {
    const stored = localStorage.getItem('report_snapshots');
    return stored ? JSON.parse(stored) : [];
  },
  
  // Obtener el último snapshot de un artista
  getLastArtistSnapshot(artistName) {
    const snapshots = this.getAllSnapshots();
    
    // Ordenar por fecha descendente
    snapshots.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    
    // Buscar el último snapshot que tenga datos del artista
    for (const snapshot of snapshots) {
      if (snapshot.artists[artistName]) {
        return {
          date: snapshot.endDate,
          followers: snapshot.artists[artistName].followersEnd,
          snapshot: snapshot
        };
      }
    }
    
    return null;
  },
  
  // Obtener followers inicio para un nuevo report
  getStartFollowers(artistName, defaultBaseline) {
    // Buscar en snapshots de reports anteriores
    const lastSnapshot = this.getLastArtistSnapshot(artistName);
    
    if (lastSnapshot) {
      console.log(`📊 ${artistName}: Usando followers del último report (${lastSnapshot.date}): ${lastSnapshot.followers}`);
      return {
        followers: lastSnapshot.followers,
        source: 'last_report',
        date: lastSnapshot.date
      };
    }
    
    // Fallback a baseline
    console.log(`📊 ${artistName}: Usando baseline (no hay reports previos): ${defaultBaseline}`);
    return {
      followers: defaultBaseline,
      source: 'baseline',
      date: '2024-10-31'
    };
  },
  
  // Limpiar snapshots antiguos (mantener últimos 12 meses)
  cleanOldSnapshots() {
    const snapshots = this.getAllSnapshots();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const filtered = snapshots.filter(s => {
      return new Date(s.endDate) > oneYearAgo;
    });
    
    localStorage.setItem('report_snapshots', JSON.stringify(filtered));
    console.log(`🧹 Snapshots limpiados: ${snapshots.length} → ${filtered.length}`);
  },
  
  // Obtener historial de un artista
  getArtistHistory(artistName) {
    const snapshots = this.getAllSnapshots();
    
    return snapshots
      .filter(s => s.artists[artistName])
      .map(s => ({
        date: s.endDate,
        followers: s.artists[artistName].followersEnd,
        increase: s.artists[artistName].increase,
        spent: s.artists[artistName].spent,
        cpf: s.artists[artistName].cpf
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },
  
  // Exportar todos los snapshots (para backup)
  exportSnapshots() {
    const snapshots = this.getAllSnapshots();
    const json = JSON.stringify(snapshots, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elixir_snapshots_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('💾 Snapshots exportados');
  }
};
