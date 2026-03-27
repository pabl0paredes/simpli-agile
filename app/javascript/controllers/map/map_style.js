export class MapStyle {
  constructor(controller) {
    this.c = controller
    this._currentStyle = "streets-v11"
    this._pickerOpen = false
  }

  static styles = [
    { id: "streets-v11",          label: "Clásico",    icon: "fa-map" },
    { id: "satellite-streets-v12", label: "Satelital",  icon: "fa-satellite" },
    { id: "light-v11",             label: "Claro",      icon: "fa-sun" },
  ]

  togglePicker() {
    this._pickerOpen = !this._pickerOpen
    const panel = this.c.stylePickerPanelTarget
    if (!panel) return
    panel.hidden = !this._pickerOpen
  }

  closePicker() {
    this._pickerOpen = false
    if (this.c.hasStylePickerPanelTarget) this.c.stylePickerPanelTarget.hidden = true
  }

  select(styleId) {
    if (this._currentStyle === styleId) { this.closePicker(); return }
    this._currentStyle = styleId
    this.closePicker()
    this._updateActiveBtn()

    const url = `mapbox://styles/mapbox/${styleId}`

    // Main map
    this.c.map.setStyle(url)
    this.c.map.once("style.load", () => this._reinitializeLayers(this.c.map))

    // Collect active compare maps
    const slider = this.c.compareSlider
    const split  = this.c.compareSplit
    const compareMaps = [
      ...(slider?.enabled ? [slider.mapLeft, slider.mapRight] : []),
      ...(split?.enabled  ? [split.mapTop,  split.mapBottom]  : [])
    ].filter(Boolean)

    if (compareMaps.length === 0) return

    // Track how many style loads remain before re-syncing data
    let pending = compareMaps.length
    const onAllLoaded = () => {
      if (slider?.enabled) slider.syncData()
      if (split?.enabled)  split.syncData()
    }

    compareMaps.forEach(map => {
      map.setStyle(url)
      map.once("style.load", async () => {
        this.c.cellsLayer.ensure(map)
        await this.c.adminLayers.loadSelectedMunicipalityOutlineOn(map)
        if (--pending === 0) onAllLoaded()
      })
    })
  }

  _updateActiveBtn() {
    if (!this.c.hasStylePickerPanelTarget) return
    this.c.stylePickerPanelTarget.querySelectorAll(".map-style-picker__btn").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.styleId === this._currentStyle)
    })
  }

  _reinitializeLayers(map) {
    const c = this.c

    // Reset binding flags so layers are re-bound on the new style
    c.hover._regionsHoverBound = false
    c.hover._muniHoverBound = false
    c.hover._cellsHoverBound = false
    c._regionsClickBound = false
    c._municipalitiesClickBound = false

    c.adminLayers.ensureMunicipalitiesLayer(map)
    c.hover.bindMunicipalitiesHoverTooltip()
    c.adminLayers.loadRegionsIntoMap()
    c.adminLayers.bindRegionsClick()
    c.adminLayers.bindMunicipalitiesClick()

    if (c._selectedMunicipalityCode) {
      c.adminLayers.setRegionsVisible(false)
      c.adminLayers.setMunicipalitiesVisible(false)
      c.adminLayers.loadSelectedMunicipalityOutlineOn(map)
    }

    if (c._inLocator) {
      // Locator is open — re-trigger locator data load on the new style
      c.cellsLayer.ensure(map)
      c.ensureLocatorLayers()
      window.dispatchEvent(new CustomEvent("locator:opened", {
        detail: {
          municipality_code: c._selectedMunicipalityCode,
          scenario_id: c._selectedScenarioId
        }
      }))
    } else if (c._cellsFeatures?.length) {
      c.cellsLayer.ensure(map)
      map.getSource("cells")?.setData({ type: "FeatureCollection", features: c._cellsFeatures })
      c.setCellsVisible(true)
    }
  }
}
