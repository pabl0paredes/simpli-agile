export class MapCompareSlider {
  constructor(controller) {
    this.c = controller
    this.enabled = false
    this.compare = null
    this.mapLeft = null   // B
    this.mapRight = null  // A
    this._syncing = false
  }

  setEnabled(on) {
    if (on === this.enabled) return
    this.enabled = on

    if (on) this.enable()
    else this.disable()
  }

  enable() {
    const c = this.c
    if (!c.hasCompareContainerTarget || !c.hasCompareLeftTarget || !c.hasCompareRightTarget) {
      console.error("[compare] faltan targets compareContainer/Left/Right")
      return
    }

    c.mapContainerTarget.hidden = true
    c.compareContainerTarget.hidden = false

    const mapboxgl = window.mapboxgl
    const baseOpts = {
      style: "mapbox://styles/mapbox/streets-v11",
      center: c.map.getCenter(),
      zoom: c.map.getZoom(),
      bearing: c.map.getBearing(),
      pitch: c.map.getPitch(),
      interactive: true
    }

    this.mapLeft = new mapboxgl.Map({ ...baseOpts, container: c.compareLeftTarget })
    this.mapRight = new mapboxgl.Map({ ...baseOpts, container: c.compareRightTarget })

    const CompareCtor = window.mapboxgl?.Compare || window.Compare
    if (!CompareCtor) {
      console.error("[slider] window.mapboxgl?.Compare:", window.mapboxgl?.Compare)
      console.error("[slider] window.Compare:", window.Compare)
      throw new Error("mapbox-gl-compare no está disponible en window (script no cargó)")
    }

    this.compare = new CompareCtor(this.mapLeft, this.mapRight, this.c.compareContainerTarget)

    const sync = (src, dst) => {
      if (this._syncing) return
      this._syncing = true
      const center = src.getCenter()
      dst.jumpTo({
        center,
        zoom: src.getZoom(),
        bearing: src.getBearing(),
        pitch: src.getPitch()
      })
      this._syncing = false
    }

    this.mapLeft.on("move", () => sync(this.mapLeft, this.mapRight))
    this.mapRight.on("move", () => sync(this.mapRight, this.mapLeft))

    const onLoaded = async () => {
      await this.ensureCellsOn(this.mapLeft)
      await this.ensureCellsOn(this.mapRight)

      await c.adminLayers.loadSelectedMunicipalityOutlineOn(this.mapLeft)
      await c.adminLayers.loadSelectedMunicipalityOutlineOn(this.mapRight)

      await this.syncData()

      this.bindCellsHoverTooltip(this.mapLeft)
      this.bindCellsHoverTooltip(this.mapRight)
    }

    this.mapLeft.once("load", onLoaded)
    this.mapRight.once("load", onLoaded)
  }

  disable() {
    const c = this.c

    if (c.hasCompareContainerTarget) c.compareContainerTarget.hidden = true
    if (c.hasMapContainerTarget) c.mapContainerTarget.hidden = false

    try { this.compare?.remove?.() } catch {}
    this.compare = null

    this.clearTooltip(this.mapLeft)
    this.clearTooltip(this.mapRight)

    try { this.mapLeft?.remove() } catch {}
    try { this.mapRight?.remove() } catch {}
    this.mapLeft = null
    this.mapRight = null
  }

  async ensureCellsOn(map) {
    this.c.cellsLayer.ensure(map)
  }

  async syncData() {
    if (!this.enabled) return
    if (!this.mapLeft || !this.mapRight) return

    const c = this.c
    const mun = c._selectedMunicipalityCode
    const A = c._scenarioAId
    const B = c._scenarioBId
    if (!mun || !A || !B) return

    const opp = c._selectedOpportunityCode
    if (!opp) return

    const layerType = c._selectedLayerType
    const metric = c._selectedMetric
    const accMode = c._selectedAccessibilityMode
    const accType = c._selectedAccessibilityType || "surface"

    const isAccessibility = (layerType === "accessibility")
    const hasMetric = !!metric && metric !== "null"
    const hasAccMode = !!accMode && accMode !== "null"

    if (isAccessibility && !hasAccMode) return
    if (!isAccessibility && !hasMetric) return

    const urlFor = (scenarioId) => {
      if (isAccessibility) {
        return `/cells/accessibility?municipality_code=${encodeURIComponent(mun)}` +
          `&mode=${encodeURIComponent(accMode)}` +
          `&opportunity_code=${encodeURIComponent(opp)}` +
          `&scenario_id=${encodeURIComponent(scenarioId)}` +
          `&accessibility_type=${encodeURIComponent(accType)}`
      }

      return `/cells/thematic?municipality_code=${encodeURIComponent(mun)}` +
        `&metric=${encodeURIComponent(metric)}` +
        `&opportunity_code=${encodeURIComponent(opp)}` +
        `&scenario_id=${encodeURIComponent(scenarioId)}`
    }

    const urlA = urlFor(A)
    const urlB = urlFor(B)
    if (!urlA || !urlB) return

    const [respA, respB] = await Promise.all([fetch(urlA), fetch(urlB)])

    if (!respA.ok || !respB.ok) {
      console.error("[slider] error fetching compare data", {
        statusA: respA.status,
        statusB: respB.status,
        urlA,
        urlB
      })
      return
    }

    const [payloadA, payloadB] = await Promise.all([respA.json(), respB.json()])

    const fcA =
      payloadA?.type === "FeatureCollection" ? payloadA :
      payloadA?.data || payloadA?.geojson

    const fcB =
      payloadB?.type === "FeatureCollection" ? payloadB :
      payloadB?.data || payloadB?.geojson

    if (!fcA || !fcB) {
      console.error("[slider] payload inesperado", { payloadA, payloadB })
      return
    }

    this.mapLeft.getSource("cells")?.setData(fcB)   // izquierda = B
    this.mapRight.getSource("cells")?.setData(fcA)  // derecha = A

    // Use the breaks with the highest last value so the legend covers both scenarios
    const breaksA = payloadA?.breaks
    const breaksB = payloadB?.breaks
    if (breaksA && breaksB) {
      c._cellsBreaks = breaksA[breaksA.length - 1] >= breaksB[breaksB.length - 1] ? breaksA : breaksB
    } else {
      c._cellsBreaks = breaksA || breaksB || c._cellsBreaks
    }
    c.legend.render()
    c.legend.showButtonIfNeeded()
    c.legend.show()
  }

  renderTooltipContent(el, feature) {
    const label = this.currentHoverLabel()

    const layerType = this.c._selectedLayerType
    const klass = Number(feature?.properties?.class ?? 0)
    const rawValue = feature?.properties?.value ?? 0

    let formatted
    if (layerType === "accessibility") {
      formatted = this.c.accessibilityLabelForClass
        ? this.c.accessibilityLabelForClass(klass)
        : (klass ? String(klass) : "-")
    } else {
      formatted = Number(rawValue).toLocaleString("es-CL")
    }

    const hasProjects = feature?.properties?.has_projects === true
    let projectNames = []
    if (hasProjects) {
      try {
        const raw = feature?.properties?.project_names
        projectNames = typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : [])
      } catch (_) {}
    }

    if (projectNames.length > 0) {
      el.style.whiteSpace = "pre-line"
      el.style.maxWidth = "240px"
      el.textContent = `${label}: ${formatted}\n📍 Proyectos:\n${projectNames.map(n => `  • ${n}`).join("\n")}`
    } else {
      el.style.whiteSpace = "nowrap"
      el.style.maxWidth = ""
      el.textContent = `${label}: ${formatted}`
    }
  }

  ensureTooltip(map) {
    if (map._compareTooltip) return map._compareTooltip

    const el = document.createElement("div")
    el.className = "cell-tooltip"
    el.style.position = "absolute"
    el.style.backgroundColor = "rgba(17, 24, 39, 0.95)"
    el.style.color = "#fff"
    el.style.padding = "10px 14px"
    el.style.borderRadius = "12px"
    el.style.fontWeight = "700"
    el.style.fontSize = "14px"
    el.style.pointerEvents = "none"
    el.style.whiteSpace = "nowrap"
    el.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)"

    map.getContainer().appendChild(el)
    map._compareTooltip = el
    return el
  }

  moveTooltip(map, lngLat) {
    const tooltip = map._compareTooltip
    if (!tooltip) return

    const p = map.project(lngLat)
    tooltip.style.left = `${p.x + 12}px`
    tooltip.style.top = `${p.y - 56}px`
  }

  clearTooltip(map) {
    if (map._compareTooltip) {
      map._compareTooltip.remove()
      map._compareTooltip = null
    }
  }

  bindCellsHoverTooltip(map) {
    let hoveredId = null

    const clearHover = () => {
      map.getCanvas().style.cursor = ""

      if (hoveredId !== null && map.getSource("cells")) {
        map.setFeatureState({ source: "cells", id: hoveredId }, { hover: false })
        hoveredId = null
      }

      this.clearTooltip(map)
    }

    map.on("mouseenter", "cells-fill", () => {
      map.getCanvas().style.cursor = "pointer"
    })

    map.on("mousemove", "cells-fill", (e) => {
      const feature = e.features && e.features[0]
      if (!feature) return

      const id = feature.properties?.h3 || feature.id
      if (!id) return

      if (hoveredId !== null && hoveredId !== id && map.getSource("cells")) {
        map.setFeatureState({ source: "cells", id: hoveredId }, { hover: false })
      }

      hoveredId = id

      if (map.getSource("cells")) {
        map.setFeatureState({ source: "cells", id }, { hover: true })
      }

      const tooltip = this.ensureTooltip(map)
      this.renderTooltipContent(tooltip, feature)
      this.moveTooltip(map, e.lngLat)
    })

    map.on("mouseleave", "cells-fill", clearHover)
  }

  currentHoverLabel() {
    if (this.c._selectedLayerType === "accessibility") {
      const mode = this.c._selectedAccessibilityMode || ""
      return mode === "walk" ? "Accesibilidad (caminata)" : "Accesibilidad (auto)"
    }

    if (this.c._selectedMetric === "surface") return "Superficie"
    if (this.c._selectedMetric === "units") return "Unidades"

    return "Valor"
  }
}
