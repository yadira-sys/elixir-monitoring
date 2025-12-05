// ============================================
// MAIN APP - LÓGICA PRINCIPAL
// ============================================

const App = {
  data: {
    campaigns: [],
    spotifyData: [],
    enrichedData: [],
    reportData: null
  },

  // Estado global de snapshots
  snapshotBaseDate: '31/10/2024', // Default baseline

  // Inicializar aplicación
  async init() {
    console.log('Inicializando ELIXIR Dashboard...');
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Cargar datos guardados
    this.loadStoredData();
    
    // DESHABILITADO: No actualizar Spotify (429 errors)
    // await this.updateSpotifyData();
    
    // Renderizar dashboard
    this.renderDashboard();
    
    console.log('Dashboard listo!');
  },

  // Setup de event listeners
  setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Upload CSV
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput && uploadArea) {
      uploadArea.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
      
      // Drag & drop
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });
      
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          this.handleFileUpload({ target: fileInput });
        }
      });
    }

    // Botón actualizar Spotify
    const btnUpdateSpotify = document.getElementById('btnUpdateSpotify');
    if (btnUpdateSpotify) {
      btnUpdateSpotify.addEventListener('click', () => this.updateSpotifyData());
    }

    // Generar reportes
    const btnGenerateReports = document.getElementById('btnGenerateReports');
    if (btnGenerateReports) {
      btnGenerateReports.addEventListener('click', () => this.generateReports());
    }
  },

  // Cambiar tab
  switchTab(tabName) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
  },

  // Manejar carga de archivo CSV
  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    this.showLoading('Procesando CSV...');
    
    try {
      const text = await file.text();
      const rawData = DataProcessor.parseMetaAdsCSV(text);
      const transformed = DataProcessor.transformMetaAdsData(rawData);
      
      this.data.campaigns = transformed;
      
      // Guardar en localStorage
      localStorage.setItem('campaigns', JSON.stringify(transformed));
      
      // Enriquecer con datos de Spotify
      await this.enrichCampaignsWithSpotify();
      
      // Actualizar UI
      this.renderDashboard();
      
      this.hideLoading();
      
      // Mostrar confirmación detallada
      const trackboostCount = transformed.filter(c => c.artistData && c.artistData.isTrackboost).length;
      const normalCount = transformed.length - trackboostCount;
      
      this.showAlert('success', 
        `✅ CSV cargado: ${transformed.length} campañas total\n` +
        `📊 Normales: ${normalCount} | 🎯 TrackBoost: ${trackboostCount}`
      );
    } catch (error) {
      console.error('Error procesando CSV:', error);
      this.hideLoading();
      this.showAlert('danger', 'Error procesando el archivo CSV');
    }
  },

  // Actualizar datos de Spotify
  async updateSpotifyData() {
    this.showLoading('Actualizando datos de Spotify...');
    
    try {
      const spotifyData = await SpotifyAPI.updateAllData();
      this.data.spotifyData = spotifyData.playlists || spotifyData;
      
      // Guardar en localStorage
      localStorage.setItem('spotifyData', JSON.stringify(this.data.spotifyData));
      
      // ✅ PUNTO C: Actualizar DatosActualesSpotify con datos de la API
      console.log('🔄 Actualizando DatosActualesSpotify con datos de la API...');
      if (Array.isArray(this.data.spotifyData)) {
        this.data.spotifyData.forEach(playlist => {
          if (playlist.playlistName && playlist.playlistFollowers) {
            // Buscar el nombre correcto del artista en CONFIG (case-insensitive)
            const artistConfig = CONFIG.artists.find(a => 
              a.name.toLowerCase() === playlist.playlistName.toLowerCase() ||
              a.campaignKeywords.some(k => playlist.playlistName.toLowerCase().includes(k.toLowerCase()))
            );
            
            const artistName = artistConfig ? artistConfig.name : playlist.playlistName;
            
            DatosActualesSpotify.updateData(
              artistName,
              playlist.playlistFollowers,
              playlist.popularity
            );
            console.log(`✅ ${artistName}: ${playlist.playlistFollowers} followers (API: "${playlist.playlistName}")`);
          }
        });
      }
      
      // Verificar si es día 1 del mes y guardar snapshot
      const today = new Date();
      if (today.getDate() === 1) {
        const saved = await HistoricalData.checkAndSaveMonthlySnapshot();
        if (saved) {
          this.showAlert('info', '📅 Snapshot mensual guardado automáticamente');
        }
      }
      
      // Re-enriquecer campañas si existen
      if (this.data.campaigns.length > 0) {
        await this.enrichCampaignsWithSpotify();
      }
      
      this.renderDashboard();
      this.hideLoading();
      
      // Ofrecer descargar archivo actualizado
      const updateCount = Array.isArray(this.data.spotifyData) ? this.data.spotifyData.length : 0;
      this.showAlert('success', `✅ ${updateCount} artistas actualizados. Tip: Descarga el archivo para persistir los cambios.`);
      
      // Mostrar botón para descargar archivo actualizado
      console.log('💡 TIP: Para que los datos persistan después de recargar, ejecuta:');
      console.log('   DatosActualesSpotify.downloadUpdatedFile()');
      console.log('   Y reemplaza js/datosActualesSpotify.js con el archivo descargado');
    } catch (error) {
      console.error('Error actualizando Spotify:', error);
      this.hideLoading();
      this.showAlert('danger', 'Error actualizando datos de Spotify');
    }
  },

  // Enriquecer campañas con datos de Spotify
  async enrichCampaignsWithSpotify() {
    this.showLoading('Integrando datos...');
    
    try {
      this.data.enrichedData = await DataProcessor.enrichWithSpotifyData(this.data.campaigns);
      localStorage.setItem('enrichedData', JSON.stringify(this.data.enrichedData));
      this.hideLoading();
    } catch (error) {
      console.error('Error enriqueciendo datos:', error);
      this.hideLoading();
    }
  },

  // Cargar datos guardados
  loadStoredData() {
    const campaigns = localStorage.getItem('campaigns');
    const spotifyData = localStorage.getItem('spotifyData');
    const enrichedData = localStorage.getItem('enrichedData');
    
    if (campaigns) {
      this.data.campaigns = JSON.parse(campaigns);
    }
    if (spotifyData) {
      this.data.spotifyData = JSON.parse(spotifyData);
    }
    if (enrichedData) {
      this.data.enrichedData = JSON.parse(enrichedData);
    }
  },

  // Renderizar dashboard
  renderDashboard() {
    this.renderAlerts(); // 🚨 Nuevo: Alertas automáticas
    this.renderKPIs();
    this.renderCharts();
    this.renderTable();
    this.renderMonitoringTable();
    this.renderRanking(); // 🏆 Nuevo: Ranking de performance
  },
  
  // 🚨 Renderizar Alertas Automáticas
  async renderAlerts() {
    const panel = document.getElementById('alertsPanel');
    if (!panel || this.data.enrichedData.length === 0) return;
    
    try {
      const startDate = this.data.enrichedData[0].startDate;
      const endDate = this.data.enrichedData[0].endDate;
      
      // Obtener datos de monitoring
      const monitoringData = await ReportsFinal.generateMonitoringReport(
        this.data.enrichedData.filter(c => {
          if (c.artistData && c.artistData.isTrackboost) return false;
          const campaignName = c.campaignName.toLowerCase();
          if (campaignName.includes('julien') && (campaignName.includes('soundcloud') || campaignName.includes('followers'))) {
            return false;
          }
          return true;
        }),
        startDate,
        endDate,
        this.snapshotBaseDate  // 📅 Pasar snapshot base
      );
      
      // Obtener datos TrackBoost
      const trackboostCampaigns = this.data.enrichedData.filter(c => 
        c.artistData && c.artistData.isTrackboost
      );
      
      const trackboostByArtist = {};
      trackboostCampaigns.forEach(c => {
        if (!trackboostByArtist[c.artist]) {
          trackboostByArtist[c.artist] = {
            artist: c.artist,
            totalGasto: 0,
            totalConversiones: 0
          };
        }
        trackboostByArtist[c.artist].totalGasto += c.amountSpent;
        trackboostByArtist[c.artist].totalConversiones += c.results;
      });
      
      const trackboostData = Object.values(trackboostByArtist).map(tb => {
        const trackConfig = HistoricalData.getTrackboostTrack(tb.artist);
        const artistConfig = CONFIG.artists.find(a => a.name === tb.artist);
        const budgetTotal = artistConfig?.budgetTotal || 500;
        const budgetPercentage = (tb.totalGasto / budgetTotal) * 100;
        
        const currentSaves = trackConfig?.currentSaves || 0;
        const lastSaves = trackConfig?.lastSaves || 0;
        const savesGanados = currentSaves - lastSaves;
        const costeSave = savesGanados > 0 ? (tb.totalGasto / savesGanados) : 0;
        
        return {
          artist: tb.artist,
          costeSave: costeSave,
          budgetPercentage: budgetPercentage,
          budgetTotal: budgetTotal,
          budgetUsed: tb.totalGasto,
          savesGanados: savesGanados
        };
      });
      
      // Generar alertas
      const alerts = {
        critical: [],
        warning: [],
        success: [],
        info: []
      };
      
      // ALERTAS MONITORING (Playlists)
      monitoringData.forEach(artist => {
        const cpf = parseFloat(artist.costPerFollower);
        const followers = parseInt(artist.increaseFollowers);
        
        // 🔴 CRÍTICAS - CPF alto
        if (cpf >= 0.99) {
          alerts.critical.push({
            type: 'playlist',
            artist: artist.artist,
            icon: '🔴',
            title: 'CPF CRÍTICO',
            message: `${artist.artist}: CPF €${cpf.toFixed(2)} - Revisar estrategia urgente`,
            action: 'Pausar campaña y revisar targeting/creativos'
          });
        }
        
        // ⚠️ ATENCIÓN - CPF medio-alto
        else if (cpf >= 0.70 && cpf < 0.99) {
          alerts.warning.push({
            type: 'playlist',
            artist: artist.artist,
            icon: '⚠️',
            title: 'CPF ELEVADO',
            message: `${artist.artist}: CPF €${cpf.toFixed(2)} - Necesita optimización`,
            action: 'Revisar targeting y cambiar creativos'
          });
        }
        
        // ✅ OPORTUNIDADES - CPF excelente
        else if (cpf < 0.50 && followers >= 30) {
          alerts.success.push({
            type: 'playlist',
            artist: artist.artist,
            icon: '✅',
            title: 'EXCELENTE PERFORMANCE',
            message: `${artist.artist}: CPF €${cpf.toFixed(2)} (+${followers} followers)`,
            action: 'Mantener estrategia actual'
          });
        }
        
        // 💡 RECOMENDACIONES - Volumen bajo
        if (followers < 30 && cpf < 0.70) {
          alerts.info.push({
            type: 'playlist',
            artist: artist.artist,
            icon: '💡',
            title: 'VOLUMEN BAJO',
            message: `${artist.artist}: Solo +${followers} followers`,
            action: 'Cambiar cover playlist para aumentar atracción'
          });
        }
      });
      
      // ALERTAS TRACKBOOST
      trackboostData.forEach(tb => {
        // 🔴 CRÍTICAS - Presupuesto sobrepasado
        if (tb.budgetPercentage >= 100) {
          alerts.critical.push({
            type: 'trackboost',
            artist: tb.artist,
            icon: '🔴',
            title: 'PRESUPUESTO SOBREPASADO',
            message: `${tb.artist}: ${tb.budgetPercentage.toFixed(0)}% usado (€${tb.budgetUsed.toFixed(2)}/€${tb.budgetTotal})`,
            action: 'Pausar campaña inmediatamente'
          });
        }
        
        // ⚠️ ATENCIÓN - Presupuesto casi agotado
        else if (tb.budgetPercentage >= 80) {
          alerts.warning.push({
            type: 'trackboost',
            artist: tb.artist,
            icon: '⚠️',
            title: 'PRESUPUESTO CASI AGOTADO',
            message: `${tb.artist}: ${tb.budgetPercentage.toFixed(0)}% usado (quedan €${(tb.budgetTotal - tb.budgetUsed).toFixed(2)})`,
            action: 'Monitorear de cerca los próximos días'
          });
        }
        
        // ⚠️ ATENCIÓN - Coste/Save alto
        if (tb.costeSave > 0.90 && tb.savesGanados > 0) {
          alerts.warning.push({
            type: 'trackboost',
            artist: tb.artist,
            icon: '⚠️',
            title: 'COSTE/SAVE ALTO',
            message: `${tb.artist}: €${tb.costeSave.toFixed(2)}/save (+${tb.savesGanados} saves)`,
            action: 'Optimizar targeting y creativos'
          });
        }
        
        // ✅ OPORTUNIDADES - Coste/Save excelente
        else if (tb.costeSave <= 0.50 && tb.savesGanados > 20) {
          alerts.success.push({
            type: 'trackboost',
            artist: tb.artist,
            icon: '✅',
            title: 'EXCELENTE COSTE/SAVE',
            message: `${tb.artist}: €${tb.costeSave.toFixed(2)}/save (+${tb.savesGanados} saves)`,
            action: 'Mantener estrategia actual'
          });
        }
      });
      
      // Contar alertas
      const totalCritical = alerts.critical.length;
      const totalWarning = alerts.warning.length;
      const totalSuccess = alerts.success.length;
      const totalInfo = alerts.info.length;
      const totalAlerts = totalCritical + totalWarning + totalSuccess + totalInfo;
      
      if (totalAlerts === 0) {
        panel.innerHTML = '';
        return;
      }
      
      // Generar HTML
      let html = `
        <div class="card" style="border: 2px solid ${totalCritical > 0 ? '#ef4444' : totalWarning > 0 ? '#f59e0b' : '#10b981'};">
          <div class="card-header" style="background: ${totalCritical > 0 ? 'rgba(239, 68, 68, 0.1)' : totalWarning > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'};">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h3 class="card-title">🚨 Alertas Activas (${totalAlerts})</h3>
              <div style="display: flex; gap: 1rem; font-size: 0.9rem;">
                ${totalCritical > 0 ? `<span style="color: #ef4444;">🔴 ${totalCritical} Crítica${totalCritical > 1 ? 's' : ''}</span>` : ''}
                ${totalWarning > 0 ? `<span style="color: #f59e0b;">⚠️ ${totalWarning} Atención</span>` : ''}
                ${totalSuccess > 0 ? `<span style="color: #10b981;">✅ ${totalSuccess} Oportunidad${totalSuccess > 1 ? 'es' : ''}</span>` : ''}
                ${totalInfo > 0 ? `<span style="color: #3b82f6;">💡 ${totalInfo} Recomendación${totalInfo > 1 ? 'es' : ''}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="padding: 1.5rem;">
      `;
      
      // Mostrar alertas por prioridad
      const allAlerts = [
        ...alerts.critical,
        ...alerts.warning,
        ...alerts.success,
        ...alerts.info
      ];
      
      html += '<div style="display: grid; gap: 0.75rem;">';
      
      allAlerts.forEach(alert => {
        const bgColor = alert.icon === '🔴' ? 'rgba(239, 68, 68, 0.1)' :
                        alert.icon === '⚠️' ? 'rgba(245, 158, 11, 0.1)' :
                        alert.icon === '✅' ? 'rgba(16, 185, 129, 0.1)' :
                        'rgba(59, 130, 246, 0.1)';
        
        const borderColor = alert.icon === '🔴' ? '#ef4444' :
                           alert.icon === '⚠️' ? '#f59e0b' :
                           alert.icon === '✅' ? '#10b981' :
                           '#3b82f6';
        
        const badge = alert.type === 'trackboost' ? 
          '<span style="background: #f59e0b; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">TRACKBOOST</span>' :
          '<span style="background: #8b5cf6; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">PLAYLIST</span>';
        
        html += `
          <div style="background: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 1rem; border-radius: 8px;">
            <div style="display: flex; align-items: start; gap: 1rem;">
              <span style="font-size: 1.5rem;">${alert.icon}</span>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                  <strong style="color: ${borderColor}; font-size: 0.9rem;">${alert.title}</strong>
                  ${badge}
                </div>
                <div style="color: var(--text-color); margin-bottom: 0.5rem;">${alert.message}</div>
                <div style="color: var(--gray-400); font-size: 0.85rem;">
                  <strong>Acción:</strong> ${alert.action}
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      html += '</div></div></div>';
      
      panel.innerHTML = html;
      
    } catch (error) {
      console.error('Error renderizando alertas:', error);
      panel.innerHTML = '';
    }
  },
  
  // Renderizar tabla de monitoring completa
  async renderMonitoringTable() {
    const tbody = document.getElementById('monitoringTableBody');
    if (!tbody || this.data.enrichedData.length === 0) return;
    
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Generando datos de Spotify...</td></tr>';
    
    try {
      // Obtener datos completos de monitoring
      const startDate = this.data.enrichedData[0].startDate;
      const endDate = this.data.enrichedData[0].endDate;
      
      const monitoringData = await ReportsFinal.generateMonitoringReport(
        this.data.enrichedData.filter(c => {
          // Excluir campañas TrackBoost
          if (c.artistData && c.artistData.isTrackboost) return false;
          
          // Excluir campañas Julien Soundcloud y Followers (no contar en reports ni cálculos)
          const campaignName = c.campaignName.toLowerCase();
          if (campaignName.includes('julien') && (campaignName.includes('soundcloud') || campaignName.includes('followers'))) {
            console.log(`⏭️ Excluyendo de reports: ${c.campaignName}`);
            return false;
          }
          
          return true;
        }),
        startDate,
        endDate
      );
      
      tbody.innerHTML = monitoringData.map(row => {
        const cpf = parseFloat(row.costPerFollower);
        let cssClass = 'excellent-cpf';
        if (cpf > 0.99) cssClass = 'critical-cpf';
        else if (cpf > 0.70) cssClass = 'warning-cpf';
        else if (cpf >= 0.50) cssClass = 'good-cpf';
        
        return `
          <tr>
            <td><strong>${row.artist}</strong></td>
            <td class="${cssClass}">€${row.costPerFollower}</td>
            <td style="color: ${row.increaseFollowers > 0 ? 'var(--success)' : 'var(--danger)'};">
              ${row.increaseFollowers >= 0 ? '+' : ''}${row.increaseFollowers}
            </td>
            <td>€${row.spent}</td>
            <td>${row.conversions}</td>
            <td>${row.reach.toLocaleString()}</td>
            <td>${row.followersStart.toLocaleString()}</td>
            <td>${row.followersEnd.toLocaleString()}</td>
            <td style="font-size: 0.85rem;">${row.accion}</td>
          </tr>
        `;
      }).join('');
      
    } catch (error) {
      console.error('Error renderizando monitoring:', error);
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--danger);">Error obteniendo datos</td></tr>';
    }
  },

  // 🏆 Renderizar Ranking de Performance
  async renderRanking() {
    const container = document.getElementById('rankingContainer');
    if (!container || this.data.enrichedData.length === 0) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--gray-300);">Generando ranking...</div>';
    
    try {
      const startDate = this.data.enrichedData[0].startDate;
      const endDate = this.data.enrichedData[0].endDate;
      
      // Obtener datos de monitoring para ranking
      const monitoringData = await ReportsFinal.generateMonitoringReport(
        this.data.enrichedData.filter(c => {
          if (c.artistData && c.artistData.isTrackboost) return false;
          const campaignName = c.campaignName.toLowerCase();
          if (campaignName.includes('julien') && (campaignName.includes('soundcloud') || campaignName.includes('followers'))) {
            return false;
          }
          return true;
        }),
        startDate,
        endDate,
        this.snapshotBaseDate  // 📅 Pasar snapshot base
      );
      
      // Ordenar por CPF (mejor primero)
      const rankedArtists = monitoringData.sort((a, b) => 
        parseFloat(a.costPerFollower) - parseFloat(b.costPerFollower)
      );
      
      // Obtener datos de TrackBoost
      const trackboostCampaigns = this.data.enrichedData.filter(c => 
        c.artistData && c.artistData.isTrackboost
      );
      
      const trackboostByArtist = {};
      trackboostCampaigns.forEach(c => {
        if (!trackboostByArtist[c.artist]) {
          trackboostByArtist[c.artist] = {
            artist: c.artist,
            totalGasto: 0,
            totalConversiones: 0
          };
        }
        trackboostByArtist[c.artist].totalGasto += c.amountSpent;
        trackboostByArtist[c.artist].totalConversiones += c.results;
      });
      
      const trackboostData = Object.values(trackboostByArtist).map(tb => {
        const trackConfig = HistoricalData.getTrackboostTrack(tb.artist);
        const artistConfig = CONFIG.artists.find(a => a.name === tb.artist);
        const budgetTotal = artistConfig?.budgetTotal || 500;
        const budgetPercentage = (tb.totalGasto / budgetTotal) * 100;
        
        const currentSaves = trackConfig?.currentSaves || 0;
        const lastSaves = trackConfig?.lastSaves || 0;
        const savesGanados = currentSaves - lastSaves;
        const costeSave = savesGanados > 0 ? (tb.totalGasto / savesGanados) : 0;
        
        return {
          artist: tb.artist,
          costeSave: costeSave,
          budgetPercentage: budgetPercentage,
          gasto: tb.totalGasto
        };
      });
      
      // Generar HTML
      let html = '<div style="display: grid; gap: 1rem;">';
      
      // Sección Monitoring
      html += `
        <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 1.5rem;">
          <h4 style="color: #8b5cf6; margin-bottom: 1rem; font-size: 1.1rem;">📊 Campañas Playlist</h4>
          <div style="display: grid; gap: 0.75rem;">
      `;
      
      rankedArtists.forEach((artist, index) => {
        const cpf = parseFloat(artist.costPerFollower);
        let stars = '';
        let badgeColor = '';
        let badgeText = '';
        let recommendation = '';
        
        // Umbrales correctos de Monitoring
        if (cpf < 0.50) {
          stars = '⭐⭐⭐⭐⭐';
          badgeColor = '#10b981';
          badgeText = 'EXCELENTE';
          recommendation = artist.increaseFollowers >= 50 ? 'Mantener estrategia actual' : 'Cambiar cover playlist';
        } else if (cpf < 0.70) {
          stars = '⭐⭐⭐⭐';
          badgeColor = '#3b82f6';
          badgeText = 'BUENO';
          recommendation = 'Optimizar cover';
        } else if (cpf < 0.99) {
          stars = '⭐⭐⭐';
          badgeColor = '#f59e0b';
          badgeText = 'REVISAR';
          recommendation = 'Revisar targeting';
        } else {
          stars = '⭐';
          badgeColor = '#ef4444';
          badgeText = 'CRÍTICO';
          recommendation = 'Revisar estrategia urgente';
        }
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        html += `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; padding: 1rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">${medal}</span>
                <strong style="font-size: 1.1rem;">${artist.artist}</strong>
                <span style="background: ${badgeColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">${badgeText}</span>
              </div>
              <span style="font-size: 1.25rem;">${stars}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--gray-300);">
              <div><strong style="color: ${badgeColor};">CPF:</strong> €${artist.costPerFollower}</div>
              <div><strong>Followers:</strong> ${artist.increaseFollowers >= 0 ? '+' : ''}${artist.increaseFollowers}</div>
              <div><strong>Gasto:</strong> €${artist.spent}</div>
            </div>
            <div style="color: var(--gray-400); font-size: 0.85rem;">💡 ${recommendation}</div>
          </div>
        `;
      });
      
      html += '</div></div>';
      
      // Sección TrackBoost
      if (trackboostData.length > 0) {
        html += `
          <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 1.5rem;">
            <h4 style="color: #f59e0b; margin-bottom: 1rem; font-size: 1.1rem;">🎯 TrackBoost Performance</h4>
            <div style="display: grid; gap: 0.75rem;">
        `;
        
        trackboostData.forEach(tb => {
          let badgeColor = '';
          let badgeText = '';
          let statusIcon = '';
          
          // Umbrales TrackBoost
          if (tb.costeSave <= 0.50) {
            badgeColor = '#10b981';
            badgeText = 'EXCELENTE';
            statusIcon = '✅';
          } else if (tb.costeSave <= 0.90) {
            badgeColor = '#3b82f6';
            badgeText = 'ACEPTABLE';
            statusIcon = '👍';
          } else {
            badgeColor = '#f59e0b';
            badgeText = 'OPTIMIZAR';
            statusIcon = '⚠️';
          }
          
          let budgetIcon = '';
          if (tb.budgetPercentage >= 100) budgetIcon = '🔴';
          else if (tb.budgetPercentage >= 80) budgetIcon = '⚠️';
          else if (tb.budgetPercentage >= 60) budgetIcon = '👍';
          else budgetIcon = '✅';
          
          html += `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 1rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="font-size: 1.25rem;">🎵</span>
                  <strong style="font-size: 1.1rem;">${tb.artist}</strong>
                  <span style="background: ${badgeColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">${badgeText}</span>
                </div>
                <span style="font-size: 1.25rem;">${statusIcon}</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 0.9rem; color: var(--gray-300);">
                <div><strong style="color: ${badgeColor};">Coste/Save:</strong> €${tb.costeSave.toFixed(2)}</div>
                <div><strong>Presupuesto:</strong> ${budgetIcon} ${tb.budgetPercentage.toFixed(0)}%</div>
                <div><strong>Gasto:</strong> €${tb.gasto.toFixed(2)}</div>
              </div>
            </div>
          `;
        });
        
        html += '</div></div>';
      }
      
      html += '</div>';
      
      container.innerHTML = html;
      
    } catch (error) {
      console.error('Error renderizando ranking:', error);
      container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--danger);">Error generando ranking</div>';
    }
  },

  // Renderizar KPIs
  renderKPIs() {
    if (this.data.enrichedData.length === 0) return;
    
    // Separar TrackBoost de campañas normales
    const trackboostCampaigns = this.data.enrichedData.filter(c => 
      c.artistData && c.artistData.isTrackboost
    );
    const normalCampaigns = this.data.enrichedData.filter(c => 
      !c.artistData || !c.artistData.isTrackboost
    );
    
    // KPIs generales
    const totalSpent = normalCampaigns.reduce((sum, c) => sum + c.amountSpent, 0);
    const totalFollowers = normalCampaigns.reduce((sum, c) => sum + c.results, 0);
    const avgCPF = totalFollowers > 0 ? totalSpent / totalFollowers : 0;
    const totalReach = normalCampaigns.reduce((sum, c) => sum + c.reach, 0);
    
    document.getElementById('kpiSpent').textContent = `€${totalSpent.toFixed(2)}`;
    document.getElementById('kpiFollowers').textContent = `+${totalFollowers}`;
    document.getElementById('kpiCPF').textContent = `€${avgCPF.toFixed(2)}`;
    document.getElementById('kpiReach').textContent = totalReach.toLocaleString();
    
    // KPIs TrackBoost
    if (trackboostCampaigns.length > 0) {
      const tbSpent = trackboostCampaigns.reduce((sum, c) => sum + c.amountSpent, 0);
      const tbResults = trackboostCampaigns.reduce((sum, c) => sum + c.results, 0);
      const tbCPF = tbResults > 0 ? tbSpent / tbResults : 0;
      
      document.getElementById('kpiTrackboostSpent').textContent = `€${tbSpent.toFixed(2)}`;
      document.getElementById('kpiTrackboostResults').textContent = tbResults;
      document.getElementById('kpiTrackboostCPF').textContent = `€${tbCPF.toFixed(2)}`;
      
      // Renderizar tabla TrackBoost
      this.renderTrackboostTable(trackboostCampaigns);
    }
  },
  
  // Cambiar snapshot base para Monitoring
  changeSnapshotBase() {
    const selector = document.getElementById('snapshotBaseSelector');
    const indicator = document.getElementById('snapshotBaseIndicator');
    const value = selector.value;
    
    if (value === 'manual') {
      // Mostrar modal para crear snapshot manual
      this.showCreateSnapshotModal();
      return;
    }
    
    this.snapshotBaseDate = value;
    
    // Actualizar indicador visual
    const dateLabels = {
      '31/10/2024': '31 Octubre 2024 (baseline)',
      '01/12/2025': '01 Diciembre 2025 (estimado)'
    };
    indicator.textContent = `📌 Usando: ${dateLabels[value]}`;
    
    console.log(`📅 Snapshot base cambiado a: ${value}`);
    
    // Re-renderizar Monitoring con nuevo snapshot
    this.renderMonitoringTable();
    
    alert(`✅ Ahora se está usando el snapshot de: ${dateLabels[value]}\n\n` +
          `El Monitoring se calculará desde esta fecha.`);
  },
  
  // Mostrar modal para crear snapshot manual
  showCreateSnapshotModal() {
    const date = prompt('📅 Crear snapshot retroactivo\n\n' +
                        'Introduce la fecha (formato: DD/MM/YYYY)\n' +
                        'Ejemplo: 01/12/2025');
    
    if (!date || !date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      alert('❌ Fecha no válida. Usa formato DD/MM/YYYY');
      // Restaurar selector al valor actual
      document.getElementById('snapshotBaseSelector').value = this.snapshotBaseDate;
      return;
    }
    
    // Confirmar creación
    const confirm = window.confirm(
      `📅 Crear snapshot retroactivo para: ${date}\n\n` +
      `Se usarán los followers actuales de cada artista como base.\n\n` +
      `¿Continuar?`
    );
    
    if (!confirm) {
      document.getElementById('snapshotBaseSelector').value = this.snapshotBaseDate;
      return;
    }
    
    // Crear snapshot retroactivo
    this.createRetroactiveSnapshot(date);
  },
  
  // Crear snapshot retroactivo con fecha personalizada
  createRetroactiveSnapshot(date) {
    const snapshotData = {};
    
    // Obtener followers actuales de cada artista
    CONFIG.artists.forEach(artist => {
      const followers = DatosActualesSpotify.getFollowers(artist.name);
      if (followers > 0) {
        snapshotData[artist.name] = {
          followers: followers,
          date: date
        };
      }
    });
    
    console.log(`📸 Snapshot retroactivo creado para ${date}:`, snapshotData);
    
    // Agregar al selector
    const selector = document.getElementById('snapshotBaseSelector');
    const option = document.createElement('option');
    option.value = date;
    option.textContent = `${date} (manual)`;
    selector.insertBefore(option, selector.querySelector('option[value="manual"]'));
    
    // Seleccionar y aplicar
    selector.value = date;
    this.snapshotBaseDate = date;
    
    // Guardar en HistoricalData
    HistoricalData.manualSnapshots = HistoricalData.manualSnapshots || {};
    HistoricalData.manualSnapshots[date] = snapshotData;
    
    // Actualizar indicador
    document.getElementById('snapshotBaseIndicator').textContent = `📌 Usando: ${date} (manual)`;
    
    // Re-renderizar
    this.renderMonitoringTable();
    
    alert(`✅ Snapshot creado exitosamente!\n\n` +
          `Fecha: ${date}\n` +
          `Artistas: ${Object.keys(snapshotData).length}\n\n` +
          `El Monitoring ahora usa esta fecha como base.`);
  },
  
  // Renderizar tabla TrackBoost
  renderTrackboostTable(campaigns) {
    const tbody = document.getElementById('trackboostTableBody');
    if (!tbody || campaigns.length === 0) return;
    
    // Agrupar por artista para sumar gastos
    const byArtist = {};
    campaigns.forEach(c => {
      const artistName = c.artist;
      if (!byArtist[artistName]) {
        byArtist[artistName] = {
          artist: artistName,
          artistData: c.artistData,
          campaigns: [],
          totalSpent: 0,
          totalResults: 0,
          totalReach: 0
        };
      }
      byArtist[artistName].campaigns.push(c);
      byArtist[artistName].totalSpent += c.amountSpent || 0;
      byArtist[artistName].totalResults += c.results || 0;
      byArtist[artistName].totalReach += c.reach || 0;
    });
    
    tbody.innerHTML = Object.values(byArtist).map(group => {
      const cpf = group.totalResults > 0 ? group.totalSpent / group.totalResults : 0;
      const budgetTotal = group.artistData?.budgetTotal || 500;
      const budgetType = group.artistData?.budgetType || 'normal';
      const remaining = budgetTotal - group.totalSpent;
      const percentUsed = (group.totalSpent / budgetTotal * 100).toFixed(1);
      
      // Color según porcentaje usado
      let budgetColor = '#10B981'; // Verde
      if (percentUsed > 80) budgetColor = '#EF4444'; // Rojo
      else if (percentUsed > 60) budgetColor = '#F59E0B'; // Amarillo
      
      const budgetHTML = `
        <div style="position: relative; width: 100%;">
          <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 4px;">
            ${budgetType === 'lite' ? 'Lite' : 'Normal'} (€${budgetTotal})
          </div>
          <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
            <div style="background: ${budgetColor}; height: 100%; width: ${percentUsed}%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7rem; font-weight: 600;">
              ${percentUsed}%
            </div>
          </div>
          <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">
            Restante: €${remaining.toFixed(2)}
          </div>
        </div>
      `;
      
      // Mostrar lista de campañas
      const campaignsList = group.campaigns.map(c => c.campaignName).join('<br>');
      
      return `
        <tr>
          <td>${group.artist}</td>
          <td style="font-size: 0.75rem;">${campaignsList}</td>
          <td>€${group.totalSpent.toFixed(2)}</td>
          <td>${group.totalResults}</td>
          <td style="color: ${cpf <= 0.50 ? '#10B981' : cpf <= 0.90 ? '#F59E0B' : '#EF4444'}; font-weight: 600;">€${cpf.toFixed(2)}</td>
          <td>${group.totalReach.toLocaleString()}</td>
          <td>${budgetHTML}</td>
        </tr>
      `;
    }).join('');
  },

  // Renderizar gráficos
  renderCharts() {
    if (this.data.enrichedData.length === 0) return;
    
    // Filtrar solo campañas normales (sin TrackBoost)
    const normalCampaigns = this.data.enrichedData.filter(c => 
      !c.artistData || !c.artistData.isTrackboost
    );
    
    if (normalCampaigns.length === 0) return;
    
    const aggregated = DataProcessor.aggregateByArtist(normalCampaigns);
    
    // Gráfico CPF por artista
    const cpfData = aggregated.map(a => ({
      artist: a.artist,
      cpf: parseFloat(a.avgCostPerResult)
    }));
    ChartManager.createCPFComparisonChart('chartCPF', cpfData);
    
    // Gráfico distribución presupuesto
    const budgetData = aggregated.map(a => ({
      artist: a.artist,
      spent: a.totalSpent
    }));
    ChartManager.createBudgetDistributionChart('chartBudget', budgetData);
    
    // Gráfico gasto vs followers
    const scatterData = aggregated.map(a => ({
      artist: a.artist,
      spent: a.totalSpent,
      followers: a.totalResults
    }));
    ChartManager.createSpentVsFollowersChart('chartScatter', scatterData);
    
    // Gráfico cumplimiento
    const commitmentData = aggregated.map(a => {
      const days = 30; // Default, ajustar según periodo
      const expected = (CONFIG.budget.followerCommitment / 30) * days;
      const fulfillment = (a.totalResults / expected * 100);
      return {
        artist: a.artist,
        fulfillment: Math.min(fulfillment, 120)
      };
    });
    ChartManager.createCommitmentChart('chartCommitment', commitmentData);
  },

  // Renderizar tabla
  renderTable() {
    const tbody = document.getElementById('dataTableBody');
    if (!tbody || this.data.enrichedData.length === 0) return;
    
    // Filtrar campañas normales (sin TrackBoost)
    const normalCampaigns = this.data.enrichedData.filter(c => 
      !c.artistData || !c.artistData.isTrackboost
    );
    
    if (normalCampaigns.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--gray-300);">
            No hay campañas normales. Solo TrackBoost activas.
          </td>
        </tr>
      `;
      return;
    }
    
    // ✅ ORDENAR ALFABÉTICAMENTE POR ARTISTA
    normalCampaigns.sort((a, b) => a.artist.localeCompare(b.artist));
    
    tbody.innerHTML = normalCampaigns.map(campaign => {
      const performanceClass = campaign.analysis?.performanceClass || '';
      const cpf = campaign.costPerResult.toFixed(2);
      
      return `
        <tr>
          <td>${campaign.artist}</td>
          <td style="font-size: 0.85rem;">${campaign.campaignName}</td>
          <td>€${campaign.amountSpent.toFixed(2)}</td>
          <td>${campaign.results}</td>
          <td class="${performanceClass}">€${cpf}</td>
          <td>${campaign.reach.toLocaleString()}</td>
          <td>${campaign.spotifyData?.followers.toLocaleString() || 'N/A'}</td>
          <td>${campaign.spotifyData?.popularity || 'N/A'}</td>
        </tr>
      `;
    }).join('');
  },

  // Generar report general
  async generateGeneralReport() {
    if (this.data.enrichedData.length === 0) {
      this.showAlert('warning', 'No hay datos para generar reportes');
      return;
    }
    
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
      this.showAlert('warning', 'Selecciona rango de fechas');
      return;
    }
    
    this.showLoading('Generando report con datos de Spotify...');
    
    try {
      // Filtrar campañas normales (sin TrackBoost y sin Julien Soundcloud/Followers)
      const filtered = this.data.enrichedData.filter(c => {
        if (c.startDate < startDate || c.endDate > endDate) return false;
        if (c.artistData && c.artistData.isTrackboost) return false;
        
        // Excluir Julien Soundcloud y Followers
        const campaignName = c.campaignName.toLowerCase();
        if (campaignName.includes('julien') && (campaignName.includes('soundcloud') || campaignName.includes('followers'))) {
          return false;
        }
        
        return true;
      });
      
      if (filtered.length === 0) {
        this.hideLoading();
        this.showAlert('warning', 'No hay campañas en el rango seleccionado');
        return;
      }
      
      // Generar report con TODAS las columnas
      const reportRows = await ReportsFinal.generateMonitoringReport(
        filtered,
        startDate,
        endDate,
        this.snapshotBaseDate  // 📅 Pasar snapshot base
      );
      
      if (reportRows.length === 0) {
        this.hideLoading();
        this.showAlert('warning', 'No se pudieron generar datos del report');
        return;
      }
      
      // Obtener datos TrackBoost para histórico
      const trackboostCampaigns = this.data.enrichedData.filter(c => 
        c.startDate >= startDate && c.endDate <= endDate &&
        c.artistData && c.artistData.isTrackboost
      );
      
      const trackboostHistorico = [];
      if (trackboostCampaigns.length > 0) {
        // Agrupar por artista
        const byArtist = {};
        trackboostCampaigns.forEach(c => {
          if (!byArtist[c.artist]) {
            byArtist[c.artist] = { totalGasto: 0, totalConversiones: 0 };
          }
          byArtist[c.artist].totalGasto += c.amountSpent;
          byArtist[c.artist].totalConversiones += c.results;
        });
        
        // Calcular Coste/Save por artista
        Object.keys(byArtist).forEach(artistName => {
          const trackConfig = HistoricalData.getTrackboostTrack(artistName);
          const artistConfig = CONFIG.artists.find(a => a.name === artistName);
          const currentSaves = trackConfig?.currentSaves || 0;
          const lastSaves = trackConfig?.lastSaves || 0;
          const savesGanados = currentSaves - lastSaves;
          const costeSave = savesGanados > 0 ? (byArtist[artistName].totalGasto / savesGanados) : 0;
          const budgetTotal = artistConfig?.budgetTotal || 500;
          const budgetPercentage = (byArtist[artistName].totalGasto / budgetTotal) * 100;
          
          trackboostHistorico.push({
            artist: artistName,
            costeSave: costeSave,
            saves: currentSaves,
            savesGanados: savesGanados,
            gasto: byArtist[artistName].totalGasto,
            budgetPercentage: budgetPercentage
          });
        });
      }
      
      // Guardar en histórico (con TrackBoost)
      this.saveToHistorico(reportRows, startDate, endDate, trackboostHistorico);
      
      // Descargar Excel HTML
      ReportsFinal.downloadExcel(reportRows, startDate, endDate);
      
      this.hideLoading();
      this.showAlert('success', `✅ Report descargado con ${reportRows.length} artistas\n📈 Histórico actualizado`);
      
    } catch (error) {
      console.error('Error generando report:', error);
      this.hideLoading();
      this.showAlert('danger', 'Error: ' + error.message);
    }
  },

  // Generar report individual
  async generateArtistReport() {
    const artistName = document.getElementById('artistSelector').value;
    if (!artistName) {
      this.showAlert('warning', 'Selecciona un artista');
      return;
    }
    
    const startDate = document.getElementById('artistReportStartDate').value;
    const endDate = document.getElementById('artistReportEndDate').value;
    
    this.showLoading(`Generando report para ${artistName}...`);
    
    try {
      // Filtrar campañas del artista
      const campaigns = this.data.enrichedData.filter(c => c.artist === artistName);
      
      if (campaigns.length === 0) {
        this.hideLoading();
        this.showAlert('warning', `No hay campañas para ${artistName} en el periodo`);
        return;
      }
      
      // Obtener baseline
      const baseline = HistoricalData.getArtistBaseline(artistName);
      if (!baseline) {
        this.hideLoading();
        this.showAlert('warning', `No hay datos históricos para ${artistName}`);
        return;
      }
      
      // Obtener datos actuales de Spotify
      const artist = CONFIG.artists.find(a => a.name === artistName);
      let spotifyData = null;
      
      if (artist && artist.playlistId && !artist.skipSpotify) {
        try {
          spotifyData = await SpotifyAPI.getPlaylistData(artist.playlistId);
        } catch (error) {
          console.log('No se pudieron obtener datos de Spotify');
        }
      }
      
      // Calcular métricas
      const totalSpent = campaigns.reduce((s, c) => s + c.amountSpent, 0);
      const totalResults = campaigns.reduce((s, c) => s + c.results, 0);
      const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);
      
      const currentFollowers = spotifyData ? spotifyData.followers : baseline.playlistFollowers;
      const increase = currentFollowers - baseline.playlistFollowers;
      const cpf = increase > 0 ? totalSpent / increase : 0;
      
      const reportData = {
        artist: artistName,
        period: { start: startDate, end: endDate },
        totalSpent: totalSpent,
        spotifyData: spotifyData,
        campaigns: campaigns,
        metrics: {
          followersStart: baseline.playlistFollowers,
          followersEnd: currentFollowers,
          increase: increase,
          costPerFollower: cpf,
          results: totalResults,
          reach: totalReach
        },
        analysis: {
          insights: [`Increase followers: +${increase}`, `CPF: €${cpf.toFixed(2)}`],
          isOnTrack: cpf <= 2,
          commitmentFulfillment: 85
        }
      };
      
      // Generar HTML visual con branding ELIXIR
      const html = HTMLReports.generateArtistHTMLReport(reportData);
      
      // Descargar HTML
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${artistName}_${startDate}_${endDate}.html`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Mostrar preview
      this.showArtistReportPreview(reportData);
      
      this.hideLoading();
      this.showAlert('success', `✅ Report de ${artistName} descargado`);
      
    } catch (error) {
      console.error('Error:', error);
      this.hideLoading();
      this.showAlert('danger', 'Error: ' + error.message);
    }
  },
  
  // Generar HTML del report individual
  generateArtistHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report ${data.artist}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1C1C1C; }
    h1 { color: #EA34FA; border-bottom: 3px solid #EA34FA; padding-bottom: 10px; }
    .kpi { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background: #f3e8ff; border-radius: 8px; }
    .kpi-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .kpi-value { font-size: 24px; font-weight: bold; color: #EA34FA; margin-top: 5px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: bold; color: #EA34FA; border-bottom: 2px solid #EA34FA; padding-bottom: 5px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #EA34FA; color: white; padding: 10px; text-align: left; }
    td { padding: 10px; border: 1px solid #ddd; }
    .insight { background: #d1fae5; border-left: 4px solid #10b981; padding: 10px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>📊 REPORT: ${data.artist}</h1>
  <p><strong>Periodo:</strong> ${data.period.start} - ${data.period.end}</p>
  
  <div class="kpi">
    <div class="kpi-label">Gasto Total</div>
    <div class="kpi-value">€${data.totalSpent.toFixed(2)}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Followers Ganados</div>
    <div class="kpi-value">+${data.metrics.increase}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">€/Follower</div>
    <div class="kpi-value">€${data.metrics.costPerFollower.toFixed(2)}</div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Datos Spotify</h2>
    <table>
      <tr><td><strong>Followers Inicio (31/10):</strong></td><td>${data.metrics.followersStart.toLocaleString()}</td></tr>
      <tr><td><strong>Followers Final (Actuales):</strong></td><td>${data.metrics.followersEnd.toLocaleString()}</td></tr>
      <tr><td><strong>Increase:</strong></td><td>+${data.metrics.increase}</td></tr>
      <tr><td><strong>Popularidad:</strong></td><td>${data.spotifyData?.popularity || 'N/A'}/100</td></tr>
    </table>
  </div>
  
  <div class="section">
    <h2 class="section-title">Análisis</h2>
    ${data.analysis.insights.map(i => `<div class="insight">${i}</div>`).join('')}
  </div>
  
  <div class="section">
    <h2 class="section-title">Campañas</h2>
    <table>
      <thead>
        <tr>
          <th>Campaña</th>
          <th>Gasto</th>
          <th>Conversiones</th>
          <th>Alcance</th>
        </tr>
      </thead>
      <tbody>
        ${data.campaigns.map(c => `
          <tr>
            <td>${c.campaignName}</td>
            <td>€${c.amountSpent.toFixed(2)}</td>
            <td>${c.results}</td>
            <td>${c.reach.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <footer style="margin-top: 50px; text-align: center; color: #666; border-top: 2px solid #EA34FA; padding-top: 20px;">
    <p>Report ELIXIR - ${new Date().toLocaleDateString('es-ES')}</p>
  </footer>
</body>
</html>
    `;
  },
  
  // Mostrar preview de report individual
  showArtistReportPreview(data) {
    const container = document.getElementById('artistReportPreview');
    if (!container) return;
    
    container.innerHTML = `
      <div class="card" style="background: rgba(234, 52, 250, 0.05);">
        <h4 style="color: var(--elixir-pink); margin-bottom: 1rem;">${data.artist}</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          <div>
            <div style="font-size: 0.85rem; color: var(--gray-300);">Gasto Total</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: var(--elixir-white);">€${data.metrics.spent.toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size: 0.85rem; color: var(--gray-300);">Followers Ganados</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">+${data.metrics.increase}</div>
          </div>
          <div>
            <div style="font-size: 0.85rem; color: var(--gray-300);">€/Follower</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: ${data.metrics.costPerFollower <= 2 ? 'var(--success)' : data.metrics.costPerFollower > 3.5 ? 'var(--danger)' : 'var(--warning)'};">€${data.metrics.costPerFollower.toFixed(2)}</div>
          </div>
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(234, 52, 250, 0.2);">
          <strong style="color: var(--elixir-pink);">Recomendación:</strong>
          <p style="color: var(--elixir-white); margin-top: 0.5rem;">${data.recommendation}</p>
        </div>
      </div>
    `;
  },

  // Mostrar opciones de reportes
  showReportOptions() {
    const container = document.getElementById('reportOptions');
    if (!container) return;
    
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Reportes Disponibles</h3>
        </div>
        <div style="padding: 1rem;">
          <button class="btn btn-primary" onclick="App.downloadGeneralReport()">
            Descargar Report General (Excel)
          </button>
          <hr>
          <h4>Reports Individuales (Word):</h4>
          ${this.data.reportData.byArtist.map(artist => `
            <button class="btn btn-secondary" 
                    onclick="App.downloadIndividualReport('${artist.artist}')">
              ${artist.artist}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Descargar report general
  downloadGeneralReport() {
    ReportGenerator.downloadExcelReport(this.data.reportData);
  },

  // Descargar report individual
  downloadIndividualReport(artistName) {
    const artistData = this.data.reportData.byArtist.find(a => a.artist === artistName);
    if (artistData) {
      ReportGenerator.downloadWordReport(artistData, this.data.reportData.period);
    }
  },

  // UI helpers
  showLoading(message = 'Cargando...') {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div style="text-align: center;">
          <div class="loading-spinner"></div>
          <p style="color: white; margin-top: 1rem;" id="loadingMessage">${message}</p>
        </div>
      `;
      document.body.appendChild(overlay);
    } else {
      document.getElementById('loadingMessage').textContent = message;
      overlay.style.display = 'flex';
    }
  },

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  },

  showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
  },
  
  // ============================================
  // FUNCIONES DE SNAPSHOTS PERSISTENTES
  // ============================================
  
  // Descargar archivo actual de snapshots
  downloadCurrentSnapshotsFile() {
    if (typeof PersistenceManager === 'undefined') {
      console.error('❌ PersistenceManager no disponible');
      this.showAlert('Error: Sistema de persistencia no cargado', 'error');
      return;
    }
    
    const reportSnapshots = SnapshotsPersistent.getAllSnapshots();
    const monthlySnapshots = SnapshotsPersistent.lastMonthlySnapshot || {};
    
    PersistenceManager.downloadSnapshotsFile(reportSnapshots, monthlySnapshots);
    
    this.showAlert('✅ Archivo descargado. Reemplaza js/snapshotsPersistent.js', 'success');
  },
  
  // Mostrar snapshots guardados visualmente
  showSnapshotsVisual() {
    const snapshots = SnapshotsPersistent.getAllSnapshots();
    const snapshotsList = document.getElementById('snapshotsList');
    
    if (!snapshotsList) {
      console.error('❌ Elemento snapshotsList no encontrado');
      return;
    }
    
    if (snapshots.length === 0) {
      snapshotsList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #9ca3af;">
          <p style="font-size: 3rem; margin-bottom: 10px;">📭</p>
          <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 5px;">No hay snapshots guardados</p>
          <p style="font-size: 0.9rem;">Genera un report completo para crear el primer snapshot</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    // Mostrar snapshots en orden inverso (más reciente primero)
    snapshots.reverse().forEach((snapshot, index) => {
      const artistCount = Object.keys(snapshot.artists).length;
      const totalIncrease = Object.values(snapshot.artists).reduce((sum, a) => sum + (a.increase || 0), 0);
      const totalSpent = Object.values(snapshot.artists).reduce((sum, a) => sum + (a.spent || 0), 0);
      
      html += `
        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%); 
                    border-left: 4px solid #8b5cf6; 
                    padding: 20px; 
                    border-radius: 12px; 
                    margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <h4 style="margin: 0; color: #8b5cf6; font-size: 1.1rem;">
                📊 Report ${snapshots.length - index}: ${snapshot.startDate} → ${snapshot.endDate}
              </h4>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">
                Generado: ${new Date(snapshot.generatedAt).toLocaleString('es-ES')}
              </p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.9rem; color: #10b981; font-weight: 600;">
                +${totalIncrease.toLocaleString()} followers
              </div>
              <div style="font-size: 0.85rem; color: #9ca3af;">
                €${totalSpent.toFixed(2)} gastado
              </div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 10px;">
            ${Object.entries(snapshot.artists).map(([name, data]) => `
              <div style="background: rgba(255, 255, 255, 0.5); padding: 10px; border-radius: 8px;">
                <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 5px;">${name}</div>
                <div style="font-size: 0.8rem; color: #9ca3af;">
                  ${data.followersStart} → ${data.followersEnd} (+${data.increase})
                </div>
                <div style="font-size: 0.8rem; color: ${data.cpf <= 0.50 ? '#10b981' : data.cpf <= 0.90 ? '#f59e0b' : '#ef4444'}; font-weight: 600;">
                  €${data.cpf.toFixed(2)}/follower
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    
    snapshotsList.innerHTML = html;
    console.log(`📊 Mostrando ${snapshots.length} snapshots`);
  },
  
  // Guardar snapshot manual
  // ========================================
  // HISTÓRICO DE CAMPAÑAS
  // ========================================
  
  showHistorico(tipo) {
    const container = document.getElementById('historicoContainer');
    const historicoData = HistoricalData.reportHistory || [];
    
    if (historicoData.length === 0) {
      container.innerHTML = `
        <p style="text-align: center; color: var(--gray-400); padding: 3rem;">
          📊 Aún no hay histórico. Genera tu primer report de Monitoring para empezar a construir el histórico.
        </p>
      `;
      return;
    }
    
    // Filtrar según tipo
    let dataToShow = historicoData;
    if (tipo === 'reciente') {
      dataToShow = historicoData.slice(-4); // Últimas 4 entradas
    }
    
    // Generar tabla
    this.renderHistoricoTable(dataToShow);
    
    // Actualizar botones activos
    document.getElementById('btnHistoricoReciente').className = tipo === 'reciente' ? 'btn btn-primary' : 'btn btn-secondary';
    document.getElementById('btnHistoricoCompleto').className = tipo === 'completo' ? 'btn btn-primary' : 'btn btn-secondary';
  },
  
  renderHistoricoTable(data) {
    const container = document.getElementById('historicoContainer');
    
    // Obtener todas las fechas únicas
    const fechas = [...new Set(data.map(entry => entry.fecha))].sort();
    
    // Obtener artistas Playlist y TrackBoost
    const artistasPlaylist = [...new Set(data.flatMap(entry => Object.keys(entry.data || {})))].sort();
    const artistasTrackBoost = [...new Set(data.flatMap(entry => Object.keys(entry.trackboost || {})))].sort();
    
    let html = '';
    
    // ========================================
    // SECCIÓN 1: CAMPAÑAS PLAYLIST
    // ========================================
    if (artistasPlaylist.length > 0) {
      html += `
        <h4 style="color: #8b5cf6; margin-bottom: 1rem;">📊 Campañas Playlist (CPF)</h4>
        <table class="data-table" style="min-width: 100%; margin-bottom: 2rem;">
          <thead style="background: rgba(139, 92, 246, 0.2);">
            <tr>
              <th style="position: sticky; left: 0; background: var(--card-bg); z-index: 2;">Artista</th>
              <th style="text-align: center;">Meta</th>
              ${fechas.map(fecha => `<th style="text-align: center;">${fecha}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
      `;
      
      artistasPlaylist.forEach(artista => {
        const artistConfig = CONFIG.artists.find(a => a.name === artista);
        const metaCPF = artistConfig?.targetCPF || 0.50;
        
        html += `<tr>`;
        html += `<td style="position: sticky; left: 0; background: var(--card-bg); font-weight: 600; z-index: 1;">${artista}</td>`;
        html += `<td style="text-align: center; color: var(--gray-400);">€${metaCPF.toFixed(2)}</td>`;
        
        fechas.forEach(fecha => {
          const entry = data.find(e => e.fecha === fecha);
          const cpf = entry?.data?.[artista]?.cpf;
          
          if (cpf !== undefined) {
            // Umbrales Playlist
            let bgColor = '#10b981'; // Verde
            if (cpf >= 0.99) bgColor = '#ef4444'; // Rojo
            else if (cpf >= 0.70) bgColor = '#f59e0b'; // Naranja
            else if (cpf >= 0.50) bgColor = '#3b82f6'; // Azul
            
            html += `<td style="text-align: center; background: ${bgColor}33; color: ${bgColor}; font-weight: 600;">€${cpf.toFixed(2)}</td>`;
          } else {
            html += `<td style="text-align: center; color: var(--gray-500);">--</td>`;
          }
        });
        
        html += `</tr>`;
      });
      
      html += `
          </tbody>
        </table>
      `;
    }
    
    // ========================================
    // SECCIÓN 2: CAMPAÑAS TRACKBOOST
    // ========================================
    if (artistasTrackBoost.length > 0) {
      html += `
        <h4 style="color: #f59e0b; margin-bottom: 1rem; margin-top: 2rem;">💎 Campañas TrackBoost (Coste/Save)</h4>
        <table class="data-table" style="min-width: 100%;">
          <thead style="background: rgba(245, 158, 11, 0.2);">
            <tr>
              <th style="position: sticky; left: 0; background: var(--card-bg); z-index: 2;">Artista (Track)</th>
              <th style="text-align: center;">Meta</th>
              ${fechas.map(fecha => `<th style="text-align: center;">${fecha}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
      `;
      
      artistasTrackBoost.forEach(artista => {
        const metaCosteSave = 0.50; // Meta fija para TrackBoost
        
        html += `<tr>`;
        html += `<td style="position: sticky; left: 0; background: var(--card-bg); font-weight: 600; z-index: 1;">${artista}</td>`;
        html += `<td style="text-align: center; color: var(--gray-400);">€${metaCosteSave.toFixed(2)}</td>`;
        
        fechas.forEach(fecha => {
          const entry = data.find(e => e.fecha === fecha);
          const costeSave = entry?.trackboost?.[artista]?.costeSave;
          
          if (costeSave !== undefined) {
            // Umbrales TrackBoost
            let bgColor = '#10b981'; // Verde
            if (costeSave > 0.90) bgColor = '#f59e0b'; // Naranja
            else if (costeSave > 0.50) bgColor = '#3b82f6'; // Azul
            
            html += `<td style="text-align: center; background: ${bgColor}33; color: ${bgColor}; font-weight: 600;">€${costeSave.toFixed(2)}</td>`;
          } else {
            html += `<td style="text-align: center; color: var(--gray-500);">--</td>`;
          }
        });
        
        html += `</tr>`;
      });
      
      html += `
          </tbody>
        </table>
      `;
    }
    
    if (artistasPlaylist.length === 0 && artistasTrackBoost.length === 0) {
      html = `
        <p style="text-align: center; color: var(--gray-400); padding: 3rem;">
          📊 No hay datos para mostrar
        </p>
      `;
    }
    
    container.innerHTML = html;
    
    // Mostrar gráfico si hay datos
    this.renderHistoricoGrafico(data, artistas, fechas);
  },
  
  renderHistoricoGrafico(data, artistas, fechas) {
    const graficoContainer = document.getElementById('historicoGraficoContainer');
    const canvas = document.getElementById('historicoGrafico');
    
    if (!canvas) return;
    
    graficoContainer.style.display = 'block';
    
    // Preparar datasets para Chart.js
    const datasets = artistas.map((artista, index) => {
      const colors = [
        '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7'
      ];
      const color = colors[index % colors.length];
      
      const dataPoints = fechas.map(fecha => {
        const entry = data.find(e => e.fecha === fecha);
        return entry?.data[artista]?.cpf || null;
      });
      
      return {
        label: artista,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color + '33',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7
      };
    });
    
    // Crear/actualizar gráfico
    if (window.historicoChart) {
      window.historicoChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    window.historicoChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fechas,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#e5e7eb' }
          },
          title: {
            display: true,
            text: 'Evolución del CPF por Artista',
            color: '#e5e7eb',
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              color: '#9ca3af',
              callback: function(value) {
                return '€' + value.toFixed(2);
              }
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  },
  
  saveToHistorico(reportRows, startDate, endDate, trackboostData = null) {
    // Inicializar histórico si no existe
    HistoricalData.reportHistory = HistoricalData.reportHistory || [];
    
    // Crear entrada de histórico
    const fecha = `${startDate.split('-').reverse().join('/')}`;
    const historyEntry = {
      fecha: fecha,
      startDate: startDate,
      endDate: endDate,
      snapshotBase: this.snapshotBaseDate,
      generatedAt: new Date().toISOString(),
      data: {},
      trackboost: {}  // NUEVO: datos TrackBoost
    };
    
    // Extraer CPF de cada artista (Playlist)
    reportRows.forEach(row => {
      historyEntry.data[row.artist] = {
        cpf: parseFloat(row.costPerFollower),
        increaseFollowers: parseInt(row.increaseFollowers),
        spent: parseFloat(row.spent),
        followersStart: parseInt(row.followersStart),
        followersEnd: parseInt(row.followersEnd),
        type: 'playlist'
      };
    });
    
    // Extraer Coste/Save de TrackBoost
    if (trackboostData && trackboostData.length > 0) {
      trackboostData.forEach(tb => {
        historyEntry.trackboost[tb.artist] = {
          costeSave: tb.costeSave || 0,
          saves: tb.saves || 0,
          savesGanados: tb.savesGanados || 0,
          spent: tb.gasto || 0,
          budgetPercentage: tb.budgetPercentage || 0,
          type: 'trackboost'
        };
      });
      console.log(`📊 TrackBoost incluido: ${trackboostData.length} artistas`);
    }
    
    // Verificar si ya existe entrada para esta fecha
    const existingIndex = HistoricalData.reportHistory.findIndex(h => h.fecha === fecha);
    
    if (existingIndex >= 0) {
      // Actualizar existente
      HistoricalData.reportHistory[existingIndex] = historyEntry;
      console.log(`📊 Histórico actualizado para ${fecha}`);
    } else {
      // Agregar nuevo
      HistoricalData.reportHistory.push(historyEntry);
      console.log(`📊 Nueva entrada en histórico: ${fecha}`);
    }
    
    // Ordenar por fecha
    HistoricalData.reportHistory.sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    );
    
    console.log(`📈 Histórico total: ${HistoricalData.reportHistory.length} entradas`);
  },
  
  exportHistoricoExcel() {
    const historicoData = HistoricalData.reportHistory || [];
    
    if (historicoData.length === 0) {
      alert('⚠️ No hay histórico para exportar');
      return;
    }
    
    // Implementar export (similar a downloadExcel)
    alert('🚧 Export Excel del histórico en desarrollo');
  },

  async saveManualSnapshot() {
    // NUEVO: Pedir fecha al usuario
    const date = prompt('📅 Guardar snapshot\n\n' +
                        'Introduce la fecha (formato: DD/MM/YYYY)\n' +
                        'Deja vacío para usar fecha de hoy\n' +
                        'Ejemplo: 01/12/2025');
    
    let snapshotDate;
    
    if (!date || date.trim() === '') {
      // Usar fecha de hoy
      const today = new Date();
      snapshotDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    } else {
      // Validar formato
      if (!date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        alert('❌ Fecha no válida. Usa formato DD/MM/YYYY');
        return;
      }
      snapshotDate = date;
    }
    
    // Confirmar creación
    const confirm = window.confirm(
      `📅 Guardar snapshot para: ${snapshotDate}\n\n` +
      `Se guardarán los followers actuales de todos los artistas.\n\n` +
      `Este snapshot estará disponible en el selector de Monitoring.\n\n` +
      `¿Continuar?`
    );
    
    if (!confirm) return;
    
    // Recopilar datos actuales de todos los artistas
    const snapshotData = {};
    
    for (const artist of CONFIG.artists) {
      if (artist.skipSpotify || !artist.active) continue;
      
      let followers = 0;
      
      // Intentar obtener de DatosActualesSpotify
      if (typeof DatosActualesSpotify !== 'undefined' && DatosActualesSpotify.hasData(artist.name)) {
        followers = DatosActualesSpotify.getFollowers(artist.name);
      } else {
        // Fallback a baseline
        const baseline = HistoricalData.getArtistBaseline(artist.name);
        followers = baseline ? baseline.playlistFollowers : 0;
      }
      
      snapshotData[artist.name] = {
        followers: followers,
        date: snapshotDate
      };
    }
    
    console.log(`📸 Snapshot creado para ${snapshotDate}:`, snapshotData);
    
    // Guardar en HistoricalData.manualSnapshots
    HistoricalData.manualSnapshots = HistoricalData.manualSnapshots || {};
    HistoricalData.manualSnapshots[snapshotDate] = snapshotData;
    
    // Agregar al selector de Monitoring
    const selector = document.getElementById('snapshotBaseSelector');
    if (selector) {
      // Verificar si ya existe
      const existingOption = Array.from(selector.options).find(opt => opt.value === snapshotDate);
      
      if (!existingOption) {
        const option = document.createElement('option');
        option.value = snapshotDate;
        option.textContent = `${snapshotDate} (manual)`;
        selector.insertBefore(option, selector.querySelector('option[value="manual"]'));
      }
      
      // Seleccionar automáticamente
      selector.value = snapshotDate;
      this.snapshotBaseDate = snapshotDate;
      
      // Actualizar indicador
      const indicator = document.getElementById('snapshotBaseIndicator');
      if (indicator) {
        indicator.textContent = `📌 Usando: ${snapshotDate} (manual)`;
      }
    }
    
    // Agregar TAMBIÉN al selector de Reports
    const reportSelector = document.getElementById('reportSnapshotSelector');
    if (reportSelector) {
      // Verificar si ya existe
      const existingReportOption = Array.from(reportSelector.options).find(opt => opt.value === snapshotDate);
      
      if (!existingReportOption) {
        const reportOption = document.createElement('option');
        reportOption.value = snapshotDate;
        reportOption.textContent = `${snapshotDate} (manual)`;
        reportSelector.add(reportOption);
      }
      
      // Seleccionar automáticamente
      reportSelector.value = snapshotDate;
      
      // Actualizar indicador de reports
      const reportIndicator = document.getElementById('reportSnapshotIndicator');
      if (reportIndicator) {
        reportIndicator.textContent = `📌 Reports usarán: ${snapshotDate} (manual)`;
      }
    }
    
    // Guardar también en PersistenceManager (para descargar archivo)
    if (typeof PersistenceManager !== 'undefined') {
      const artistsDataOldFormat = {};
      Object.keys(snapshotData).forEach(artist => {
        artistsDataOldFormat[artist] = {
          followers: snapshotData[artist].followers,
          oyentes: 0,
          seguidoresPerfil: 0
        };
      });
      await PersistenceManager.saveMonthlySnapshot(snapshotDate, artistsDataOldFormat);
    }
    
    // Re-renderizar Monitoring
    this.renderMonitoringTable();
    
    alert(`✅ Snapshot creado exitosamente!\n\n` +
          `Fecha etiqueta: ${snapshotDate}\n` +
          `Artistas: ${Object.keys(snapshotData).length}\n\n` +
          `⚠️ IMPORTANTE: Este snapshot guarda los followers de HOY (${new Date().toLocaleDateString('es-ES')})\n` +
          `con la etiqueta "${snapshotDate}".\n\n` +
          `NO son datos reales del ${snapshotDate}, sino de hoy.\n\n` +
          `El snapshot está disponible en:\n` +
          `• Selector de Monitoring\n` +
          `• Selector de Reports\n` +
          `• Sistema de persistencia`);
    
    this.showSnapshotsVisual();
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Solo inicializar si está autenticado (el sistema de auth lo llamará)
  if (typeof AuthSystem !== 'undefined' && AuthSystem.isAuthenticated()) {
    App.init();
  }
  
  // Listener para selector de snapshot en Reports
  const reportSnapshotSelector = document.getElementById('reportSnapshotSelector');
  if (reportSnapshotSelector) {
    reportSnapshotSelector.addEventListener('change', function() {
      const selectedSnapshot = this.value;
      App.snapshotBaseDate = selectedSnapshot;
      
      // Sincronizar con selector de Monitoring
      const monitoringSelector = document.getElementById('snapshotBaseSelector');
      if (monitoringSelector && monitoringSelector.value !== selectedSnapshot) {
        monitoringSelector.value = selectedSnapshot;
      }
      
      // Actualizar indicador
      const indicator = document.getElementById('reportSnapshotIndicator');
      if (indicator) {
        const labels = {
          '31/10/2024': '31 Octubre 2024 (baseline)',
          '01/12/2025': '01 Diciembre 2025 (estimado)'
        };
        indicator.textContent = `📌 Reports usarán: ${labels[selectedSnapshot] || selectedSnapshot + ' (manual)'}`;
      }
      
      console.log(`📅 Snapshot para Reports cambiado a: ${selectedSnapshot}`);
    });
  }
});
