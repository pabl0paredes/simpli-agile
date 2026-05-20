import { PALETTES } from "controllers/map/palettes"
import { trackEvent } from "controllers/sidebar/api"

const ACC_LABELS = { 1: "Muy baja", 2: "Baja", 3: "Media", 4: "Alta", 5: "Muy alta" }

export class MapDashboard {
  constructor(controller) {
    this.c = controller
  }

  toggle() {
    if (!this.c.hasDashboardPanelTarget) return
    const opening = this.c.dashboardPanelTarget.hidden
    this.c.dashboardPanelTarget.hidden = !opening
    if (opening) {
      this._showBlur()
      this._showCo2Placeholder()
      this.render()
      this.fetchCo2()
    } else {
      trackEvent("indicators_closed", {
        municipality_code: this.c._selectedMunicipalityCode,
        scenario_id: this.c._selectedScenarioId
      })
    }
  }

  open() {
    if (!this.c.hasDashboardPanelTarget) return
    this.c.dashboardPanelTarget.hidden = false
    this._showBlur()
    this._showCo2Placeholder()
    this.render()
    this.fetchCo2()
  }

  _showBlur() {
    const panel = this.c.dashboardPanelTarget
    panel.classList.add("is-blurred")
    const overlay = panel.querySelector(".map-dashboard__reveal-overlay")
    if (overlay) overlay.hidden = false
  }

  reveal() {
    const panel = this.c.dashboardPanelTarget
    panel.classList.remove("is-blurred")
    const overlay = panel.querySelector(".map-dashboard__reveal-overlay")
    if (overlay) overlay.hidden = true
    trackEvent("see_indicators", {
      municipality_code: this.c._selectedMunicipalityCode,
      scenario_id: this.c._selectedScenarioId
    })
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
          this._renderHistogramCompare(dataA.trip_histogram, dataB.trip_histogram)
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
      if (this.c.hasDashboardTitleTarget) this.c.dashboardTitleTarget.hidden = true
      this.c.dashboardChartTarget.innerHTML = ""
      return
    }

    if (this.c.hasDashboardTitleTarget) {
      this.c.dashboardTitleTarget.textContent = "Viviendas por accesibilidad"
      this.c.dashboardTitleTarget.hidden = false
    }

    if (this.c._uiMode === "comparador" && this.c._scenarioAId && this.c._scenarioBId) {
      this._fetchAndRenderPieCompare()
      return
    }

    const features = this.c._cellsFeatures || []
    if (!features.length) {
      this.c.dashboardChartTarget.innerHTML = ""
      return
    }

    const unitsByClass = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    features.forEach(f => {
      const k = f.properties?.class ?? 0
      if (k >= 1 && k <= 5) unitsByClass[k] += f.properties?.h_units ?? 0
    })

    const total = Object.values(unitsByClass).reduce((a, b) => a + b, 0)

    if (total === 0) {
      this.c.dashboardChartTarget.innerHTML =
        `<p class="map-dashboard__empty">Sin datos residenciales.</p>`
      return
    }

    const colors = PALETTES[this.c._palette || "blue"]

    let cum = 0
    const gradientParts = [1, 2, 3, 4, 5].map(k => {
      const pct = unitsByClass[k] / total * 100
      const start = cum; cum += pct
      return `${colors[k]} ${start.toFixed(2)}% ${cum.toFixed(2)}%`
    }).join(", ")

    const legendRows = [5, 4, 3, 2, 1].map(k => `
      <div class="map-dashboard__row">
        <div class="map-dashboard__row-top">
          <span class="map-dashboard__dot" style="background:${colors[k]}"></span>
          <span class="map-dashboard__lbl">${ACC_LABELS[k]}</span>
          <span class="map-dashboard__cnt">${Math.round(unitsByClass[k]).toLocaleString("es-CL")}</span>
        </div>
      </div>`).join("")

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

  async _fetchAndRenderPieCompare() {
    const el      = this.c.dashboardChartTarget
    const munCode = this.c._selectedMunicipalityCode
    const oppCode = this.c._selectedOpportunityCode
    const mode    = this.c._selectedAccessibilityMode
    const accType = this.c._selectedAccessibilityType || "surface"
    const aId     = this.c._scenarioAId
    const bId     = this.c._scenarioBId

    if (!munCode || !oppCode || !mode) { el.innerHTML = ""; return }

    el.innerHTML = `<p class="map-dashboard__empty">Cargando...</p>`

    const url = (scenarioId) =>
      `/cells/accessibility?municipality_code=${encodeURIComponent(munCode)}` +
      `&mode=${encodeURIComponent(mode)}` +
      `&opportunity_code=${encodeURIComponent(oppCode)}` +
      `&scenario_id=${encodeURIComponent(scenarioId)}` +
      `&accessibility_type=${encodeURIComponent(accType)}`

    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.content
      const fetchFc = (id) => fetch(url(id), { headers: { "X-CSRF-Token": csrf } }).then(r => r.json())
      const [fcA, fcB] = await Promise.all([fetchFc(aId), fetchFc(bId)])
      this._renderPieCompare(fcA.features || [], fcB.features || [])
    } catch (err) {
      console.error("[Dashboard compare pie]", err)
      el.innerHTML = ""
    }
  }

  _renderPieCompare(featuresA, featuresB) {
    const el = this.c.dashboardChartTarget
    if (!el) return

    const sumByClass = (features) => {
      const m = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      features.forEach(f => {
        const k = f.properties?.class ?? 0
        if (k >= 1 && k <= 5) m[k] += f.properties?.h_units ?? 0
      })
      return m
    }

    const unitsA = sumByClass(featuresA)
    const unitsB = sumByClass(featuresB)
    const totalA = Object.values(unitsA).reduce((a, b) => a + b, 0)
    const totalB = Object.values(unitsB).reduce((a, b) => a + b, 0)
    const colors = PALETTES[this.c._palette || "blue"]

    const makePieGradient = (unitsByClass, total) => {
      if (total === 0) return "#e4e4e7"
      let cum = 0
      return "conic-gradient(" + [1, 2, 3, 4, 5].map(k => {
        const pct = unitsByClass[k] / total * 100
        const start = cum; cum += pct
        return `${colors[k]} ${start.toFixed(2)}% ${cum.toFixed(2)}%`
      }).join(", ") + ")"
    }

    const legendRows = [5, 4, 3, 2, 1].map(k => {
      const a     = Math.round(unitsA[k])
      const b     = Math.round(unitsB[k])
      const delta = b - a
      const deltaHtml = delta === 0 ? `<span class="pie-cmp__delta"></span>` :
        `<span class="pie-cmp__delta ${delta > 0 ? "pie-cmp__delta--pos" : "pie-cmp__delta--neg"}">
          ${delta > 0 ? "+" : ""}${delta.toLocaleString("es-CL")}
        </span>`
      return `
        <div class="pie-cmp__row">
          <span class="pie-cmp__dot" style="background:${colors[k]}"></span>
          <span class="pie-cmp__lbl">${ACC_LABELS[k]}</span>
          <span class="pie-cmp__val">${a.toLocaleString("es-CL")}</span>
          <span class="pie-cmp__val">${b.toLocaleString("es-CL")}</span>
          ${deltaHtml}
        </div>`
    }).join("")

    el.innerHTML = `
      <div class="pie-cmp">
        <div class="pie-cmp__pies">
          <div class="pie-cmp__pie-col">
            <div class="pie-cmp__pie" style="background:${makePieGradient(unitsA, totalA)}">
              <div class="pie-cmp__hole"></div>
            </div>
            <div class="pie-cmp__pie-lbl">Esc. A</div>
          </div>
          <div class="pie-cmp__pie-col">
            <div class="pie-cmp__pie" style="background:${makePieGradient(unitsB, totalB)}">
              <div class="pie-cmp__hole"></div>
            </div>
            <div class="pie-cmp__pie-lbl">Esc. B</div>
          </div>
        </div>
        <div class="pie-cmp__legend">
          <div class="pie-cmp__legend-hdr">
            <span></span><span></span>
            <span class="pie-cmp__col-hdr">Esc. A</span>
            <span class="pie-cmp__col-hdr">Esc. B</span>
            <span></span>
          </div>
          ${legendRows}
          <div class="pie-cmp__row pie-cmp__row--total">
            <span></span>
            <span class="pie-cmp__lbl">Total</span>
            <span class="pie-cmp__val">${Math.round(totalA).toLocaleString("es-CL")}</span>
            <span class="pie-cmp__val">${Math.round(totalB).toLocaleString("es-CL")}</span>
            <span></span>
          </div>
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

  _renderHistogramCompare(histA, histB) {
    if (!this.c.hasDashboardHistogramTarget) return
    const el = this.c.dashboardHistogramTarget

    const isEmpty = (h) => !h || !h.length
    if (isEmpty(histA) && isEmpty(histB)) { el.innerHTML = ""; return }

    const mapA = {}; (histA || []).forEach(d => { mapA[d.bin_km] = d.trips })
    const mapB = {}; (histB || []).forEach(d => { mapB[d.bin_km] = d.trips })

    const allKeys = new Set([...Object.keys(mapA), ...Object.keys(mapB)].map(Number))
    const maxBin  = Math.max(...allKeys, 0)
    const bins    = Array.from({ length: maxBin + 1 }, (_, i) => i)

    const maxTrips = Math.max(...bins.map(i => Math.max(mapA[i] || 0, mapB[i] || 0)), 1)

    const W = 220, H = 90, padL = 6, padR = 4, padT = 4, padB = 18
    const innerW = W - padL - padR
    const innerH = H - padT - padB
    const slotW  = innerW / bins.length
    const barW   = Math.max(1, slotW - 1)

    const COLOR_A = "#3b82f6"
    const COLOR_B = "#8b5cf6"

    const makeBars = (map, color) => bins.map((bin, i) => {
      const bh = ((map[bin] || 0) / maxTrips) * innerH
      const x  = padL + i * slotW
      const y  = padT + innerH - bh
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="${color}" opacity="0.7" rx="1"/>`
    }).join("")

    const step   = Math.max(1, Math.ceil(bins.length / 7))
    const labels = bins.map((bin, i) => {
      if (i % step !== 0 && i !== bins.length - 1) return ""
      const x = padL + i * slotW + slotW / 2
      return `<text x="${x.toFixed(1)}" y="${H - 3}" font-size="7.5" fill="#9ca3af" text-anchor="middle">${bin}k</text>`
    }).join("")

    el.innerHTML = `
      <svg width="${W}" height="${H}" style="display:block;overflow:visible">
        <g class="hist-series hist-series--a">${makeBars(mapA, COLOR_A)}</g>
        <g class="hist-series hist-series--b">${makeBars(mapB, COLOR_B)}</g>
        ${labels}
      </svg>
      <div class="hist-compare-btns">
        <button class="hist-compare-btn" type="button" data-scenario="a">
          <span class="hist-compare-dot hist-compare-dot--a"></span>Esc. A
        </button>
        <button class="hist-compare-btn" type="button" data-scenario="b">
          <span class="hist-compare-dot hist-compare-dot--b"></span>Esc. B
        </button>
      </div>
    `

    const seriesA = el.querySelector(".hist-series--a")
    const seriesB = el.querySelector(".hist-series--b")
    const btnA    = el.querySelector('[data-scenario="a"]')
    const btnB    = el.querySelector('[data-scenario="b"]')

    const showBoth = () => {
      seriesA.style.opacity = "1"
      seriesB.style.opacity = "1"
      btnA.classList.remove("is-active")
      btnB.classList.remove("is-active")
    }
    btnA.addEventListener("mouseenter", () => {
      seriesA.style.opacity = "1"; seriesB.style.opacity = "0.12"
      btnA.classList.add("is-active"); btnB.classList.remove("is-active")
    })
    btnA.addEventListener("mouseleave", showBoth)
    btnB.addEventListener("mouseenter", () => {
      seriesA.style.opacity = "0.12"; seriesB.style.opacity = "1"
      btnA.classList.remove("is-active"); btnB.classList.add("is-active")
    })
    btnB.addEventListener("mouseleave", showBoth)
  }
}
