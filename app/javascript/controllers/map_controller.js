import { Controller } from "@hotwired/stimulus"
import { MapSelection } from "./map_selection"
import { MapHover } from "./map_hover"
import { MapThematic } from "./map_thematic"
import { MapLegend } from "./map/map_legend"

export default class extends Controller {
  static values = { token: String }
  static targets = ["mapContainer", "legendPanel", "legendItems", "legendBtn"]

  connect() {
    console.log("✅ map_controller connect()", this.tokenValue?.slice(0, 8))

    const mapboxgl = window.mapboxgl
    if (!mapboxgl) {
      console.error("mapboxgl no está disponible (script CDN no cargó)")
      return
    }

    if (!this.tokenValue) {
      console.warn("MAPBOX_TOKEN no está definido en ENV")
      return
    }

    mapboxgl.accessToken = this.tokenValue

    this.map = new mapboxgl.Map({
      container: this.mapContainerTarget,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-70.6371, -33.4378],
      zoom: 4
    })

    this.map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    )

    // ✅ todo lo que agrega layers/sources, dentro de "load"
    this.map.on("load", () => {
      this.selection = new MapSelection(this)
      this.hover = new MapHover(this)
      this.thematic = new MapThematic(this)
      this.legend = new MapLegend(this)

      this.ensureMunicipalitiesLayer()
      this.hover.bindMunicipalitiesHoverTooltip()
      this.bindMunicipalitiesClick()
      this.loadRegionsIntoMap()
      this.bindRegionsClick()

      window.addEventListener("region:selected", this.onRegionSelected)
      window.addEventListener("municipality:selected", this.onMunicipalitySelected)
      window.addEventListener("municipality:cleared", this.onMunicipalityCleared)
      window.addEventListener("layer:selected", this.thematic.onLayerSelected)
      window.addEventListener("opportunity:selected", this.onOpportunitySelected)
      window.addEventListener("accessibility:mode_selected", this.onAccessibilityModeSelected)
      window.addEventListener("layer:cleared", this.onLayerCleared)
      window.addEventListener("scenario:selected", this.onScenarioSelected)
      window.addEventListener("cell:pick_start", this.selection.onPickCellStart)
      window.addEventListener("cell:pick_cancel", this.selection.onPickCellCancel)
      window.addEventListener("comparison:delta_selected", this.onComparisonDeltaSelected)
      window.addEventListener("ui:mode_changed", this.onUIModeChanged)
      window.addEventListener("comparison:context_changed", this.onComparisonContextChanged)
      window.addEventListener("locator:opened", this.onLocatorOpened)
      window.addEventListener("locator:closed", this.onLocatorClosed)
    })
  }

  disconnect() {
    window.removeEventListener("region:selected", this.onRegionSelected)
    window.removeEventListener("municipality:selected", this.onMunicipalitySelected)
    window.removeEventListener("municipality:cleared", this.onMunicipalityCleared)
    window.removeEventListener("layer:selected", this.thematic.onLayerSelected)
    window.removeEventListener("opportunity:selected", this.onOpportunitySelected)
    window.removeEventListener("accessibility:mode_selected", this.onAccessibilityModeSelected)
    window.removeEventListener("layer:cleared", this.onLayerCleared)
    window.removeEventListener("scenario:selected", this.onScenarioSelected)
    window.removeEventListener("cell:pick_start", this.selection.onPickCellStart)
    window.removeEventListener("cell:pick_cancel", this.selection.onPickCellCancel)
    window.removeEventListener("comparison:delta_selected", this.onComparisonDeltaSelected)
    window.removeEventListener("ui:mode_changed", this.onUIModeChanged)
    window.removeEventListener("comparison:context_changed", this.onComparisonContextChanged)
    window.removeEventListener("locator:opened", this.onLocatorOpened)
    window.removeEventListener("locator:closed", this.onLocatorClosed)
  }

  onUIModeChanged = (e) => {
    this._uiMode = e.detail?.mode

    // opcional: cuando cambias de modo, puedes limpiar estados visuales
    // if (this._uiMode === "comparador") this.onLayerCleared()
  }

  onComparisonContextChanged = (e) => {
    this._scenarioAId = e.detail?.scenario_a_id
    this._scenarioBId = e.detail?.scenario_b_id
    this._compareMode = e.detail?.compare_mode
  }


  safeSetVisibility(layerId, vis) {
    if (this.map.getLayer(layerId)) {
      this.map.setLayoutProperty(layerId, "visibility", vis)
    }
  }

  onLocatorOpened = async () => {
    this._inLocator = true
    this.ensureCellsLayer()

    const ok = this.ensureLocatorLayers()
    if (!ok) return

    const mun = this._selectedMunicipalityCode
    const selectedId = this._selectedScenarioId

    if (!mun || !selectedId) {
      console.warn("locator missing context", { mun, selectedId })
      return
    }

    // ✅ decidir draftScenarioId según el status del escenario seleccionado
    const selectedIsDraft = (this._selectedScenarioStatus === "draft")
    const draftScenarioId = selectedIsDraft ? selectedId : this._draftScenarioId

    console.log(this._selectedScenarioId)
    console.log(this._selectedScenarioStatus)
    console.log(draftScenarioId)

    // ✅ snapshot para restaurar al cerrar
    if (!this._locatorPrev) this._locatorPrev = {}
    this._locatorPrev.fc = this.map.getSource("cells")?._data || null
    this._locatorPrev.layerType = this._selectedLayerType || null
    this._locatorPrev.metric = this._selectedMetric || null
    this._locatorPrev.accessMode = this._selectedAccessibilityMode || null
    this._locatorPrev.breaks = this._cellsBreaks || null
    this._locatorPrev.wasVisible = (this.map.getLayer("cells-fill") &&
      this.map.getLayoutProperty("cells-fill", "visibility") !== "none")

    let url =
      `/cells/locator_status?municipality_code=${encodeURIComponent(mun)}` +
      `&base_scenario_id=${encodeURIComponent(selectedId)}`

    if (draftScenarioId) {
      url += `&draft_scenario_id=${encodeURIComponent(draftScenarioId)}`
    }

    const fc = await fetch(url).then(r => r.json())
    this.map.getSource("cells").setData(fc)

    this.setCellsVisible(true)
    this.safeSetVisibility("cells-parent-fill", "visible")
    this.safeSetVisibility("cells-draft-hatch", "visible")
  }

  onLocatorClosed = () => {
    this._inLocator = false
    this.ensureCellsLayer()

    // ocultar overlays
    this.safeSetVisibility("cells-parent-fill", "none")
    this.safeSetVisibility("cells-draft-hatch", "none")

    const prev = this._locatorPrev
    const source = this.map.getSource("cells")

    if (prev?.fc && source) {
      // ✅ restaurar data anterior
      source.setData(prev.fc)

      // restaurar breaks si aplica
      this._cellsBreaks = prev.breaks || null

      // restaurar visibilidad (si antes estaba visible)
      this.setCellsVisible(!!prev.wasVisible)

      // opcional: re-render leyenda si corresponde
      if (prev.wasVisible) {
        this.legend.render?.()
        this.legend.showButtonIfNeeded?.()
      }
    } else {
      // ✅ si antes no había capa seleccionada, dejar vacío
      if (source) {
        source.setData({ type: "FeatureCollection", features: [] })
      }
      this._cellsBreaks = null
      this.setCellsVisible(false)
    }

    // limpiar snapshot
    this._locatorPrev = null
  }

  onRegionSelected = async (event) => {
    const regionCode = event.detail.region_code

    // 1) mover cámara
    const focus = await fetch(`/regions/focus?region_code=${encodeURIComponent(regionCode)}`).then(r => r.json())
    this.map.flyTo({
      center: focus.centroid, // [lng, lat]
      zoom: focus.zoom,
      essential: true
    })

    // 2) cargar comunas y pintar
    const fc = await fetch(`/municipalities?region_code=${encodeURIComponent(regionCode)}`).then(r => r.json())
    this.map.getSource("municipalities").setData(fc)

    this.setRegionsVisible(false)
    this.setMunicipalitiesVisible(true)
  }

  onMunicipalitySelected = async (event) => {
    const munCode = event.detail.municipality_code
    this._selectedMunicipalityCode = munCode

    const focus = await fetch(`/municipalities/focus?municipality_code=${encodeURIComponent(munCode)}`).then(r => r.json())
    this.map.flyTo({
      center: focus.centroid,
      zoom: focus.zoom,
      essential: true
    })

    this.setRegionsVisible(false)
    this.setMunicipalitiesVisible(false)

    this.map.getSource("selected-municipality").setData(focus.geometry)
  }

  onScenarioSelected = (event) => {
    this._selectedScenarioId = event.detail.scenario_id
    this._selectedScenarioStatus = event.detail.status

    // ✅ Cambió el escenario: limpia lo que esté pintado para evitar “data pegada”
    this.onLayerCleared()
  }

  onLayerCleared = () => {
    // apaga visibilidad
    this.setCellsVisible(false)

    // limpia data para que no quede “pegado”
    const src = this.map.getSource("cells")
    if (src) {
      src.setData({ type: "FeatureCollection", features: [] })
    }

    this._cellsBreaks = null
    this._selectedMetric = null
    this._selectedLayerType = null
    this._selectedAccessibilityMode = null

    if (this._clearCellsHover) this._clearCellsHover()

    this.legend.hide()
    this.legend.showButtonIfNeeded()
    this.legend.clearClassFocus()
  }

  onOpportunitySelected = (event) => {
    this._selectedOpportunityCode = event.detail.opportunity_code
    console.log("✅ guardé opp:", this._selectedOpportunityCode)
  }

  onAccessibilityModeSelected = async (event) => {
    const mode = event.detail.mode
    if (!this._selectedMunicipalityCode) return
    if (!this._selectedOpportunityCode) return

    // ✅ si estamos en comparador y modo delta → accessibility_delta
    const inComparator = (this._uiMode === "comparador") // ajusta al nombre real que uses
    const isDelta = (this._compareMode === "delta")       // ajusta

    this.ensureCellsLayer()

    if (inComparator && isDelta) {
      if (!this._scenarioAId || !this._scenarioBId) return

      this._selectedLayerType = "delta"
      this._selectedAccessibilityMode = mode
      this._selectedMetric = null

      const url =
        `/cells/accessibility_delta?municipality_code=${encodeURIComponent(this._selectedMunicipalityCode)}` +
        `&mode=${encodeURIComponent(mode)}` +
        `&opportunity_code=${encodeURIComponent(this._selectedOpportunityCode)}` +
        `&scenario_a_id=${encodeURIComponent(this._scenarioAId)}` +
        `&scenario_b_id=${encodeURIComponent(this._scenarioBId)}`

      const fc = await fetch(url).then(r => r.json())

      this.map.getSource("cells").setData({ type: "FeatureCollection", features: fc.features })
      this._cellsBreaks = fc.breaks

      this.setCellsVisible(true)
      this.legend.render()
      this.legend.showButtonIfNeeded()
      return
    }

    this._selectedLayerType = "accessibility"     // ✅
    this._selectedAccessibilityMode = mode        // ✅
    this._selectedMetric = null                   // ✅

    const scenarioId = this._selectedScenarioId




    const url =
      `/cells/accessibility?municipality_code=${encodeURIComponent(this._selectedMunicipalityCode)}` +
      `&mode=${encodeURIComponent(mode)}` +
      `&opportunity_code=${encodeURIComponent(this._selectedOpportunityCode)}` +
      `&scenario_id=${encodeURIComponent(scenarioId)}`

    const fc = await fetch(url).then(r => r.json())

    this.map.getSource("cells").setData({
      type: "FeatureCollection",
      features: fc.features
    })

    this._cellsBreaks = fc.breaks
    this.setCellsVisible(true)

    this.legend.render()
    this.legend.showButtonIfNeeded()
  }

  onMunicipalityCleared = () => {
    const src = this.map.getSource("selected-municipality")
    if (!src) return

    src.setData({ type: "FeatureCollection", features: [] })
  }

  ensureMunicipalitiesLayer() {
    // source vacío inicial
    this.map.addSource("municipalities", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      promoteId: "municipality_code"
    })

    // fill
    this.map.addLayer({
      id: "municipalities-fill",
      type: "fill",
      source: "municipalities",
      paint: {
        "fill-color": "#2bf89a",
        "fill-opacity": 0.25
      }
    })

    // borde
    this.map.addLayer({
      id: "municipalities-outline",
      type: "line",
      source: "municipalities",
      paint: {
        "line-color": "#1cb66e",
        "line-width": 2
      }
    })

    if (!this.map.getLayer("municipalities-hover")) {
      this.map.addLayer({
        id: "municipalities-hover",
        type: "fill",
        source: "municipalities",
        paint: {
          "fill-color": "#2bf89a",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.3,
            0
          ]
        }
      })
    }

    this.setMunicipalitiesVisible(false)

    if (!this.map.getSource("selected-municipality")) {
      this.map.addSource("selected-municipality", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      })
    }

    if (!this.map.getLayer("selected-municipality-outline")) {
      this.map.addLayer({
        id: "selected-municipality-outline",
        type: "line",
        source: "selected-municipality",
        paint: {
          "line-color": "#111827",
          "line-width": 2.5,
          "line-opacity": 0.9,
          "line-dasharray": [2, 2]
        }
      })
    }
  }

  loadRegionsIntoMap() {
    fetch("/regions")
      .then(r => r.json())
      .then((fc) => {
        if (!Array.isArray(fc.features)) {
          console.error("GeoJSON inválido en /regions", fc)
          return
        }

        // 1) source único
        if (this.map.getSource("regions")) {
          this.map.getSource("regions").setData(fc)
        } else {
          this.map.addSource("regions", { type: "geojson", data: fc, promoteId: "region_code"})
        }

        // 2) layers únicos (fill + outline)
        if (!this.map.getLayer("regions-fill")) {
          this.map.addLayer({
            id: "regions-fill",
            type: "fill",
            source: "regions",
            paint: {
              // "fill-color": "#88B4FF",
              "fill-color": "#2bf89a",
              "fill-opacity": 0.5
            }
          })
        }

        if (!this.map.getLayer("regions-outline")) {
          this.map.addLayer({
            id: "regions-outline",
            type: "line",
            source: "regions",
            paint: {
              "line-color": "#1cb66e",
              "line-width": 2
            }
          })
        }

        // 3) hover highlight con feature-state (sin duplicar layers)
        if (!this.map.getLayer("regions-hover")) {
          this.map.addLayer({
            id: "regions-hover",
            type: "fill",
            source: "regions",
            paint: {
              "fill-color": "#2bf89a",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.3,
                0
              ]
            }
          })
        }

        this.hover.bindRegionsHoverTooltip() // ✅ listeners 1 vez
      })
      .catch(err => console.error("Error cargando regiones:", err))
  }

  bindRegionsClick() {
    if (this._regionsClickBound) return
    this._regionsClickBound = true

    this.map.on("click", "regions-fill", (e) => {
      const f = e.features && e.features[0]
      if (!f) return

      const regionCode = f.properties?.region_code
      if (!regionCode) return

      window.dispatchEvent(new CustomEvent("region:clicked", {
        detail: { region_code: regionCode }
      }))
    })
  }

  bindMunicipalitiesClick() {
    // evita registrarlo dos veces, importante para eventos de click
    if (this._municipalitiesClickBound) return
    this._municipalitiesClickBound = true

    this.map.on("click", "municipalities-fill", (e) => {
      const f = e.features && e.features[0]
      if (!f) return

      const munCode = f.properties?.municipality_code

      if (!munCode) return

      window.dispatchEvent(new CustomEvent("municipality:clicked", {
        detail: { municipality_code: munCode }
      }))
    })
  }

  setRegionsVisible(visible) {
    const v = visible ? "visible" : "none"
    ;["regions-fill", "regions-outline", "regions-hover"].forEach((id) => {
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", v)
    })
  }

  setMunicipalitiesVisible(visible) {
    const v = visible ? "visible" : "none"
    ;["municipalities-fill", "municipalities-outline"].forEach((id) => {
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", v)
    })
  }

  setCellsVisible(visible) {
    const visibility = visible ? "visible" : "none"

    if (this.map.getLayer("cells-fill")) {
      this.map.setLayoutProperty("cells-fill", "visibility", visibility)
    }

    if (this.map.getLayer("cells-outline")) {
      this.map.setLayoutProperty("cells-outline", "visibility", visibility)
    }
  }

  createHatchPattern60() {
    const size = 32
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")

    ctx.clearRect(0, 0, size, size)
    ctx.translate(size / 2, size / 2)
    ctx.rotate((60 * Math.PI) / 180)
    ctx.translate(-size / 2, -size / 2)

    ctx.lineWidth = 2
    ctx.strokeStyle = "rgba(17,24,39,0.35)"
    for (let x = -size; x < size * 2; x += 8) {
      ctx.beginPath()
      ctx.moveTo(x, -size)
      ctx.lineTo(x, size * 2)
      ctx.stroke()
    }

    // ✅ devuelve ImageData en vez de canvas (evita mismatch)
    return ctx.getImageData(0, 0, size, size)
  }

  ensureCellsLayer() {
    if (!this.map.getSource("cells")) {
      this.map.addSource("cells", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        promoteId: "h3"
      })
    }

    if (!this.map.getLayer("cells-fill")) {
      this.map.addLayer({
        id: "cells-fill",
        type: "fill",
        source: "cells",
        paint: {
          "fill-opacity": 0.75,
          "fill-color": [
            "match",
            ["get", "class"],
            0, "#e5e7eb",
            1, "#dbeafe",
            2, "#93c5fd",
            3, "#3b82f6",
            4, "#1d4ed8",
            5, "#0b3aa4",
            "#f3f4f6"
          ]
        }
      })
    }

    if (!this.map.getLayer("cells-outline")) {
      this.map.addLayer({
        id: "cells-outline",
        type: "line",
        source: "cells",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#2563eb",                // azul selección
            "rgba(17,24,39,0.20)"     // normal
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3,   // grosor seleccionado
            1
          ]
        }
      })
    }

    if (!this.map.getLayer("cells-hover")) {
      this.map.addLayer({
        id: "cells-hover",
        type: "fill",
        source: "cells",
        paint: {
          "fill-color": "#111827",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.15,
            0
          ]
        }
      })
    }
    this.hover.bindCellsHoverTooltip()
  }

  ensureLocatorLayers() {
    try {
      if (!this.map.hasImage("hatch-60")) {
        this.map.addImage("hatch-60", this.createHatchPattern60())
      }
    } catch (err) {
      console.error("❌ hatch-60 addImage failed:", err)
      return false
    }

    if (!this.map.getLayer("cells-parent-fill")) {
      this.map.addLayer({
        id: "cells-parent-fill",
        type: "fill",
        source: "cells",
        paint: { "fill-opacity": 0.70, "fill-color": "#ef4444" },
        filter: ["==", ["get", "has_parent_projects"], true]
      })
      this.map.setLayoutProperty("cells-parent-fill", "visibility", "none")
    }

    if (!this.map.getLayer("cells-draft-hatch")) {
      this.map.addLayer({
        id: "cells-draft-hatch",
        type: "fill",
        source: "cells",
        paint: { "fill-opacity": 1, "fill-pattern": "hatch-60" },
        filter: ["==", ["get", "has_draft_projects"], true]
      })
      this.map.setLayoutProperty("cells-draft-hatch", "visibility", "none")
    }

    return true
  }

  toggleLegend = () => this.legend.toggle()

  onComparisonDeltaSelected = async (event) => {
    const { scenario_a_id, scenario_b_id, opportunity_code, metric } = event.detail

    if (!this._selectedMunicipalityCode) return
    if (!scenario_a_id || !scenario_b_id) return
    if (!opportunity_code || !metric) return

    this._selectedLayerType = "delta"
    this._selectedMetric = metric
    this._selectedOpportunityCode = opportunity_code

    this.ensureCellsLayer()

    const url =
      `/cells/delta?municipality_code=${encodeURIComponent(this._selectedMunicipalityCode)}` +
      `&scenario_a_id=${encodeURIComponent(scenario_a_id)}` +
      `&scenario_b_id=${encodeURIComponent(scenario_b_id)}` +
      `&opportunity_code=${encodeURIComponent(opportunity_code)}` +
      `&metric=${encodeURIComponent(metric)}`

    const payload = await fetch(url).then(r => r.json())

    this.map.getSource("cells").setData({
      type: "FeatureCollection",
      features: payload.features
    })

    this._cellsBreaks = payload.breaks
    this.setCellsVisible(true)

    this.legend.render()
    this.legend.showButtonIfNeeded()
  }



}
