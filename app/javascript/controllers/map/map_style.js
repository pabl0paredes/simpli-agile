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

    this.c.map.setStyle(`mapbox://styles/mapbox/${styleId}`)
    this.c.map.once("style.load", () => this._reinitializeLayers(this.c.map))
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
