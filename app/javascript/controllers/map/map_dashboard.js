import { PALETTES } from "controllers/map/palettes"

const ACC_LABELS = { 1: "Muy baja", 2: "Baja", 3: "Media", 4: "Alta", 5: "Muy alta" }

export class MapDashboard {
  constructor(controller) {
    this.c = controller
  }

  toggle() {
    if (!this.c.hasDashboardPanelTarget) return
    this.c.dashboardPanelTarget.hidden = !this.c.dashboardPanelTarget.hidden
    if (!this.c.dashboardPanelTarget.hidden) {
      this._showCo2Placeholder()
      this.render()
      this.fetchCo2()
    }
  }

  open() {
    if (!this.c.hasDashboardPanelTarget) return
    this.c.dashboardPanelTarget.hidden = false
    this._showCo2Placeholder()
    this.render()
    this.fetchCo2()
  }

  _showCo2Placeholder() {
    if (!this.c.hasDashboardCo2Target) return
    this.c.dashboardCo2Target.hidden = false
    if (this.c.hasDashboardCo2SingleTarget) this.c.dashboardCo2SingleTarget.hidden = false
    if (this.c.hasDashboardCo2CompareTarget) this.c.dashboardCo2CompareTarget.hidden = true
    if (this.c.hasDashboardAvgDistSingleTarget) this.c.dashboardAvgDistSingleTarget.hidden = false
    if (this.c.hasDashboardAvgDistCompareTarget) this.c.dashboardAvgDistCompareTarget.hidden = true
  }

  hide() {
    if (this.c.hasDashboardPanelTarget) this.c.dashboardPanelTarget.hidden = true
  }

  // ── CO2 ────────────────────────────────────────────────────────────────────

  fetchCo2() {
    const munCode = this.c._selectedMunicipalityCode
    if (!munCode) return

    const csrf   = document.querySelector('meta[name="csrf-token"]')?.content
    const co2Url = (scenarioId) =>
      `/municipalities/co2?municipality_code=${munCode}&scenario_id=${scenarioId}`

    const fetchJson = (url) =>
      fetch(url, { headers: { "X-CSRF-Token": csrf } })
        .then(r => {
          if (!r.ok) throw new Error(`CO2 fetch failed: ${r.status} ${r.statusText}`)
          return r.json()
        })

    if (this.c._uiMode === "comparador") {
      const aId = this.c._scenarioAId
      const bId = this.c._scenarioBId
      if (!aId || !bId) return
      Promise.all([fetchJson(co2Url(aId)), fetchJson(co2Url(bId))])
        .then(([dataA, dataB]) => {
          this._renderCo2Compare(dataA.co2_tons, dataB.co2_tons)
          this._renderAvgDistCompare(dataA.avg_distance_km, dataB.avg_distance_km)
          this._renderHistogram(null)
        })
        .catch(err => console.error("[Dashboard]", err))
    } else {
      const scenarioId = this.c._selectedScenarioId
      if (!scenarioId) return
      fetchJson(co2Url(scenarioId))
        .then(data => {
          this._renderCo2Single(data.co2_tons)
          this._renderAvgDistSingle(data.avg_distance_km)
          this._renderHistogram(data.trip_histogram)
        })
        .catch(err => console.error("[Dashboard]", err))
    }
  }

  _renderCo2Single(co2Tons) {
    if (!this.c.hasDashboardCo2Target) return
    if (co2Tons == null) { this.c.dashboardCo2Target.hidden = true; return }
    this.c.dashboardCo2Target.hidden = false
    if (this.c.hasDashboardCo2SingleTarget)  this.c.dashboardCo2SingleTarget.hidden  = false
    if (this.c.hasDashboardCo2CompareTarget) this.c.dashboardCo2CompareTarget.hidden = true
    if (this.c.hasDashboardCo2ValueTarget) {
      this.c.dashboardCo2ValueTarget.textContent =
        Number(co2Tons).toLocaleString("es-CL", { maximumFractionDigits: 1 })
    }
  }

  _renderCo2Compare(co2TonsA, co2TonsB) {
    if (!this.c.hasDashboardCo2Target) return
    if (co2TonsA == null && co2TonsB == null) { this.c.dashboardCo2Target.hidden = true; return }
    this.c.dashboardCo2Target.hidden = false
    if (this.c.hasDashboardCo2SingleTarget)  this.c.dashboardCo2SingleTarget.hidden  = true
    if (this.c.hasDashboardCo2CompareTarget) this.c.dashboardCo2CompareTarget.hidden = false
    if (this.c.hasDashboardCo2ValueATarget) {
      this.c.dashboardCo2ValueATarget.textContent =
        co2TonsA != null ? Number(co2TonsA).toLocaleString("es-CL", { maximumFractionDigits: 1 }) : "—"
    }
    if (this.c.hasDashboardCo2ValueBTarget) {
      this.c.dashboardCo2ValueBTarget.textContent =
        co2TonsB != null ? Number(co2TonsB).toLocaleString("es-CL", { maximumFractionDigits: 1 }) : "—"
    }
  }

  _renderAvgDistSingle(avgDistKm) {
    if (!this.c.hasDashboardAvgDistSingleTarget) return
    if (this.c.hasDashboardAvgDistCompareTarget) this.c.dashboardAvgDistCompareTarget.hidden = true
    this.c.dashboardAvgDistSingleTarget.hidden = false
    if (this.c.hasDashboardAvgDistValueTarget) {
      this.c.dashboardAvgDistValueTarget.textContent =
        avgDistKm != null ? Number(avgDistKm).toLocaleString("es-CL", { maximumFractionDigits: 1 }) : "—"
    }
  }

  _renderAvgDistCompare(avgDistKmA, avgDistKmB) {
    if (!this.c.hasDashboardAvgDistCompareTarget) return
    if (this.c.hasDashboardAvgDistSingleTarget) this.c.dashboardAvgDistSingleTarget.hidden = true
    this.c.dashboardAvgDistCompareTarget.hidden = false
    if (this.c.hasDashboardAvgDistValueATarget) {
      this.c.dashboardAvgDistValueATarget.textContent =
        avgDistKmA != null ? Number(avgDistKmA).toLocaleString("es-CL", { maximumFractionDigits: 1 }) : "—"
    }
    if (this.c.hasDashboardAvgDistValueBTarget) {
      this.c.dashboardAvgDistValueBTarget.textContent =
        avgDistKmB != null ? Number(avgDistKmB).toLocaleString("es-CL", { maximumFractionDigits: 1 }) : "—"
    }
  }

  // ── Chart ──────────────────────────────────────────────────────────────────

  render() {
    if (!this.c.hasDashboardChartTarget) return

    const isAccessibility = this.c._selectedLayerType === "accessibility"

    if (!isAccessibility) {
      // No chart for other layer types
      if (this.c.hasDashboardTitleTarget) this.c.dashboardTitleTarget.hidden = true
      this.c.dashboardChartTarget.innerHTML = ""
      return
    }

    const features = this.c._cellsFeatures || []
    if (!features.length) {
      if (this.c.hasDashboardTitleTarget) this.c.dashboardTitleTarget.hidden = true
      this.c.dashboardChartTarget.innerHTML = ""
      return
    }

    // Sum h_units per accessibility class (1-5)
    const unitsByClass = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    features.forEach(f => {
      const k = f.properties?.class ?? 0
      if (k >= 1 && k <= 5) unitsByClass[k] += f.properties?.h_units ?? 0
    })

    const total = Object.values(unitsByClass).reduce((a, b) => a + b, 0)

    if (this.c.hasDashboardTitleTarget) {
      this.c.dashboardTitleTarget.textContent = "Viviendas por accesibilidad"
      this.c.dashboardTitleTarget.hidden = false
    }

    if (total === 0) {
      this.c.dashboardChartTarget.innerHTML =
        `<p class="map-dashboard__empty">Sin datos residenciales.</p>`
      return
    }

    const colors  = PALETTES[this.c._palette || "blue"]

    // Build conic-gradient (class 1 = lowest = innermost color first)
    let cum = 0
    const gradientParts = [1, 2, 3, 4, 5].map(k => {
      const pct   = unitsByClass[k] / total * 100
      const start = cum
      cum += pct
      return `${colors[k]} ${start.toFixed(2)}% ${cum.toFixed(2)}%`
    }).join(", ")

    // Legend rows, highest class first
    const legendRows = [5, 4, 3, 2, 1].map(k => {
      const units = unitsByClass[k]
      return `
        <div class="map-dashboard__row">
          <div class="map-dashboard__row-top">
            <span class="map-dashboard__dot" style="background:${colors[k]}"></span>
            <span class="map-dashboard__lbl">${ACC_LABELS[k]}</span>
            <span class="map-dashboard__cnt">${Math.round(units).toLocaleString("es-CL")}</span>
          </div>
        </div>`
    }).join("")

    this.c.dashboardChartTarget.innerHTML = `
      <div class="map-dashboard__chart-layout">
        <div class="map-dashboard__pie-wrap">
          <div class="map-dashboard__pie" style="background:conic-gradient(${gradientParts})">
            <div class="map-dashboard__pie-hole"></div>
          </div>
        </div>
        <div class="map-dashboard__chart-legend">
          ${legendRows}
          <div class="map-dashboard__total">${Math.round(total).toLocaleString("es-CL")} viviendas en total</div>
        </div>
      </div>
    `
  }

  _renderHistogram(histData) {
    if (!this.c.hasDashboardHistogramTarget) return
    const el = this.c.dashboardHistogramTarget

    if (!histData || !histData.length) { el.innerHTML = ""; return }

    const maxTrips = Math.max(...histData.map(d => d.trips))
    if (maxTrips === 0) { el.innerHTML = ""; return }

    const nBins  = histData.length
    const W      = 220
    const H      = 90
    const padL   = 6
    const padR   = 4
    const padT   = 4
    const padB   = 18
    const innerW = W - padL - padR
    const innerH = H - padT - padB
    const slotW  = innerW / nBins
    const barW   = Math.max(1, slotW - 1)

    const bars = histData.map((d, i) => {
      const bh = (d.trips / maxTrips) * innerH
      const x  = padL + i * slotW
      const y  = padT + innerH - bh
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="#3b82f6" opacity="0.75" rx="1"/>`
    }).join("")

    const step   = Math.max(1, Math.ceil(nBins / 7))
    const labels = histData
      .map((d, i) => {
        if (i % step !== 0 && i !== nBins - 1) return ""
        const x = padL + i * slotW + slotW / 2
        return `<text x="${x.toFixed(1)}" y="${H - 3}" font-size="7.5" fill="#9ca3af" text-anchor="middle">${d.bin_km}k</text>`
      }).join("")

    el.innerHTML = `<svg width="${W}" height="${H}" style="display:block;overflow:visible">${bars}${labels}</svg>`
  }
}
