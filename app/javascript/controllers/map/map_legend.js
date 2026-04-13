import { PALETTES } from "controllers/map/palettes"

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

  show() {
    if (this.c.hasLegendPanelTarget) this.c.legendPanelTarget.hidden = false
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

    const colorsByClass = PALETTES[this.c._palette || "blue"]

    const isAccessibility = (this.c._selectedLayerType === "accessibility")
    const isDelta = (this.c._compareMode === "delta")

    if (isAccessibility) {
      for (let i = 1; i <= 5; i++) {
        rows.push({ klass: i, label: this.accessibilityLabelForClass(i) })
      }
    } else {
      rows.push({ klass: 0, label: isDelta ? "Sin cambio / 0" : "= 0" })

      for (let i = 1; i <= k; i++) {
        const lo = breaks[i - 1]
        const hi = breaks[i]
        rows.push({
          klass: i,
          label: `${Math.round(lo).toLocaleString("es-CL")} – ${Math.round(hi).toLocaleString("es-CL")}`
        })
      }
    }

    const boundaryRows = `
      <div class="map-legend__divider"></div>
      <div class="map-legend__row map-legend__row--static">
        <span class="map-legend__line-swatch map-legend__line-swatch--dashed"></span>
        <span class="map-legend__label">Límite Comunal</span>
      </div>
      ${this.c._hasStudyArea ? `
      <div class="map-legend__row map-legend__row--static">
        <span class="map-legend__line-swatch map-legend__line-swatch--study-area"></span>
        <span class="map-legend__label">Área de Estudio</span>
      </div>` : ""}
    `

    this.c.legendItemsTarget.innerHTML = rows.map(r => {
      const color = colorsByClass[r.klass] || "#000"
      return `
        <div class="map-legend__row" data-klass="${r.klass}">
          <span class="map-legend__swatch" style="background:${color}"></span>
          <span class="map-legend__label">${r.label}</span>
        </div>
      `
    }).join("") + boundaryRows

    this.bindHoverOnce()
  }

  accessibilityLabelForClass(klass) {
    const labels = { 1: "Muy baja", 2: "Baja", 3: "Media", 4: "Alta", 5: "Muy alta" }
    return labels[klass] || "-"
  }

  // applyClassFocus(klass) {
  //   if (!this.c.map?.getLayer("cells-fill")) return
  //   const k = Number(klass)
  //   this.c._legendFocusClass = k

  //   this.c.map.setPaintProperty("cells-fill", "fill-opacity", this.focusedFillOpacityExpr(k))
  // }

  applyClassFocus(klass) {
    const k = Number(klass)
    this.c._legendFocusClass = k
    this.applyOpacityToActiveMaps(this.focusedFillOpacityExpr(k))
  }

  // clearClassFocus() {
  //   if (!this.c.map?.getLayer("cells-fill")) return
  //   this.c._legendFocusClass = null

  //   // ✅ restaurar la regla base (class 0 transparente)
  //   this.c.map.setPaintProperty("cells-fill", "fill-opacity", this.baseFillOpacityExpr())
  // }

  clearClassFocus() {
    this.c._legendFocusClass = null
    this.applyOpacityToActiveMaps(this.baseFillOpacityExpr())
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

  baseFillOpacityExpr() {
    // class 0 siempre transparente
    return [
      "case",
      ["==", ["get", "class"], 0],
      0,
      0.75
    ]
  }

  focusedFillOpacityExpr(k) {
    // class 0 siempre transparente, aunque sea el foco
    return [
      "case",
      ["==", ["get", "class"], 0],
      0,
      ["==", ["get", "class"], k],
      0.80,
      0
    ]
  }

  activeMaps() {
    const maps = []

    if (this.c.map) maps.push(this.c.map)

    if (this.c.compareSlider?.enabled) {
      if (this.c.compareSlider.mapLeft) maps.push(this.c.compareSlider.mapLeft)
      if (this.c.compareSlider.mapRight) maps.push(this.c.compareSlider.mapRight)
    }

    if (this.c.compareSplit?.enabled) {
      if (this.c.compareSplit.mapTop) maps.push(this.c.compareSplit.mapTop)
      if (this.c.compareSplit.mapBottom) maps.push(this.c.compareSplit.mapBottom)
    }

    return maps
  }

  applyOpacityToActiveMaps(expr) {
    this.activeMaps().forEach((map) => {
      if (!map?.getLayer("cells-fill")) return
      map.setPaintProperty("cells-fill", "fill-opacity", expr)
    })
  }
}
