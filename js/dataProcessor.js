// ============================================
// PROCESADOR DE DATOS - CSV, EXCEL, ANÁLISIS
// ============================================

const DataProcessor = {
  
  // Procesar CSV de Meta Ads
  parseMetaAdsCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  },

  // Parser de línea CSV (maneja comillas)
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  },

  // Transformar datos de Meta Ads a formato estándar
  transformMetaAdsData(rawData) {
    const cols = CONFIG.metaAdsColumns;
    
    return rawData.map(row => {
      const campaignName = row[cols.campaignName] || '';
      const artist = CONFIG.findArtistByCampaign(campaignName);
      
      // DEBUG: Log para Steban
      if (campaignName.toLowerCase().includes('stban')) {
        console.log(`🔍 Campaña Steban detectada: "${campaignName}"`);
        console.log(`   → Artista encontrado:`, artist);
        console.log(`   → Nombre artista:`, artist ? artist.name : 'NO ENCONTRADO');
        console.log(`   → Keywords artista:`, artist ? artist.campaignKeywords : 'N/A');
        console.log(`   → isTrackboost:`, artist ? artist.isTrackboost : 'N/A');
      }
      
      return {
        startDate: row[cols.startDate],
        endDate: row[cols.endDate],
        campaignName: campaignName,
        artist: artist ? artist.name : 'Unknown',
        artistData: artist,
        results: parseFloat(row[cols.results]) || 0,
        costPerResult: parseFloat(row[cols.costPerResult]) || 0,
        amountSpent: parseFloat(row[cols.amountSpent]) || 0,
        impressions: parseInt(row[cols.impressions]) || 0,
        reach: parseInt(row[cols.reach]) || 0,
        // Campos calculados
        ctr: this.calculateCTR(row),
        cpm: this.calculateCPM(row)
      };
    });
  },

  // Calcular CTR
  calculateCTR(row) {
    const impressions = parseInt(row[CONFIG.metaAdsColumns.impressions]) || 0;
    const results = parseFloat(row[CONFIG.metaAdsColumns.results]) || 0;
    return impressions > 0 ? (results / impressions * 100).toFixed(2) : 0;
  },

  // Calcular CPM
  calculateCPM(row) {
    const impressions = parseInt(row[CONFIG.metaAdsColumns.impressions]) || 0;
    const spent = parseFloat(row[CONFIG.metaAdsColumns.amountSpent]) || 0;
    return impressions > 0 ? (spent / impressions * 1000).toFixed(2) : 0;
  },

  // Agregar datos por artista
  aggregateByArtist(campaigns) {
    const artistMap = {};
    
    campaigns.forEach(campaign => {
      const artistName = campaign.artist;
      
      if (!artistMap[artistName]) {
        artistMap[artistName] = {
          artist: artistName,
          artistData: campaign.artistData,
          totalSpent: 0,
          totalResults: 0,
          totalImpressions: 0,
          totalReach: 0,
          campaigns: []
        };
      }
      
      artistMap[artistName].totalSpent += campaign.amountSpent;
      artistMap[artistName].totalResults += campaign.results;
      artistMap[artistName].totalImpressions += campaign.impressions;
      artistMap[artistName].totalReach += campaign.reach;
      artistMap[artistName].campaigns.push(campaign);
    });
    
    // Calcular métricas agregadas
    return Object.values(artistMap).map(artist => ({
      ...artist,
      avgCostPerResult: artist.totalResults > 0 
        ? (artist.totalSpent / artist.totalResults).toFixed(2) 
        : 0,
      totalCampaigns: artist.campaigns.length
    }));
  },

  // Análisis de rendimiento con lógica de negocio
  analyzePerformance(campaign, spotifyData) {
    const cpf = campaign.costPerResult;
    const followers = campaign.results;
    const popularity = spotifyData?.popularity || 0;
    
    // Obtener decisión estratégica
    const decision = CONFIG.getStrategicDecision(cpf, followers, popularity);
    
    // Clasificación de rendimiento
    let performanceClass = 'medium-cost';
    if (cpf <= CONFIG.thresholds.goodCPF) {
      performanceClass = 'low-cost';
    } else if (cpf > CONFIG.thresholds.highCPF) {
      performanceClass = 'high-cost';
    }
    
    // Calcular cumplimiento de compromiso
    const daysInPeriod = this.calculateDaysBetween(campaign.startDate, campaign.endDate);
    const expectedFollowers = (CONFIG.budget.followerCommitment / 30) * daysInPeriod;
    const commitmentFulfillment = (followers / expectedFollowers * 100).toFixed(0);
    
    return {
      cpf,
      followers,
      popularity,
      performanceClass,
      decision,
      commitmentFulfillment: parseInt(commitmentFulfillment),
      isOnTrack: commitmentFulfillment >= 80,
      insights: this.generateInsights(campaign, spotifyData, decision),
      recommendations: decision ? [decision.primaryAction, decision.secondaryAction] : []
    };
  },

  // Generar insights automáticos
  generateInsights(campaign, spotifyData, decision) {
    const insights = [];
    
    // Insight de CPF
    if (campaign.costPerResult <= CONFIG.thresholds.goodCPF) {
      insights.push(`Excelente eficiencia: CPF ${campaign.costPerResult.toFixed(2)}€ por debajo del objetivo`);
    } else if (campaign.costPerResult > CONFIG.thresholds.highCPF) {
      insights.push(`Alerta: CPF ${campaign.costPerResult.toFixed(2)}€ requiere optimización`);
    }
    
    // Insight de volumen
    if (campaign.results >= CONFIG.thresholds.minFollowers) {
      insights.push(`Buen volumen: ${campaign.results} conversiones generadas`);
    } else {
      insights.push(`Volumen bajo: Solo ${campaign.results} conversiones`);
    }
    
    // Insight de popularidad
    if (spotifyData && spotifyData.popularity >= CONFIG.thresholds.minPopularity) {
      insights.push(`Playlist popular: Score ${spotifyData.popularity}/100`);
    }
    
    // Insight de presupuesto
    const daysInPeriod = this.calculateDaysBetween(campaign.startDate, campaign.endDate);
    const expectedBudget = CONFIG.budget.dailyPerArtist * daysInPeriod;
    if (campaign.amountSpent > expectedBudget * 1.1) {
      insights.push(`Sobrepresupuesto: ${((campaign.amountSpent / expectedBudget - 1) * 100).toFixed(0)}% por encima`);
    }
    
    return insights;
  },

  // Calcular días entre fechas
  calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  // Combinar datos de Meta Ads con Spotify
  async enrichWithSpotifyData(campaigns) {
    const enriched = [];
    
    for (const campaign of campaigns) {
      let spotifyData = null;
      
      if (campaign.artistData && campaign.artistData.playlistId && !campaign.artistData.skipSpotify) {
        try {
          // Intentar obtener datos de Spotify para la fecha del reporte
          spotifyData = await SpotifyAPI.getHistoricalData(
            campaign.artistData.playlistId,
            campaign.endDate
          );
        } catch (error) {
          console.log(`No se pudieron obtener datos de Spotify para ${campaign.artist}`);
        }
      }
      
      const analysis = this.analyzePerformance(campaign, spotifyData);
      
      enriched.push({
        ...campaign,
        spotifyData,
        analysis
      });
    }
    
    return enriched;
  },

  // Exportar datos a formato de reporte
  prepareReportData(campaigns, startDate, endDate) {
    const filtered = campaigns.filter(c => 
      c.startDate >= startDate && c.endDate <= endDate
    );
    
    const aggregated = this.aggregateByArtist(filtered);
    
    return {
      period: {
        start: startDate,
        end: endDate,
        days: this.calculateDaysBetween(startDate, endDate)
      },
      summary: {
        totalSpent: filtered.reduce((sum, c) => sum + c.amountSpent, 0),
        totalResults: filtered.reduce((sum, c) => sum + c.results, 0),
        totalCampaigns: filtered.length,
        avgCPF: filtered.length > 0 
          ? (filtered.reduce((sum, c) => sum + c.amountSpent, 0) / 
             filtered.reduce((sum, c) => sum + c.results, 0)).toFixed(2)
          : 0
      },
      byArtist: aggregated,
      campaigns: filtered,
      insights: this.generateGlobalInsights(filtered, aggregated)
    };
  },

  // Insights globales del periodo
  generateGlobalInsights(campaigns, aggregated) {
    const insights = [];
    
    // Validar que hay datos
    if (!aggregated || aggregated.length === 0) {
      insights.push('No hay datos suficientes para generar insights');
      return insights;
    }
    
    // Mejor rendimiento
    const best = aggregated.reduce((prev, current) => 
      parseFloat(current.avgCostPerResult) < parseFloat(prev.avgCostPerResult) ? current : prev
    );
    insights.push(`Mejor rendimiento: ${best.artist} con €${best.avgCostPerResult}/follower`);
    
    // Peor rendimiento
    const worst = aggregated.reduce((prev, current) => 
      parseFloat(current.avgCostPerResult) > parseFloat(prev.avgCostPerResult) ? current : prev
    );
    insights.push(`Requiere atención: ${worst.artist} con €${worst.avgCostPerResult}/follower`);
    
    // Gasto total vs presupuesto
    const artistCount = aggregated.length;
    const expectedBudget = CONFIG.budget.monthlyPerArtist * artistCount;
    const totalSpent = aggregated.reduce((sum, a) => sum + a.totalSpent, 0);
    
    if (totalSpent < expectedBudget * 0.9) {
      insights.push(`Presupuesto subutilizado: ${((1 - totalSpent/expectedBudget) * 100).toFixed(0)}% disponible`);
    } else if (totalSpent > expectedBudget * 1.1) {
      insights.push(`Sobrepresupuesto: ${((totalSpent/expectedBudget - 1) * 100).toFixed(0)}% por encima`);
    }
    
    return insights;
  }
};
