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
      this.render()
      this.fetchCo2()
    }
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

    if (this.c._uiMode === "comparador") {
      const aId = this.c._scenarioAId
      const bId = this.c._scenarioBId
      if (!aId || !bId) return
      Promise.all([
        fetch(co2Url(aId), { headers: { "X-CSRF-Token": csrf } }).then(r => r.json()),
        fetch(co2Url(bId), { headers: { "X-CSRF-Token": csrf } }).then(r => r.json())
      ])
        .then(([dataA, dataB]) => this._renderCo2Compare(dataA.co2_tons, dataB.co2_tons))
        .catch(() => {})
    } else {
      const scenarioId = this.c._selectedScenarioId
      if (!scenarioId) return
      fetch(co2Url(scenarioId), { headers: { "X-CSRF-Token": csrf } })
        .then(r => r.json())
        .then(data => this._renderCo2Single(data.co2_tons))
        .catch(() => {})
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
      <div class="map-dashboard__pie-wrap">
        <div class="map-dashboard__pie" style="background:conic-gradient(${gradientParts})">
          <div class="map-dashboard__pie-hole"></div>
        </div>
      </div>
      ${legendRows}
      <div class="map-dashboard__total">${Math.round(total).toLocaleString("es-CL")} viviendas en total</div>
    `
  }
}
