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
}
