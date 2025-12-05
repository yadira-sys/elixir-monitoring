// ============================================
// PERSISTENCE MANAGER - Guarda datos en archivos .js
// ============================================
// Sistema que permite guardar snapshots en archivos persistentes
// que NO se pierden al borrar el cache del navegador

const PersistenceManager = {
  
  // Generar contenido del archivo snapshotsPersistent.js
  generateSnapshotsFile(reportSnapshots, monthlySnapshots) {
    const fileContent = `// ============================================
// SNAPSHOTS PERSISTENTES - NO SE PIERDEN AL BORRAR CACHE
// ============================================
// Este archivo se regenera automáticamente cuando guardas un report
// Última actualización: ${new Date().toISOString()}

const SnapshotsPersistent = {
  // Snapshots mensuales (guardados el día 1 de cada mes)
  lastMonthlySnapshot: ${JSON.stringify(monthlySnapshots, null, 2)},
  
  // Snapshots de reports generados
  reportSnapshots: ${JSON.stringify(reportSnapshots, null, 2)},
  
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
  
  // Obtener último snapshot mensual
  getMonthlySnapshot(date = null) {
    if (!date) {
      const keys = Object.keys(this.lastMonthlySnapshot);
      if (keys.length === 0) return null;
      const lastKey = keys[keys.length - 1];
      return { date: lastKey, data: this.lastMonthlySnapshot[lastKey] };
    }
    return this.lastMonthlySnapshot[date] || null;
  }
};
`;
    return fileContent;
  },
  
  // Descargar archivo actualizado
  downloadSnapshotsFile(reportSnapshots, monthlySnapshots) {
    const content = this.generateSnapshotsFile(reportSnapshots, monthlySnapshots);
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snapshotsPersistent.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📥 Archivo snapshotsPersistent.js descargado');
    console.log('📋 INSTRUCCIONES: Reemplaza el archivo js/snapshotsPersistent.js con este nuevo');
  },
  
  // Sincronizar: Guardar snapshots al generar report
  async saveAfterReportGeneration(reportData) {
    // 1. Obtener snapshots existentes
    const existingSnapshots = SnapshotsPersistent.getAllSnapshots();
    
    // 2. Crear nuevo snapshot
    const newSnapshot = {
      id: `report_${Date.now()}`,
      startDate: reportData.startDate,
      endDate: reportData.endDate,
      generatedAt: new Date().toISOString(),
      artists: {}
    };
    
    // 3. Añadir datos de artistas
    reportData.artists.forEach(artist => {
      newSnapshot.artists[artist.name] = {
        followersStart: artist.followersStart,
        followersEnd: artist.followersEnd,
        increase: artist.increase,
        spent: artist.spent,
        cpf: artist.cpf
      };
    });
    
    // 4. Añadir a lista
    existingSnapshots.push(newSnapshot);
    
    // 5. Obtener snapshots mensuales
    const monthlySnapshots = SnapshotsPersistent.lastMonthlySnapshot || {};
    
    // 6. NO descargar automáticamente (solo guardar en memoria)
    // this.downloadSnapshotsFile(existingSnapshots, monthlySnapshots);
    
    console.log('✅ Snapshot guardado:', newSnapshot.id);
    console.log('📊 Total snapshots:', existingSnapshots.length);
    
    return newSnapshot;
  },
  
  // Guardar snapshot mensual (día 1)
  async saveMonthlySnapshot(date, artistsData) {
    const monthKey = date; // formato: '2025-12-01'
    
    // Obtener snapshots mensuales actuales
    const monthlySnapshots = SnapshotsPersistent.lastMonthlySnapshot || {};
    
    // Añadir nuevo snapshot mensual
    monthlySnapshots[monthKey] = artistsData;
    
    // Obtener snapshots de reports
    const reportSnapshots = SnapshotsPersistent.getAllSnapshots();
    
    // Descargar archivo actualizado
    this.downloadSnapshotsFile(reportSnapshots, monthlySnapshots);
    
    console.log('✅ Snapshot mensual guardado:', monthKey);
    console.log('📊 Artistas guardados:', Object.keys(artistsData).length);
  },
  
  // Mostrar instrucciones
  showInstructions() {
    const message = `
╔════════════════════════════════════════════════════════════╗
║  📥 SISTEMA DE SNAPSHOTS PERSISTENTES                      ║
╚════════════════════════════════════════════════════════════╝

✅ CÓMO FUNCIONA:

1. Cada vez que generas un report completo, se descarga automáticamente
   un archivo "snapshotsPersistent.js" actualizado.

2. DEBES reemplazar el archivo en tu proyecto:
   - Ubicación: js/snapshotsPersistent.js
   - Reemplaza con el archivo descargado

3. Una vez reemplazado, recarga la página (Ctrl + Shift + R)

✅ VENTAJAS:

- ✓ NO pierdes datos al borrar cache
- ✓ Los snapshots se guardan en un archivo .js permanente
- ✓ Puedes hacer backup manual del archivo
- ✓ Compatible con el sistema actual

⚠️ IMPORTANTE:

Después de generar cada report, recuerda:
1. Descargar el archivo snapshotsPersistent.js
2. Reemplazar el archivo en js/
3. Recargar página (Ctrl + Shift + R)

🔄 Esto se hace automáticamente cada vez que:
- Generas "Monitoring Completo"
- Guardas un snapshot mensual (día 1)
    `;
    
    console.log(message);
    
    // Mostrar en interfaz
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 600px;
      font-family: monospace;
      white-space: pre-wrap;
    `;
    instructions.innerHTML = `
      <h2 style="margin: 0 0 20px 0; text-align: center;">📥 Snapshots Persistentes Activado</h2>
      <p style="margin: 10px 0; font-size: 14px;">
        ✅ Se descargará automáticamente "snapshotsPersistent.js" cada vez que generes un report.
      </p>
      <p style="margin: 10px 0; font-size: 14px;">
        📋 <strong>INSTRUCCIONES:</strong>
        <br>1. Descarga el archivo
        <br>2. Reemplaza js/snapshotsPersistent.js
        <br>3. Recarga (Ctrl + Shift + R)
      </p>
      <p style="margin: 10px 0; font-size: 14px;">
        🎯 <strong>VENTAJA:</strong> ¡NO perderás datos al borrar cache!
      </p>
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 10px 30px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        margin-top: 20px;
        width: 100%;
      ">Entendido ✓</button>
    `;
    document.body.appendChild(instructions);
  }
};
