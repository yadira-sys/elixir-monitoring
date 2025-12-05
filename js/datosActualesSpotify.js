// ============================================
// DATOS ACTUALES SPOTIFY - DICIEMBRE 2025
// Introducidos manualmente para la reunión
// ============================================
// ⚠️ NOTA: Existe también spotifyDataPersistent.js con datos permanentes
// que NO se pierden al borrar cache. Este archivo es para compatibilidad.
// ============================================

const DatosActualesSpotify = {
  // Datos actuales de Spotify (02/12/2025)
  followers: {
    'The Amplified Pianist': 3637,
    'PATO PESCIO': 1394,
    'JULIEN vertigo': 21885,
    'Rainbow': 627,
    'Daniel Dee': 577,
    'Honey': 3084,
    'XGuardians': 2300,
    'MIKY Larus': 7924,
    'Amadis': 1972,
    'ESTHR': 339,
    'Esther Lam': 339, // Mismo que ESTHR
    'ALEX KISLOV': 3322, // ✅ Actualizado 04/12/2025
    'Monsai': 2510,
    'Kamadev': 10803,
    'Andrew Weiss': 922,
    'Steban': 164,
    'Mainterm': 47956
  },
  
  // Popularidad
  popularity: {
    'The Amplified Pianist': 60,
    'PATO PESCIO': 60,
    'JULIEN vertigo': 90,
    'Rainbow': 45,
    'Daniel Dee': 45,
    'Honey': 60,
    'XGuardians': 60,
    'MIKY Larus': 70,
    'Amadis': 55,
    'ESTHR': 25,
    'Esther Lam': 25, // Mismo que ESTHR
    'ALEX KISLOV': 60,
    'Monsai': 60,
    'Kamadev': 90,
    'Andrew Weiss': 45,
    'Steban': 30,
    'Mainterm': 90
  },
  
  // Obtener followers actuales de un artista
  getFollowers(artistName) {
    return this.followers[artistName] || 0;
  },
  
  // Obtener popularidad de un artista
  getPopularity(artistName) {
    return this.popularity[artistName] || 0;
  },
  
  // Verificar si hay datos para un artista
  hasData(artistName) {
    return this.followers.hasOwnProperty(artistName);
  },
  
  // Actualizar datos (llamar cuando se actualiza Spotify)
  updateData(artistName, followers, popularity) {
    this.followers[artistName] = followers;
    if (popularity !== undefined) {
      this.popularity[artistName] = popularity;
    }
    console.log(`✅ Datos actualizados para ${artistName}: ${followers} followers`);
  },
  
  // Generar código JavaScript actualizado
  generateUpdatedCode() {
    return `// ============================================
// DATOS ACTUALES SPOTIFY - ACTUALIZADO
// Última actualización: ${new Date().toISOString()}
// ============================================

const DatosActualesSpotify = {
  // Datos actuales de Spotify
  followers: ${JSON.stringify(this.followers, null, 4)},
  
  // Popularidad
  popularity: ${JSON.stringify(this.popularity, null, 4)},
  
  getFollowers(artistName) {
    return this.followers[artistName] || 0;
  },
  
  getPopularity(artistName) {
    return this.popularity[artistName] || 0;
  },
  
  hasData(artistName) {
    return this.followers.hasOwnProperty(artistName);
  }
};`;
  },
  
  // Descargar datos actualizados como archivo
  downloadUpdatedFile() {
    const content = this.generateUpdatedCode();
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datosActualesSpotify.js';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('📥 Archivo actualizado descargado!\n\n' +
          '⚠️ REEMPLAZA el archivo js/datosActualesSpotify.js con este nuevo\n' +
          'para que los datos persistan aunque borres el cache.');
  }
};
