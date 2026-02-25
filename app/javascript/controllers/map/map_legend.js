export class MapLegend {
  constructor(controller) {
    this.c = controller
  }

  toggle = () => {
    if (!this.c.hasLegendPanelTarget) return
    this.c.legendPanelTarget.hidden = !this.c.legendPanelTarget.hidden
  }

  hide() {
    if (this.c.hasLegendPanelTarget) this.c.legendPanelTarget.hidden = true
  }

  showButtonIfNeeded() {
    const shouldShow = !!(this.c._cellsBreaks && this.c._cellsBreaks.length >= 2)
    if (this.c.hasLegendBtnTarget) this.c.legendBtnTarget.hidden = !shouldShow
    if (!shouldShow) this.hide()
  }

  render() {
    if (!this.c.hasLegendItemsTarget) return
    if (!this.c._cellsBreaks || this.c._cellsBreaks.length < 2) return

    const breaks = this.c._cellsBreaks.map(Number)
    const k = breaks.length - 1
    const rows = []

    const colorsByClass = {
      0: "#e5e7eb",
      1: "#dbeafe",
      2: "#93c5fd",
      3: "#3b82f6",
      4: "#1d4ed8",
      5: "#0b3aa4"
    }

    const isAccessibility = (this.c._selectedLayerType === "accessibility")
    const isDelta = (this.c._selectedLayerType === "delta")

    if (isAccessibility) {
      for (let i = 1; i <= 5; i++) {
        rows.push({ klass: i, label: this.accessibilityLabelForClass(i) })
      }
    } else {
      rows.push({ klass: 0, label: isDelta ? "Sin cambio / 0" : "Sin datos / 0" })

      for (let i = 1; i <= k; i++) {
        const lo = breaks[i - 1]
        const hi = breaks[i]
        rows.push({
          klass: i,
          label: `${Math.round(lo).toLocaleString("es-CL")} – ${Math.round(hi).toLocaleString("es-CL")}`
        })
      }
    }

    this.c.legendItemsTarget.innerHTML = rows.map(r => {
      const color = colorsByClass[r.klass] || "#000"
      return `
        <div class="map-legend__row" data-klass="${r.klass}">
          <span class="map-legend__swatch" style="background:${color}"></span>
          <span class="map-legend__label">${r.label}</span>
        </div>
      `
    }).join("")

    this.bindHoverOnce()
  }

  accessibilityLabelForClass(klass) {
    const labels = { 1: "Muy baja", 2: "Baja", 3: "Media", 4: "Alta", 5: "Muy alta" }
    return labels[klass] || "-"
  }

  applyClassFocus(klass) {
    if (!this.c.map?.getLayer("cells-fill")) return
    const k = Number(klass)
    this.c._legendFocusClass = k

    this.c.map.setPaintProperty("cells-fill", "fill-opacity", [
      "case",
      ["==", ["get", "class"], k],
      0.80,
      0
    ])
  }

  clearClassFocus() {
    if (!this.c.map?.getLayer("cells-fill")) return
    this.c._legendFocusClass = null
    this.c.map.setPaintProperty("cells-fill", "fill-opacity", 0.75)
  }

  bindHoverOnce() {
    if (!this.c.hasLegendItemsTarget) return
    if (this.c._legendHoverBound) return
    this.c._legendHoverBound = true

    this.c.legendItemsTarget.addEventListener("mouseover", (e) => {
      const row = e.target.closest?.(".map-legend__row")
      if (!row) return
      const klass = row.dataset.klass
      if (!klass) return
      this.applyClassFocus(klass)
    })

    this.c.legendItemsTarget.addEventListener("mouseout", (e) => {
      const stillInside = this.c.legendItemsTarget.contains(e.relatedTarget)
      if (!stillInside) this.clearClassFocus()
    })
  }
}
