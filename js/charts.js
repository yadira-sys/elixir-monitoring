// ============================================
// GRÁFICOS CON CHART.JS - BRANDING ELIXIR
// ============================================

const ChartManager = {
  charts: {},
  
  // Colores del tema Elixir
  colors: {
    primary: '#EA34FA',
    primaryTransparent: 'rgba(234, 52, 250, 0.2)',
    primaryLight: '#ff6bff',
    dark: '#070616',
    white: '#FFFFFF',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    gray: '#9ca3af'
  },

  // Configuración base de Chart.js
  getBaseConfig() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: this.colors.white,
            font: {
              size: 12,
              family: 'Inter'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(7, 6, 22, 0.9)',
          titleColor: this.colors.primary,
          bodyColor: this.colors.white,
          borderColor: this.colors.primary,
          borderWidth: 1,
          padding: 12,
          displayColors: true
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(234, 52, 250, 0.1)',
            borderColor: 'rgba(234, 52, 250, 0.3)'
          },
          ticks: {
            color: this.colors.gray
          }
        },
        y: {
          grid: {
            color: 'rgba(234, 52, 250, 0.1)',
            borderColor: 'rgba(234, 52, 250, 0.3)'
          },
          ticks: {
            color: this.colors.gray
          }
        }
      }
    };
  },

  // Destruir gráfico existente
  destroyChart(chartId) {
    if (this.charts[chartId]) {
      this.charts[chartId].destroy();
      delete this.charts[chartId];
    }
  },

  // Gráfico: Evolución de Followers por Artista
  createFollowersEvolutionChart(canvasId, data) {
    this.destroyChart(canvasId);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const datasets = data.map((artist, index) => {
      const hue = (index * 360 / data.length);
      return {
        label: artist.name,
        data: artist.followersHistory,
        borderColor: `hsl(${hue}, 80%, 60%)`,
        backgroundColor: `hsla(${hue}, 80%, 60%, 0.1)`,
        borderWidth: 2,
        tension: 0.4,
        fill: true
      };
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data[0]?.dates || [],
        datasets: datasets
      },
      options: {
        ...this.getBaseConfig(),
        plugins: {
          ...this.getBaseConfig().plugins,
          title: {
            display: true,
            text: 'Evolución Followers por Artista',
            color: this.colors.white,
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    });

    return this.charts[canvasId];
  },

  // Gráfico: CPF por Artista (Bar Chart)
  createCPFComparisonChart(canvasId, data) {
    this.destroyChart(canvasId);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Ordenar por CPF
    const sorted = [...data].sort((a, b) => a.cpf - b.cpf);
    
    const backgroundColors = sorted.map(item => {
      if (item.cpf <= CONFIG.thresholds.goodCPF) return this.colors.success;
      if (item.cpf <= CONFIG.thresholds.mediumCPF) return this.colors.warning;
      return this.colors.danger;
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(item => item.artist),
        datasets: [{
          label: '€/Follower',
          data: sorted.map(item => item.cpf),
          backgroundColor: backgroundColors,
          borderColor: this.colors.primary,
          borderWidth: 1
        }]
      },
      options: {
        ...this.getBaseConfig(),
        plugins: {
          ...this.getBaseConfig().plugins,
          title: {
            display: true,
            text: 'Coste por Follower - Ranking',
            color: this.colors.white,
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          ...this.getBaseConfig().scales,
          y: {
            ...this.getBaseConfig().scales.y,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Euros (€)',
              color: this.colors.gray
            }
          }
        }
      }
    });

    return this.charts[canvasId];
  },

  // Gráfico: Distribución de Presupuesto (Pie/Doughnut)
  createBudgetDistributionChart(canvasId, data) {
    this.destroyChart(canvasId);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Ordenar por gasto descendente
    const sorted = [...data].sort((a, b) => b.spent - a.spent);
    
    const backgroundColors = sorted.map((_, index) => {
      const hue = (index * 360 / sorted.length);
      return `hsl(${hue}, 70%, 60%)`;
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sorted.map(item => item.artist),
        datasets: [{
          data: sorted.map(item => item.spent),
          backgroundColor: backgroundColors,
          borderColor: this.colors.dark,
          borderWidth: 2
        }]
      },
      options: {
        ...this.getBaseConfig(),
        plugins: {
          ...this.getBaseConfig().plugins,
          title: {
            display: true,
            text: 'Distribución de Presupuesto por Artista',
            color: this.colors.white,
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            ...this.getBaseConfig().plugins.tooltip,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const value = context.parsed;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: €${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    return this.charts[canvasId];
  },

  // Gráfico: Gasto vs Followers (Scatter)
  createSpentVsFollowersChart(canvasId, data) {
    this.destroyChart(canvasId);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const scatterData = data.map((item, index) => ({
      x: item.spent,
      y: item.followers,
      artist: item.artist
    }));

    this.charts[canvasId] = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Gasto vs Followers',
          data: scatterData,
          backgroundColor: this.colors.primary,
          borderColor: this.colors.primaryLight,
          pointRadius: 8,
          pointHoverRadius: 12
        }]
      },
      options: {
        ...this.getBaseConfig(),
        plugins: {
          ...this.getBaseConfig().plugins,
          title: {
            display: true,
            text: 'Relación Gasto - Followers Ganados',
            color: this.colors.white,
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            ...this.getBaseConfig().plugins.tooltip,
            callbacks: {
              label: function(context) {
                const point = context.raw;
                return [
                  `Gasto: €${point.x.toFixed(2)}`,
                  `Followers: ${point.y}`,
                  `CPF: €${(point.x / point.y).toFixed(2)}`
                ];
              }
            }
          }
        },
        scales: {
          ...this.getBaseConfig().scales,
          x: {
            ...this.getBaseConfig().scales.x,
            title: {
              display: true,
              text: 'Gasto (€)',
              color: this.colors.gray
            }
          },
          y: {
            ...this.getBaseConfig().scales.y,
            title: {
              display: true,
              text: 'Followers Ganados',
              color: this.colors.gray
            }
          }
        }
      }
    });

    return this.charts[canvasId];
  },

  // Gráfico: Cumplimiento de Compromiso (Bar horizontal)
  createCommitmentChart(canvasId, data) {
    this.destroyChart(canvasId);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const backgroundColors = data.map(item => {
      if (item.fulfillment >= 100) return this.colors.success;
      if (item.fulfillment >= 80) return this.colors.warning;
      return this.colors.danger;
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(item => item.artist),
        datasets: [{
          label: 'Cumplimiento (%)',
          data: data.map(item => item.fulfillment),
          backgroundColor: backgroundColors,
          borderColor: this.colors.primary,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        ...this.getBaseConfig(),
        plugins: {
          ...this.getBaseConfig().plugins,
          title: {
            display: true,
            text: 'Cumplimiento de Compromiso (250 followers/mes)',
            color: this.colors.white,
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          ...this.getBaseConfig().scales,
          x: {
            ...this.getBaseConfig().scales.x,
            beginAtZero: true,
            max: 120,
            title: {
              display: true,
              text: 'Porcentaje (%)',
              color: this.colors.gray
            }
          }
        }
      }
    });

    return this.charts[canvasId];
  },

  // Gráfico: Resumen Multi-métrica
  createMultiMetricChart(canvasId, data) {
    this.destroyChart(canvasId);
    
    const ctx = document.getElementById(canvasId).getContext('2d');

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(item => item.artist),
        datasets: [
          {
            label: 'Gasto (€)',
            data: data.map(item => item.spent),
            backgroundColor: this.colors.primaryTransparent,
            borderColor: this.colors.primary,
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: 'Followers',
            data: data.map(item => item.followers),
            backgroundColor: this.colors.success,
            borderColor: this.colors.success,
            borderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        ...this.getBaseConfig(),
        plugins: {
          ...this.getBaseConfig().plugins,
          title: {
            display: true,
            text: 'Gasto vs Resultados por Artista',
            color: this.colors.white,
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Gasto (€)',
              color: this.colors.gray
            },
            grid: {
              color: 'rgba(234, 52, 250, 0.1)'
            },
            ticks: {
              color: this.colors.gray
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Followers',
              color: this.colors.gray
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              color: this.colors.gray
            }
          },
          x: {
            grid: {
              color: 'rgba(234, 52, 250, 0.1)'
            },
            ticks: {
              color: this.colors.gray
            }
          }
        }
      }
    });

    return this.charts[canvasId];
  }
};
