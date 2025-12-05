// ============================================
// SNAPSHOTS PERSISTENTES - NO SE PIERDEN AL BORRAR CACHE
// ============================================
// Este archivo se regenera automáticamente cuando guardas un report
// NO EDITAR MANUALMENTE (se sobreescribe)

const SnapshotsPersistent = {
  // Último snapshot mensual guardado (1 del mes)
  lastMonthlySnapshot: {
    // Formato: '2025-01-01': { 'Artist': { followers, oyentes, seguidoresPerfil } }
    // Se actualiza automáticamente el primer día de cada mes
  },
  
  // Snapshots de reports generados
  reportSnapshots: [
    // Formato de cada snapshot:
    // {
    //   id: 'report_1701234567890',
    //   startDate: '2025-11-17',
    //   endDate: '2025-12-01',
    //   generatedAt: '2025-12-04T10:30:00Z',
    //   artists: {
    //     'Steban': {
    //       followersStart: 135,
    //       followersEnd: 164,
    //       increase: 29,
    //       spent: 13.86,
    //       cpf: 0.48
    //     }
    //   }
    // }
  ],
  
  // MÉTODOS
  getAllSnapshots() {
    return this.reportSnapshots;
  },
  
  getLastReportSnapshot() {
    if (this.reportSnapshots.length === 0) return null;
    return this.reportSnapshots[this.reportSnapshots.length - 1];
  },
  
  // Obtener followers finales del último report para un artista
  getLastFollowersForArtist(artistName) {
    const lastReport = this.getLastReportSnapshot();
    if (!lastReport || !lastReport.artists[artistName]) return null;
    return lastReport.artists[artistName].followersEnd;
  },
  
  // Añadir nuevo snapshot (se usa al generar report)
  addSnapshot(snapshot) {
    this.reportSnapshots.push(snapshot);
    // Este método DEBE ir seguido de saveToFile() para persistir
  },
  
  // Obtener último snapshot mensual
  getMonthlySnapshot(date = null) {
    if (!date) {
      const keys = Object.keys(this.lastMonthlySnapshot);
      if (keys.length === 0) return null;
      const lastKey = keys[keys.length - 1];
      return { date: lastKey, data: this.lastMonthlySnapshot[lastKey] };
    }
    return this.lastMonthlySnapshot[date] || null;
  },
  
  // Guardar snapshot mensual
  saveMonthlySnapshot(date, data) {
    this.lastMonthlySnapshot[date] = data;
    // Este método DEBE ir seguido de saveToFile() para persistir
  }
};
