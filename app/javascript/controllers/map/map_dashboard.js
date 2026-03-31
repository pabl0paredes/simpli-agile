import { PALETTES } from "controllers/map/palettes"

export class MapDashboard {
  constructor(controller) {
    this.c = controller
  }

  toggle() {
    if (!this.c.hasDashboardPanelTarget) return
    this.c.dashboardPanelTarget.hidden = !this.c.dashboardPanelTarget.hidden
    if (!this.c.dashboardPanelTarget.hidden) this.render()
  }

  hide() {
    if (this.c.hasDashboardPanelTarget) this.c.dashboardPanelTarget.hidden = true
  }

  render() {
    if (!this.c.hasDashboardChartTarget) return

    const features = this.c._cellsFeatures || []

    if (!features.length) {
      this.c.dashboardChartTarget.innerHTML =
        `<p class="map-dashboard__empty">Sin datos cargados.</p>`
      return
    }

    // Contar celdas por clase
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    features.forEach(f => {
      const k = f.properties?.class ?? 0
      counts[k] = (counts[k] || 0) + 1
    })

    const total = features.length
    const maxCount = Math.max(...Object.values(counts))

    const colors = PALETTES[this.c._palette || "blue"]

    const isAccessibility = this.c._selectedLayerType === "accessibility"
    const isDelta = this.c._compareMode === "delta"
    const breaks = (this.c._cellsBreaks || []).map(Number)

    const label = (k) => {
      if (isAccessibility) {
        return { 1: "Muy baja", 2: "Baja", 3: "Media", 4: "Alta", 5: "Muy alta" }[k] || "-"
      }
      if (k === 0) return isDelta ? "Sin cambio" : "Sin datos"
      if (breaks.length < k + 1) return `Clase ${k}`
      return `${Math.round(breaks[k - 1]).toLocaleString("es-CL")} – ${Math.round(breaks[k]).toLocaleString("es-CL")}`
    }

    const classes = isAccessibility ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5]

    const rows = classes.map(k => {
      const count = counts[k] || 0
      const pct = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 2 : 0) : 0
      const color = colors[k]
      return `
        <div class="map-dashboard__row">
          <div class="map-dashboard__row-top">
            <span class="map-dashboard__dot" style="background:${color}"></span>
            <span class="map-dashboard__lbl">${label(k)}</span>
            <span class="map-dashboard__cnt">${count.toLocaleString("es-CL")}</span>
          </div>
          <div class="map-dashboard__track">
            <div class="map-dashboard__bar" style="width:${pct}%;background:${color}"></div>
          </div>
        </div>`
    }).join("")

    this.c.dashboardChartTarget.innerHTML = rows +
      `<div class="map-dashboard__total">${total.toLocaleString("es-CL")} celdas en total</div>`
  }
}
