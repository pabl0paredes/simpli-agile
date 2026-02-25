import { Controller } from "@hotwired/stimulus"
import { MapSelection } from "./map/map_selection"
import { MapHover } from "./map/map_hover"
import { MapThematic } from "./map/map_thematic"
import { MapLegend } from "./map/map_legend"
import { MapCellsLayer } from "./map/map_cells_layer"
import { MapAdminLayers } from "./map/map_admin_layers"
import { MapLocator } from "./map/map_locator"
import { MapStateEvents } from "./map/map_state_events"
import { MapThematicRunners } from "./map/map_thematic_runners"

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
      this.thematicLayer = new MapThematic(this)
      this.legend = new MapLegend(this)
      this.cellsLayer = new MapCellsLayer(this)
      this.adminLayers = new MapAdminLayers(this)
      this.locator = new MapLocator(this)
      this.stateEvents = new MapStateEvents(this)
      this.thematicRunner = new MapThematicRunners(this)

      this.adminLayers.ensureMunicipalitiesLayer()
      this.hover.bindMunicipalitiesHoverTooltip()
      this.adminLayers.bindMunicipalitiesClick()
      this.adminLayers.loadRegionsIntoMap()
      this.adminLayers.bindRegionsClick()

      window.addEventListener("region:selected", this.onRegionSelected)
      window.addEventListener("municipality:selected", this.onMunicipalitySelected)
      window.addEventListener("municipality:cleared", this.onMunicipalityCleared)
      window.addEventListener("layer:selected", this.thematicLayer.onLayerSelected)
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
    window.removeEventListener("layer:selected", this.thematicLayer?.onLayerSelected)
    window.removeEventListener("opportunity:selected", this.onOpportunitySelected)
    window.removeEventListener("accessibility:mode_selected", this.onAccessibilityModeSelected)
    window.removeEventListener("layer:cleared", this.onLayerCleared)
    window.removeEventListener("scenario:selected", this.onScenarioSelected)
    window.removeEventListener("cell:pick_start", this.selection?.onPickCellStart)
    window.removeEventListener("cell:pick_cancel", this.selection?.onPickCellCancel)
    window.removeEventListener("comparison:delta_selected", this.onComparisonDeltaSelected)
    window.removeEventListener("ui:mode_changed", this.onUIModeChanged)
    window.removeEventListener("comparison:context_changed", this.onComparisonContextChanged)
    window.removeEventListener("locator:opened", this.onLocatorOpened)
    window.removeEventListener("locator:closed", this.onLocatorClosed)
  }

  onRegionSelected = (e) => this.adminLayers.onRegionSelected(e)
  onMunicipalitySelected = (e) => this.adminLayers.onMunicipalitySelected(e)
  onMunicipalityCleared = () => this.adminLayers.onMunicipalityCleared()
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

  onScenarioSelected = (e) => this.stateEvents.onScenarioSelected(e)
  onUIModeChanged = (e) => this.stateEvents.onUIModeChanged(e)
  onComparisonContextChanged = (e) => this.stateEvents.onComparisonContextChanged(e)
  onLayerCleared = () => this.stateEvents.onLayerCleared()
  onOpportunitySelected = (e) => this.stateEvents.onOpportunitySelected(e)

  onAccessibilityModeSelected = (e) => this.thematicRunner.onAccessibilityModeSelected(e)
  onComparisonDeltaSelected = (e) => this.thematicRunner.onComparisonDeltaSelected(e)
}
