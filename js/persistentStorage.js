// ============================================
// PERSISTENT STORAGE - Guardado Permanente
// Sistema que guarda datos en archivos .js
// ============================================

const PersistentStorage = {
  
  // Guardar snapshots en archivo descargable
  saveSnapshotsToFile(snapshots) {
    const content = `// SNAPSHOTS GUARDADOS - NO BORRAR
// Última actualización: ${new Date().toISOString()}

const SAVED_SNAPSHOTS = ${JSON.stringify(snapshots, null, 2)};

// Cargar automáticamente al iniciar
if (typeof ReportSnapshots !== 'undefined') {
  ReportSnapshots.loadFromSaved(SAVED_SNAPSHOTS);
}`;

    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'savedSnapshots.js';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('📥 Archivo "savedSnapshots.js" descargado.\n\n' +
          '⚠️ IMPORTANTE: Copia este archivo a la carpeta js/ del proyecto\n' +
          'para que los datos persistan aunque borres el cache.');
  },
  
  // Guardar datos Spotify actuales
  saveSpotifyDataToFile(spotifyData) {
    const content = `// DATOS SPOTIFY ACTUALES
// Última actualización: ${new Date().toISOString()}

const SPOTIFY_DATA_CACHE = ${JSON.stringify(spotifyData, null, 2)};`;

    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spotifyDataCache.js';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('📥 Archivo "spotifyDataCache.js" descargado.\n\n' +
          '⚠️ Guárdalo en js/ para mantener los datos de Spotify.');
  },
  
  // Auto-backup al generar report
  autoBackup() {
    console.log('💾 Creando backup automático...');
    
    // Backup snapshots
    const snapshots = localStorage.getItem('report_snapshots');
    if (snapshots) {
      const parsed = JSON.parse(snapshots);
      this.saveSnapshotsToFile(parsed);
    }
    
    // Backup Spotify data
    const spotifyData = localStorage.getItem('spotifyData');
    if (spotifyData) {
      const parsed = JSON.parse(spotifyData);
      this.saveSpotifyDataToFile(parsed);
    }
  },
  
  // Sincronizar localStorage con archivos JS
  syncToFiles() {
    // Leer snapshots de localStorage
    const snapshots = localStorage.getItem('report_snapshots');
    if (snapshots) {
      console.log('📸 Sincronizando snapshots a archivo...');
      this.saveSnapshotsToFile(JSON.parse(snapshots));
    }
    
    // Leer datos Spotify de localStorage
    const spotifyData = localStorage.getItem('spotifyData');
    if (spotifyData) {
      console.log('📊 Sincronizando datos Spotify a archivo...');
      this.saveSpotifyDataToFile(JSON.parse(spotifyData));
    }
  }
};
