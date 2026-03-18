export class MapCompareSplit {
  constructor(controller) {
    this.c = controller
    this.enabled = false
    this.mapTop = null     // A
    this.mapBottom = null  // B
    this._syncing = false
  }

  setEnabled(on) {
    if (on === this.enabled) return
    this.enabled = on
    on ? this.enable() : this.disable()
  }

  enable() {
    const c = this.c
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    if (!c.hasSplitContainerTarget || !c.hasSplitTopTarget || !c.hasSplitBottomTarget) {
      console.error("[split] faltan targets splitContainer/splitTop/splitBottom")
      return
    }

    // Oculta mapa normal y cualquier otro compare UI
    c.mapContainerTarget.hidden = true
    if (c.hasCompareContainerTarget) c.compareContainerTarget.hidden = true

    c.splitContainerTarget.hidden = false

    const baseOpts = {
      style: "mapbox://styles/mapbox/streets-v11",
      center: c.map.getCenter(),
      zoom: c.map.getZoom(),
      bearing: c.map.getBearing(),
      pitch: c.map.getPitch(),
      interactive: true
    }

    this.mapTop = new mapboxgl.Map({ ...baseOpts, container: c.splitTopTarget })
    this.mapBottom = new mapboxgl.Map({ ...baseOpts, container: c.splitBottomTarget })

    const sync = (src, dst) => {
      if (this._syncing) return
      this._syncing = true
      dst.jumpTo({
        center: src.getCenter(),
        zoom: src.getZoom(),
        bearing: src.getBearing(),
        pitch: src.getPitch()
      })
      this._syncing = false
    }

    this.mapTop.on("move", () => sync(this.mapTop, this.mapBottom))
    this.mapBottom.on("move", () => sync(this.mapBottom, this.mapTop))

    const onLoaded = async () => {
      c.cellsLayer.ensure(this.mapTop)
      c.cellsLayer.ensure(this.mapBottom)

      await c.adminLayers.loadSelectedMunicipalityOutlineOn(this.mapTop)
      await c.adminLayers.loadSelectedMunicipalityOutlineOn(this.mapBottom)

      await this.syncData()

      this.bindCellsHoverSync()   // 👈 agregar esto
    }

    this.mapTop.once("load", onLoaded)
    this.mapBottom.once("load", onLoaded)
  }

  disable() {
    const c = this.c
    if (c.hasSplitContainerTarget) c.splitContainerTarget.hidden = true
    if (c.hasMapContainerTarget) c.mapContainerTarget.hidden = false

    try { this.mapTop?.remove() } catch {}
    try { this.mapBottom?.remove() } catch {}
    this.mapTop = null
    this.mapBottom = null
  }

  async syncData() {

    if (!this.enabled) return
    if (!this.mapTop || !this.mapBottom) return

    const c = this.c
    const mun = c._selectedMunicipalityCode
    const opp = c._selectedOpportunityCode
    const A = c._scenarioAId
    const B = c._scenarioBId
    if (!mun || !opp || !A || !B) return

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
        `&opportunity_code=${encodeURIComponent(opp)}` +
        `&scenario_id=${encodeURIComponent(scenarioId)}` +
        `&metric=${encodeURIComponent(metric)}`
    }

    const [payloadA, payloadB] = await Promise.all([
      fetch(urlFor(A)).then(r => r.json()),
      fetch(urlFor(B)).then(r => r.json())
    ])

    const fcA = payloadA?.type === "FeatureCollection" ? payloadA : payloadA?.data || payloadA?.geojson
    const fcB = payloadB?.type === "FeatureCollection" ? payloadB : payloadB?.data || payloadB?.geojson


    if (fcA) this.mapTop.getSource("cells")?.setData(fcA)
    if (fcB) this.mapBottom.getSource("cells")?.setData(fcB)

    c._cellsBreaks = payloadA?.breaks || payloadB?.breaks || c._cellsBreaks
    c.legend.render()
    c.legend.showButtonIfNeeded()
    c.legend.show()
  }

  bindCellsHoverSync() {
    const bind = (map, otherMap) => {
      let hoveredId = null

      const clearHover = () => {
        map.getCanvas().style.cursor = ""

        if (hoveredId !== null) {
          if (map.getSource("cells")) {
            map.setFeatureState({ source: "cells", id: hoveredId }, { hover: false })
          }
          if (otherMap.getSource("cells")) {
            otherMap.setFeatureState({ source: "cells", id: hoveredId }, { hover: false })
          }
          hoveredId = null
        }

        this.clearTooltip(map)
        this.clearTooltip(otherMap)
      }

      map.on("mouseenter", "cells-fill", () => {
        map.getCanvas().style.cursor = "pointer"
      })

      map.on("mousemove", "cells-fill", (e) => {
        const feature = e.features && e.features[0]
        if (!feature) return

        const id = feature.properties?.h3 || feature.id
        if (!id) return

        if (hoveredId !== null && hoveredId !== id) {
          if (map.getSource("cells")) {
            map.setFeatureState({ source: "cells", id: hoveredId }, { hover: false })
          }
          if (otherMap.getSource("cells")) {
            otherMap.setFeatureState({ source: "cells", id: hoveredId }, { hover: false })
          }
        }

        hoveredId = id

        if (map.getSource("cells")) {
          map.setFeatureState({ source: "cells", id }, { hover: true })
        }
        if (otherMap.getSource("cells")) {
          otherMap.setFeatureState({ source: "cells", id }, { hover: true })
        }

        const otherFeature = otherMap
          .querySourceFeatures("cells")
          ?.find(f => (f.properties?.h3 || f.id) === id)

        const tooltipA = this.ensureTooltip(map)
        tooltipA.textContent = this.formatHoverText(feature)
        this.moveTooltip(map, e.lngLat)

        if (otherFeature) {
          const tooltipB = this.ensureTooltip(otherMap)
          tooltipB.textContent = this.formatHoverText(otherFeature)

          const geom = otherFeature.geometry
          let coord = null

          if (geom?.type === "Polygon") {
            coord = geom.coordinates?.[0]?.[0]
          } else if (geom?.type === "MultiPolygon") {
            coord = geom.coordinates?.[0]?.[0]?.[0]
          }

          if (coord) {
            this.moveTooltip(otherMap, { lng: coord[0], lat: coord[1] })
          }
        }
      })

      map.on("mouseleave", "cells-fill", clearHover)
    }

    bind(this.mapTop, this.mapBottom)
    bind(this.mapBottom, this.mapTop)
  }

  formatHoverText(feature) {
    const label = this.c.hover?.currentCellsHoverLabel?.() || "Valor"

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

    return `${label}: ${formatted}`
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
}
