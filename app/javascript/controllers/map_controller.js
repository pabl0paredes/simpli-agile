import { Controller } from "@hotwired/stimulus"
import { MapSelection } from "controllers/map/map_selection"
import { MapHover } from "controllers/map/map_hover"
import { MapThematic } from "controllers/map/map_thematic"
import { MapLegend } from "controllers/map/map_legend"
import { MapCellsLayer } from "controllers/map/map_cells_layer"
import { MapAdminLayers } from "controllers/map/map_admin_layers"
import { MapLocator } from "controllers/map/map_locator"
import { MapStateEvents } from "controllers/map/map_state_events"
import { MapThematicRunners } from "controllers/map/map_thematic_runners"
import { MapCompareSlider } from "controllers/map/map_compare_slider"
import { MapCompareSplit } from "controllers/map/map_compare_split"
import { MapDashboard } from "controllers/map/map_dashboard"
import { MapStyle } from "controllers/map/map_style"

export default class extends Controller {
  static values = { token: String, initialCenter: Array, initialZoom: Number }
  static targets = [
    "mapContainer",
    "legendPanel",
    "legendItems",
    "legendBtn",
    "dashboardPanel",
    "dashboardChart",
    "dashboardBtn",
    "compareContainer",
    "compareLeft",
    "compareRight",
    "splitContainer",
    "splitTop",
    "splitBottom",
    "stylePickerBtn",
    "stylePickerPanel"
  ]

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

    const center = this.initialCenterValue?.length === 2 ? this.initialCenterValue : [-70.6371, -33.4378]
    const zoom   = this.initialZoomValue || 4

    this.map = new mapboxgl.Map({
      container: this.mapContainerTarget,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom,
      attributionControl: false
    })

    this.map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-left"
    )

    this.map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right"
    )

    // ✅ todo lo que agrega layers/sources, dentro de "load"
    this.map.on("load", () => {
      this.selection = new MapSelection(this)
      this.hover = new MapHover(this)
      this.thematicLayer = new MapThematic(this)
      this.legend = new MapLegend(this)
      this.cellsLayer = new MapCellsLayer(this)
      this.adminLayers = new MapAdminLayers(this)
      this.locator = new MapLocator(this)
      this.stateEvents = new MapStateEvents(this)
      this.thematicRunner = new MapThematicRunners(this)
      this.compareSlider = new MapCompareSlider(this)
      this.compareSplit = new MapCompareSplit(this)
      this.dashboard = new MapDashboard(this)
      this.styleManager = new MapStyle(this)

      this.adminLayers.ensureMunicipalitiesLayer()
      this.hover.bindMunicipalitiesHoverTooltip()
      this.adminLayers.bindMunicipalitiesClick()
      this.adminLayers.loadRegionsIntoMap()
      this.adminLayers.bindRegionsClick()

      window.addEventListener("region:selected", this.onRegionSelected)
      window.addEventListener("region:cleared", this.onRegionCleared)
      window.addEventListener("municipality:selected", this.onMunicipalitySelected)
      window.addEventListener("municipality:cleared", this.onMunicipalityCleared)
      window.addEventListener("municipality:back", this.onMunicipalityBack)
      window.addEventListener("layer:selected", this.onLayerSelected)
      window.addEventListener("opportunity:selected", this.onOpportunitySelected)
      window.addEventListener("accessibility:mode_selected", this.onAccessibilityModeSelected)
      window.addEventListener("layer:cleared", this.onLayerCleared)
      window.addEventListener("scenario:selected", this.onScenarioSelected)
      window.addEventListener("cell:pick_start", this.selection.onPickCellStart)
      window.addEventListener("cell:pick_cancel", this.selection.onPickCellCancel)
      window.addEventListener("comparison:delta_selected", this.onComparisonDeltaSelected)
      window.addEventListener("ui:mode_changed_for_map", this.onUIModeChanged)
      window.addEventListener("comparison:context_changed", this.onComparisonContextChanged)
      window.addEventListener("locator:opened", this.onLocatorOpened)
      window.addEventListener("locator:closed", this.onLocatorClosed)
      window.addEventListener("cell:selection_clear", this.onCellSelectionClear)
      window.addEventListener("project:hover", this.onProjectHover)
      window.addEventListener("project:hover_end", this.onProjectHoverEnd)
      window.addEventListener("map:style-selected", this.onStyleSelected)
      window.addEventListener("map:palette-selected", this.onPaletteSelected)
      window.addEventListener("map:streets-on-top", this.onStreetsOnTopToggled)

      window._mapReady = true
      window.dispatchEvent(new CustomEvent("map:ready"))
    })
  }

  disconnect() {
    // Reset global flag so Turbo navigations don't see a stale "map ready" state
    window._mapReady = false
    this.map?.remove()

    window.removeEventListener("region:selected", this.onRegionSelected)
    window.removeEventListener("region:cleared", this.onRegionCleared)
    window.removeEventListener("municipality:selected", this.onMunicipalitySelected)
    window.removeEventListener("municipality:cleared", this.onMunicipalityCleared)
    window.removeEventListener("municipality:back", this.onMunicipalityBack)
    window.removeEventListener("layer:selected", this.onLayerSelected)
    window.removeEventListener("opportunity:selected", this.onOpportunitySelected)
    window.removeEventListener("accessibility:mode_selected", this.onAccessibilityModeSelected)
    window.removeEventListener("layer:cleared", this.onLayerCleared)
    window.removeEventListener("scenario:selected", this.onScenarioSelected)
    window.removeEventListener("cell:pick_start", this.selection?.onPickCellStart)
    window.removeEventListener("cell:pick_cancel", this.selection?.onPickCellCancel)
    window.removeEventListener("comparison:delta_selected", this.onComparisonDeltaSelected)
    window.removeEventListener("ui:mode_changed_for_map", this.onUIModeChanged)
    window.removeEventListener("comparison:context_changed", this.onComparisonContextChanged)
    window.removeEventListener("locator:opened", this.onLocatorOpened)
    window.removeEventListener("locator:closed", this.onLocatorClosed)
    window.removeEventListener("cell:selection_clear", this.onCellSelectionClear)
    window.removeEventListener("project:hover", this.onProjectHover)
    window.removeEventListener("project:hover_end", this.onProjectHoverEnd)
    window.removeEventListener("map:style-selected", this.onStyleSelected)
    window.removeEventListener("map:palette-selected", this.onPaletteSelected)
    window.removeEventListener("map:streets-on-top", this.onStreetsOnTopToggled)
  }

  onStyleSelected = (e) => this.styleManager?.select(e.detail.styleId)
  onStreetsOnTopToggled = (e) => {
    this._streetsOnTop = e.detail.enabled
    this.adminLayers?.applyStreetsOnTop(e.detail.enabled)
    const compareMaps = [
      this.compareSplit?.mapTop, this.compareSplit?.mapBottom,
      this.compareSlider?.mapLeft, this.compareSlider?.mapRight
    ].filter(Boolean)
    compareMaps.forEach(m => this.adminLayers?.applyStreetsOnTopToMap(m, e.detail.enabled))
  }

  onPaletteSelected = (e) => {
    const palette = e.detail.palette
    this._palette = palette
    this.cellsLayer?.applyPalette(palette)
    this.legend?.render()
    this.dashboard?.render()
  }

  onRegionSelected = (e) => this.adminLayers.onRegionSelected(e)
  onRegionCleared = () => this.adminLayers.onRegionCleared()
  onMunicipalitySelected = (e) => this.adminLayers.onMunicipalitySelected(e)
  onMunicipalityCleared = () => this.adminLayers.onMunicipalityCleared()
  onMunicipalityBack = () => this.adminLayers.onMunicipalityBack()
  setRegionsVisible = (v) => this.adminLayers.setRegionsVisible(v)
  setMunicipalitiesVisible = (v) => this.adminLayers.setMunicipalitiesVisible(v)

  safeSetVisibility = (id, visible) => this.locator.safeSetVisibility(id, visible)
  onLocatorOpened = (e) => this.locator.onOpened(e)
  onLocatorClosed = () => this.locator.onClosed()

  // --- Delegaciones: mantenemos API del controller ---
  setCellsVisible = (visible) => this.cellsLayer.setVisible(visible)
  ensureCellsLayer = () => this.cellsLayer.ensure()
  ensureLocatorLayers = () => this.cellsLayer.ensureLocatorOverlays()

  toggleLegend = () => this.legend.toggle()
  toggleDashboard = () => this.dashboard.toggle()
  toggleStylePicker = () => this.styleManager?.togglePicker()
  selectStyle(e) { this.styleManager?.select(e.currentTarget.dataset.styleId) }

  onScenarioSelected = (e) => this.stateEvents.onScenarioSelected(e)
  onUIModeChanged = (e) => this.stateEvents.onUIModeChanged(e)
  onComparisonContextChanged = (e) => this.stateEvents.onComparisonContextChanged(e)
  onLayerCleared = () => this.stateEvents.onLayerCleared()
  onOpportunitySelected = (e) => this.stateEvents.onOpportunitySelected(e)

  onAccessibilityModeSelected = (e) => this.thematicRunner.onAccessibilityModeSelected(e)
  onComparisonDeltaSelected = (e) => this.thematicRunner.onComparisonDeltaSelected(e)

  onCellSelectionClear = () => this.selection?.clearCellSelected()

  fitToCellsBounds(features = this._cellsFeatures, padding = 60) {
    if (!features?.length) return
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
    const processCoords = (coords) => {
      if (typeof coords[0] === "number") {
        if (coords[0] < minLng) minLng = coords[0]
        if (coords[0] > maxLng) maxLng = coords[0]
        if (coords[1] < minLat) minLat = coords[1]
        if (coords[1] > maxLat) maxLat = coords[1]
      } else {
        coords.forEach(processCoords)
      }
    }
    features.forEach(f => { if (f.geometry?.coordinates) processCoords(f.geometry.coordinates) })
    if (minLng === Infinity) return
    this.map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding, essential: true })
  }

  syncCompareIfNeeded = () => {
    if (this._uiMode !== "comparador") return

    if (this._compareMode === "slider") {
      this.compareSlider?.syncData()
      return
    }

    if (this._compareMode === "split") {
      this.compareSplit?.syncData()
    }
  }

  onLayerSelected = (e) => {
    // 1) Actualiza el estado interno normal del mapa
    this.thematicLayer.onLayerSelected(e)

    // 2) Si estoy en comparador, refresca el renderer correcto
    this.syncCompareIfNeeded()
  }

  onProjectHover = (e) => {
    const { h3, total_agents, surface_per_agent, opportunity_name } = e.detail
    if (!h3) return

    // limpiar cualquier hover anterior
    this.onProjectHoverEnd()

    this.selection?.setCellSelected(h3)

    const tooltip = document.createElement("div")
    tooltip.className = "cell-tooltip"
    tooltip.style.position = "absolute"
    tooltip.style.backgroundColor = "rgba(17, 24, 39, 0.95)"
    tooltip.style.color = "#fff"
    tooltip.style.padding = "10px 14px"
    tooltip.style.borderRadius = "12px"
    tooltip.style.fontWeight = "700"
    tooltip.style.fontSize = "14px"
    tooltip.style.pointerEvents = "none"
    tooltip.style.whiteSpace = "nowrap"
    tooltip.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)"

    tooltip.innerHTML = `
      <div>${opportunity_name}</div>
      <div>Unidades: ${total_agents}</div>
      <div>Superficie por unidad: ${surface_per_agent}</div>
    `

    this._projectTooltip = tooltip
    this.map.getContainer().appendChild(tooltip)

    const feature = this.map.querySourceFeatures("cells")?.find(
      f => (f.properties?.h3 || f.id) === h3
    )

    if (feature?.geometry?.type === "Polygon") {
      const coord = feature.geometry.coordinates?.[0]?.[0]
      if (coord) {
        const p = this.map.project(coord)
        tooltip.style.left = `${p.x + 12}px`
        tooltip.style.top = `${p.y - 56}px`
      }
    }
  }

  onProjectHoverEnd = () => {
    this.selection?.clearCellSelected()

    if (this._projectTooltip) {
      this._projectTooltip.remove()
      this._projectTooltip = null
    }
  }
}
