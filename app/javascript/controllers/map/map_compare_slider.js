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

    c._cellsBreaks = payloadA?.breaks || payloadB?.breaks || c._cellsBreaks
    c.legend.render()
    c.legend.showButtonIfNeeded()
    c.legend.show()
  }
}
