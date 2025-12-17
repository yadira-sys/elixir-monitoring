# 🎵 ELIXIR Marketing Dashboard

**Dashboard profesional de análisis de campañas de marketing musical**

Versión: **v5.3 Final (con Auth)** | Fecha: **05 Diciembre 2025** | Estado: ✅ **Producción Segura**

---

## 🔐 SISTEMA DE AUTENTICACIÓN

**Dashboard protegido con usuario y contraseña:**
- 🔒 Login requerido para acceder
- 👤 Usuario: `elixir`
- 🔑 Contraseña: `elixir2025`
- 🚪 Botón de cerrar sesión

**Cambiar credenciales:** Edita `js/auth.js` líneas 7-10

---

## 🚀 PUBLICAR Y COMPARTIR

### **📦 Generar ZIP para GitHub (Nuevo)**

**Generador automático de ZIP listo:**

1. Abre: `📦_GENERAR_ZIP_GITHUB.html`
2. Click: "Generar ZIP para GitHub"
3. Espera: 10-15 segundos
4. Descarga automática: `elixir-dashboard-github.zip`
5. ✅ ¡Listo para subir a GitHub!

**El ZIP incluye:**
- 27 archivos necesarios
- package.json (para Railway/Vercel)
- .gitignore (filtros Git)
- Todos los archivos CSS, JS, data

---

### **Publicado en GitHub Pages:**

**URL Producción:** `https://yadira-sys.github.io/elixir-monitoring`

**Credenciales de Acceso:**
- 👤 Usuario: `elixir`
- 🔑 Contraseña: `elixir2025`

### **Subir a GitHub:**

1. Genera el ZIP con `📦_GENERAR_ZIP_GITHUB.html`
2. Ve a: `https://github.com/yadira-sys/elixir-monitoring`
3. "Add file" → "Upload files"
4. Arrastra el ZIP
5. Commit: "Deploy ELIXIR Dashboard v5.3 Final"
6. Settings → Pages → Branch: main, Folder: /
7. ✅ Listo en 2-3 minutos

### **Actualizar el Dashboard:**

1. Ve a: `https://github.com/yadira-sys/elixir-monitoring`
2. Navega al archivo que quieres actualizar
3. Click en el icono del lápiz (Edit)
4. Haz los cambios necesarios
5. Scroll abajo → "Commit changes"
6. Espera 1-2 minutos → Cambios en vivo

### **Alternativas de Publicación:**

1. **🌐 GitHub Pages (Recomendado)** - Gratis para sitios estáticos ⭐
   - Perfecto para HTML/CSS/JS
   - URL limpia
   - Sin configuración

2. **⚡ Netlify** - Drag & Drop
   - Ve a: `https://netlify.com/drop`
   - Arrastra el ZIP
   - 2 minutos

3. **🚀 Vercel** - Profesional
   - Ve a: `https://vercel.com`
   - Import GitHub repo
   - Builds automáticos

4. **🚂 Railway** - Ahora funciona con package.json
   - Ve a: `https://railway.app`
   - Deploy from GitHub
   - $5 crédito gratis

**Ver guías detalladas:**
- `📦_GENERAR_ZIP_GITHUB.html` - **Generador de ZIP automático** ⭐ NUEVO
- `🎊_RESUMEN_EJECUTIVO_FINAL.md` - Resumen completo
- `🎯_INSTRUCCIONES_FINALES_ZIP.md` - Guía del ZIP
- `📋_ARCHIVOS_GITHUB_DEFINITIVO.md` - Lista de archivos para GitHub
- `🚀_SUBIR_A_GITHUB_AHORA.md` - Instrucciones paso a paso
- `📤_GUIA_PUBLICACION_NETLIFY.md` - Guía Netlify
- `📤_GUIA_PUBLICACION_GITHUB.md` - Guía GitHub Pages

---

## 🚀 CARACTERÍSTICAS PRINCIPALES

### ✅ **Sistema Completo de Análisis**
- 📊 Integración Meta Ads + Spotify
- 🚨 Alertas automáticas inteligentes
- 🏆 Ranking de performance en tiempo real
- 📈 Comparación periodo vs periodo
- 💾 Sistema de persistencia de datos
- 📅 **NUEVO:** Snapshots flexibles con selector de fecha base

### ✅ **Dos Tipos de Campañas**
1. **Campañas Playlist** - Aumentar followers de playlists Spotify
2. **Campañas TrackBoost** - Aumentar saves de tracks específicos

### ✅ **Reports Profesionales**
- Report Monitoring Completo (HTML)
- Report Individual por Artista (con Playlist Health)
- Report TrackBoost (con Coste/Save)
- Exportación a Excel/HTML

---

## 📊 UMBRALES DEFINITIVOS

### **Campañas Playlist**

| CPF | Clasificación | Color | Estrellas | Acción |
|-----|---------------|-------|-----------|--------|
| < €0.50 | Excelente | 🟢 Verde | ⭐⭐⭐⭐⭐ | Mantener |
| €0.50-0.70 | Bueno | 🔵 Azul | ⭐⭐⭐⭐ | Optimizar cover |
| €0.70-0.99 | Revisar | 🟡 Amarillo | ⭐⭐⭐ | Revisar targeting |
| ≥ €0.99 | Crítico | 🔴 Rojo | ⭐ | Pausar urgente |

### **Campañas TrackBoost**

| Coste/Save | Clasificación | Color | Acción |
|------------|---------------|-------|--------|
| ≤ €0.50 | Excelente | 🟢 Verde | Mantener |
| €0.50-0.90 | Aceptable | 🔵 Azul | Monitorear |
| > €0.90 | Optimizar | 🟡 Amarillo | Revisar |

**Presupuestos TrackBoost:**
- Lite: €200
- Normal: €500

---

## 🧮 FÓRMULAS DE CÁLCULO

### **Métricas Principales**

```javascript
// CPF (Coste Por Follower)
CPF = Gasto Total € / Followers Ganados

// Coste/Save (TrackBoost)
Coste/Save = Gasto Este Corte € / (Saves Actuales - Saves Corte Anterior)

// Presupuesto Usado
% Usado = (Gasto Actual / Presupuesto Total) × 100
```

### **Métricas Meta Ads**

```javascript
// CTR (Click-Through Rate)
CTR = (Clicks / Impresiones) × 100

// CPM (Coste Por Mil)
CPM = (Gasto € / Impresiones) × 1000

// Conversión Playlist
Conversión = (Followers / Clicks) × 100
```

---

## 🎯 INICIO RÁPIDO

### **1. Cargar Datos**
```
1. Click "📂 Cargar CSV Meta Ads"
2. Selecciona archivo CSV exportado de Meta Ads
3. Click "🔄 Actualizar Spotify"
```

### **2. Revisar Dashboard**
```
Dashboard muestra automáticamente:
✅ KPIs principales
🚨 Alertas urgentes
🏆 Ranking de artistas
📊 Gráficos de performance
```

### **3. Seleccionar Snapshot Base**
```
📅 En "Monitoring Completo" → Selector de snapshot:
- 31 Octubre 2024 (baseline) → Crecimiento desde inicio
- 01 Diciembre 2024 (estimado) → Crecimiento mes actual
- Crear snapshot manual... → Fecha personalizada
```

### **4. Generar Reports**
```
1. Selecciona rango de fechas
2. Click "🎨 HTML Visual (Branding Elixir)"
3. Se descarga report completo
```

---

## 📂 ESTRUCTURA DEL PROYECTO

```
├── index.html                          # Dashboard principal
├── README.md                           # Este archivo
├── 📘_DOCUMENTACION_COMPLETA_DEFINITIVA.md  # Doc completa
│
├── js/
│   ├── main.js                         # Lógica principal + Alertas + Ranking
│   ├── config.js                       # Configuración artistas
│   ├── spotify.js                      # API Spotify
│   ├── dataProcessor.js                # Procesamiento CSV
│   ├── reportComplete.js               # Report Monitoring Completo
│   ├── reportsFinal.js                 # Generación datos monitoring
│   ├── htmlReports.js                  # Report Individual
│   ├── trackboostReportNew.js          # Report TrackBoost
│   ├── historicalData.js               # Baselines históricos
│   ├── datosActualesSpotify.js         # Datos actuales (editable)
│   ├── spotifyDataPersistent.js        # Datos persistentes
│   ├── snapshotsPersistent.js          # Snapshots guardados
│   ├── persistenceManager.js           # Sistema de persistencia
│   ├── charts.js                       # Gráficos
│   └── monitoringHistory.js            # Historial
│
└── data/
    └── meta_ads_nov.csv                # Ejemplo CSV Meta Ads
```

---

## 🚨 ALERTAS AUTOMÁTICAS

### **Tipos de Alertas**

#### **🔴 CRÍTICAS** (Atender inmediatamente)
- CPF ≥ €0.99
- Presupuesto TrackBoost ≥ 100%

#### **⚠️ ATENCIÓN** (Atender pronto)
- CPF €0.70-0.99
- Presupuesto 80-99%
- Coste/Save > €0.90

#### **✅ OPORTUNIDADES** (Mantener)
- CPF < €0.50 con ≥30 followers
- Coste/Save ≤ €0.50 con >20 saves

#### **💡 RECOMENDACIONES** (Mejoras)
- Volumen bajo (<30 followers)

---

## 🏆 RANKING DE PERFORMANCE

Sistema de clasificación automática:

```
🥇 1. Honey       CPF €0.35  ⭐⭐⭐⭐⭐  EXCELENTE
🥈 2. PATO PESCIO CPF €0.42  ⭐⭐⭐⭐⭐  EXCELENTE
🥉 3. Steban      CPF €0.48  ⭐⭐⭐⭐    BUENO
4. Rainbow        CPF €0.55  ⭐⭐⭐⭐    BUENO
5. Alex Kislov    CPF €1.20  ⭐        CRÍTICO
```

**Ordenamiento:** De mejor a peor CPF  
**Medallas:** Top 3 reciben 🥇🥈🥉  
**Recomendaciones:** Automáticas por cada artista

---

## 📊 COMPARACIÓN DE PERIODOS

Compara dos periodos para ver evolución:

### **Métricas Comparadas:**
- 💰 Gasto Total (cambio absoluto + %)
- 👥 Followers Ganados (cambio + %)
- 💎 CPF Promedio (cambio + %)
- 📈 Alcance Total (cambio + %)

### **Insights Automáticos:**
```
✅ CPF mejoró significativamente (-€0.22 / -31.4%)
✅ Excelente crecimiento (+85 followers / +42.5%)
✅ Alcance creció (+35.6%)
✅ Eficiencia mejoró
```

### **Comparación por Artista:**
- ✅ Top 3 mejoras de CPF
- ⚠️ Top 3 requieren atención

---

## 💾 SISTEMA DE PERSISTENCIA

### **Problema Resuelto**
❌ Antes: Datos se perdían al borrar cache  
✅ Ahora: Datos en archivos `.js` permanentes

### **Archivos Persistentes:**
- `js/snapshotsPersistent.js` - Snapshots por periodo
- `js/spotifyDataPersistent.js` - Datos Spotify persistentes
- `js/datosActualesSpotify.js` - Datos actuales editables

### **Snapshots Automáticos:**
- 📅 Día 1 de cada mes
- 📊 Al generar Report Completo
- 💾 Manualmente (tab Snapshots)

---

## 📄 REPORTS DISPONIBLES

### **1. Monitoring Completo**
**Archivo:** `Monitoring_Completo_YYYY-MM-DD.html`

**Contiene:**
- KPIs globales
- Tabla Monitoring (todos los artistas)
- Tabla TrackBoost
- Métricas completas

### **2. Report Individual**
**Archivo:** `Report_[Artista]_YYYY-MM-DD.html`

**Contiene:**
- KPIs del artista
- Métricas Meta Ads (CTR, CPM, Coste/Click)
- Análisis automático
- Proyecciones 7/30/90 días
- **Playlist Health & Growth Analysis**
  - Total tracks
  - Popularidad promedio
  - Distribución (Baja/Media/Alta)
  - Estado de salud
  - Milestones alcanzados
  - Próximo objetivo
  - Recomendaciones específicas

### **3. Report TrackBoost**
**Archivo:** `Report_TrackBoost_YYYY-MM-DD.html`

**Contiene:**
- KPIs globales TrackBoost
- Por cada track:
  - Gasto Total / Este Corte
  - Saves Actuales / Ganados
  - **Coste/Save**
  - Estado presupuesto
  - Presupuesto usado (%)

---

## 🔧 CONFIGURACIÓN TRACKBOOST

### **Datos Requeridos (Manual):**

Para cada track (ej: Steban - Luz):

1. **Track URL Spotify**
   ```
   https://open.spotify.com/track/XXXXXXX
   ```

2. **Saves Actuales**
   ```
   254 (ver en Spotify)
   ```

3. **Saves Corte Anterior**
   ```
   180 (del reporte anterior)
   ```

4. **Streams**
   ```
   12,450 (ver en Spotify for Artists)
   ```

5. **Gasto Total Campaña**
   ```
   260.04 (acumulado histórico)
   ```

6. **Tipo Presupuesto**
   ```
   [ ] Lite (€200)
   [✓] Normal (€500)
   ```

### **Cálculo Automático:**
```
Saves Ganados = 254 - 180 = 74
Coste/Save = Gasto Este Corte / 74
```

---

## 🎓 MEJORES PRÁCTICAS

### **Frecuencia de Uso**

**Diario:**
- ✅ Revisar alertas
- ✅ Monitorear presupuestos TrackBoost

**Semanal:**
- ✅ Generar Report Completo
- ✅ Revisar Ranking
- ✅ Ajustar campañas según alertas

**Mensual:**
- ✅ Comparación de Periodos
- ✅ **Crear Snapshot del día 1** (nuevo baseline)
- ✅ Report Individual por artista
- ✅ Revisar Playlist Health

### **Toma de Decisiones**

**CPF < €0.50:** ✅ Mantener todo  
**CPF €0.50-0.70:** 👍 Optimizar cover  
**CPF €0.70-0.99:** ⚠️ Revisar targeting  
**CPF ≥ €0.99:** 🔴 Pausar y reevaluar

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### **Problema: Datos no se actualizan**
```
1. Ctrl + Shift + R (recarga forzada)
2. Verifica columnas del CSV
3. Presiona "🔄 Actualizar Spotify"
4. Revisa consola (F12)
```

### **Problema: Followers incorrectos en Monitoring**
```
1. Verifica qué snapshot estás usando (📅 Selector)
2. Cambia snapshot base si es necesario
3. Crea snapshot manual para fecha específica
4. Presiona "🔄 Actualizar Spotify" para sincronizar datos
```

### **Problema: Crear snapshot retroactivo**
```
1. Ve a "📊 Monitoring Completo"
2. Selector snapshot → "Crear snapshot manual..."
3. Introduce fecha (ej: 01/12/2024)
4. Confirma → Usa followers actuales como base
5. ✅ Aparece en selector para uso futuro
```

### **Problema: Report con error**
```
1. Verifica CSV cargado
2. Verifica fechas válidas
3. Asegura campañas en rango
4. Revisa consola (F12)
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

### **Archivos de Documentación:**

- 📘 `📘_DOCUMENTACION_COMPLETA_DEFINITIVA.md` - **Guía completa** (30+ páginas)
- ✅ `✅_FASE_1.1_RANKING_COMPLETADO.md` - Ranking de Performance
- ✅ `✅_FASE_1.2_ALERTAS_COMPLETADO.md` - Alertas Automáticas
- ✅ `✅_FASE_1.3_COMPARACION_COMPLETADO.md` - Comparación Periodos
- ✅ `✅_PUNTO_A_LISTO.md` - Report Individual mejorado
- ✅ `✅_PUNTO_B_COMPLETADO.md` - TrackBoost Coste/Save
- ✅ `✅_PUNTO_C_COMPLETADO_FINAL.md` - Followers sincronizados
- ✅ `✅_SISTEMA_SNAPSHOTS_COMPLETO.md` - **Sistema de Snapshots**
- 🔥 `🔥_SISTEMA_PERSISTENTE_FINAL.md` - Sistema de persistencia
- 🎯 `🎯_PUNTO_A_COMPLETADO.md` - Playlist Health Analysis

---

## 🎯 CHANGELOG

### **v5.1 Final** (05 Dic 2025)

#### **✨ Nuevas Funcionalidades:**
- 📅 **Sistema de Snapshots Flexible**
  - Selector de snapshot base visible en Dashboard
  - Snapshots disponibles: 31/10/2024 (baseline) | 01/12/2024 (estimado)
  - Creación de snapshots manuales con fechas personalizadas
  - Indicador visual del snapshot activo
  - Metadata en reports con snapshot usado

#### **🔧 Mejoras:**
- Proyecciones sin costes (solo followers)
- Comparación desde fecha base específica
- Cálculo de increase followers con snapshot correcto
- Selector case-insensitive para ALEX KISLOV / Alex Kislov

---

### **v5.0 Final** (04 Dic 2025)

#### **✨ Nuevas Funcionalidades:**
- 🚨 Panel de Alertas Automáticas (críticas/atención/oportunidades)
- 🏆 Ranking de Performance con estrellas y recomendaciones
- 📊 Comparación Periodo vs Periodo con insights automáticos
- 💾 Sistema de Persistencia (datos no se pierden)
- 📈 Playlist Health & Growth Analysis en reports
- 💎 Coste/Save en TrackBoost
- 📊 Followers sincronizados en todas las tablas
- 🔤 Tablas ordenadas alfabéticamente

#### **🔧 Mejoras:**
- Umbrales correctos (Playlist: <€0.50, TrackBoost: ≤€0.50)
- Match case-insensitive de nombres
- Proyecciones 7/30/90 días mejoradas
- Milestones de followers con badges
- Análisis automático de Meta Ads (CTR, CPM, Conversión)
- Recomendaciones sin "escalar presupuesto"

#### **🐛 Correcciones:**
- Followers actualizados en Monitoring
- CPF calculado correctamente (€ gastado / increase followers)
- Coste/Save con saves ganados (no totales)
- Gasto Este Corte del CSV (no manual)
- Estado SOBREPASADO cuando ≥100%

---

## 🎉 ESTADO DEL PROYECTO

**✅ PROYECTO 100% COMPLETADO**

Ver resumen completo en: **`🎉_PROYECTO_COMPLETADO_v5.1.md`**

**15 Tareas Implementadas:**
- Sistema persistente (cache-proof)
- Reports profesionales (Individual + TrackBoost + Monitoring)
- Dashboard completo (Alertas + Ranking + Comparación)
- **Sistema de Snapshots Flexible**
- Documentación completa (18+ archivos)

**Estado:** ✅ Producción  
**Calidad:** ⭐⭐⭐⭐⭐ Profesional  
**Tiempo Total:** ~16 horas

---

## 🚀 CARACTERÍSTICAS DESTACADAS

### **🎨 Interfaz Moderna**
- Diseño responsive
- Colores semánticos (verde/azul/amarillo/rojo)
- Iconos y badges visuales
- Gráficos interactivos Chart.js

### **🤖 Automatización**
- Alertas generadas automáticamente
- Ranking actualizado en tiempo real
- Insights de comparación automáticos
- Recomendaciones específicas por artista

### **📊 Análisis Profundo**
- 12+ métricas por artista
- Proyecciones futuras
- Análisis de tendencias
- Playlist Health completo

### **💾 Sin Pérdida de Datos**
- Sistema de persistencia robusto
- Snapshots automáticos
- Archivos descargables
- Backup manual disponible

---

## 📞 SOPORTE

**Documentación Completa:**  
Ver `📘_DOCUMENTACION_COMPLETA_DEFINITIVA.md`

**Solución de Problemas:**  
Sección detallada en documentación completa

**Consola de Debugging:**  
Presiona F12 para ver logs y errores

---

## 🎊 ESTADO DEL PROYECTO

✅ **Sistema Completo y Funcional**

**Tareas Completadas:**
- [x] Sistema de persistencia (cache-proof)
- [x] Report Individual con Playlist Health
- [x] TrackBoost con Coste/Save
- [x] Followers sincronizados
- [x] Ranking de Performance
- [x] Alertas Automáticas
- [x] Comparación de Periodos
- [x] Sistema de Snapshots Flexible
- [x] Sistema de Autenticación
- [x] Documentación Completa
- [x] **Publicado en GitHub Pages**

**Estado:** 🟢 Producción en Vivo  
**Versión:** v5.3 Final (con Auth)  
**URL:** https://yadira-sys.github.io/elixir-monitoring  
**Última Actualización:** 17 Diciembre 2025

---

## 🏆 EQUIPO

**Desarrollado para:** ELIXIR Marketing  
**Tipo:** Dashboard de Marketing Musical  
**Tecnologías:** HTML5, CSS3, JavaScript (Vanilla), Chart.js  
**Integración:** Meta Ads CSV + Spotify API  
**Hosting:** GitHub Pages

---

**🎵 ¡Dashboard listo para usar! Disfruta del análisis profesional de tus campañas musicales.**
