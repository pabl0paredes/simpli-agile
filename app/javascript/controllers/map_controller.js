import { Controller } from "@hotwired/stimulus"
import { MapSelection } from "./map_selection"
import { MapHover } from "./map_hover"
import { MapThematic } from "./map_thematic"

export default class extends Controller {
  static values = { token: String }

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
      container: this.element,
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

    // ✅ Cambió el escenario: limpia lo que esté pintado para evitar “data pegada”
    this.onLayerCleared()

    // opcional: si ya hay metric seleccionado (o accesibilidad activa), recargar
    // Por ahora, con accesibilidad basta recargar cuando se clickea modo.
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
  }

  onOpportunitySelected = (event) => {
    this._selectedOpportunityCode = event.detail.opportunity_code
    console.log("✅ guardé opp:", this._selectedOpportunityCode)
  }

  onAccessibilityModeSelected = async (event) => {
    const mode = event.detail.mode
    if (!this._selectedMunicipalityCode) return
    if (!this._selectedOpportunityCode) return  // 👈 clave

    this._selectedLayerType = "accessibility"     // ✅
    this._selectedAccessibilityMode = mode        // ✅
    this._selectedMetric = null                   // ✅

    const scenarioId = this._selectedScenarioId

    this.ensureCellsLayer()


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
            "#000000"
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
}
