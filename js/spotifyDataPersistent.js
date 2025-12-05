// ============================================
// SPOTIFY DATA PERSISTENTE - NO SE PIERDE AL BORRAR CACHE
// ============================================
// Este archivo contiene datos actuales de Spotify de manera permanente
// NO depende de localStorage
// Última actualización: 04/12/2025

const SpotifyDataPersistent = {
  // Datos actuales (manuales) - Diciembre 2025
  currentData: {
    'PATO PESCIO': { followers: 1394, popularity: 60 },
    'Steban': { followers: 164, popularity: 30 },
    'ESTHR': { followers: 339, popularity: 25 },
    'ALEX KISLOV': { followers: 3322, popularity: 60 }, // ✅ Actualizado 04/12/2025
    'Monsai': { followers: 2510, popularity: 60 },
    'Amadis': { followers: 1972, popularity: 55 },
    'The Amplified Pianist': { followers: 10000, popularity: 40 },
    'Kamadev': { followers: 10803, popularity: 60 },
    'MIKY Larus': { followers: 339, popularity: 70 },
    'JULIEN VERTIGO': { followers: 0, popularity: 0 },
    'WILLEN': { followers: 550, popularity: 40 },
    'Daniel Dee': { followers: 350, popularity: 30 },
    'MARK WISE': { followers: 485, popularity: 35 },
    'Fawad': { followers: 2578, popularity: 50 },
    'Guimero': { followers: 4124, popularity: 55 }
  },
  
  // Métodos de acceso
  getFollowers(artistName) {
    const data = this.currentData[artistName];
    return data ? data.followers : 0;
  },
  
  getPopularity(artistName) {
    const data = this.currentData[artistName];
    return data ? data.popularity : 0;
  },
  
  hasData(artistName) {
    return this.currentData.hasOwnProperty(artistName);
  },
  
  getAllData() {
    return this.currentData;
  },
  
  // Actualizar datos de un artista
  updateArtist(artistName, followers, popularity) {
    if (!this.currentData[artistName]) {
      this.currentData[artistName] = {};
    }
    this.currentData[artistName].followers = followers;
    this.currentData[artistName].popularity = popularity;
    
    console.log(`✅ Actualizado ${artistName}: ${followers} followers, ${popularity} popularidad`);
  },
  
  // Generar código del archivo actualizado
  generateFileContent() {
    return `// ============================================
// SPOTIFY DATA PERSISTENTE - NO SE PIERDE AL BORRAR CACHE
// ============================================
// Este archivo contiene datos actuales de Spotify de manera permanente
// NO depende de localStorage
// Última actualización: ${new Date().toISOString()}

const SpotifyDataPersistent = {
  // Datos actuales (manuales) - ${new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
  currentData: ${JSON.stringify(this.currentData, null, 4)},
  
  // Métodos de acceso
  getFollowers(artistName) {
    const data = this.currentData[artistName];
    return data ? data.followers : 0;
  },
  
  getPopularity(artistName) {
    const data = this.currentData[artistName];
    return data ? data.popularity : 0;
  },
  
  hasData(artistName) {
    return this.currentData.hasOwnProperty(artistName);
  },
  
  getAllData() {
    return this.currentData;
  },
  
  // Actualizar datos de un artista
  updateArtist(artistName, followers, popularity) {
    if (!this.currentData[artistName]) {
      this.currentData[artistName] = {};
    }
    this.currentData[artistName].followers = followers;
    this.currentData[artistName].popularity = popularity;
    
    console.log(\`✅ Actualizado \${artistName}: \${followers} followers, \${popularity} popularidad\`);
  },
  
  // Generar código del archivo actualizado
  generateFileContent() {
    // (Este método se mantiene para compatibilidad)
    return '';
  }
};
`;
  }
};
