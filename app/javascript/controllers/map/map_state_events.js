export class MapStateEvents {
  constructor(controller) {
    this.c = controller
  }

  onScenarioSelected = (event) => {
    this.c._selectedScenarioId = event.detail.scenario_id
    this.c._selectedScenarioStatus = event.detail.status

    // 🔒 Si el locator está abierto NO limpiar las celdas
    if (this.c._inLocator) return

    // ✅ Cambió el escenario: limpia lo pintado para evitar “data pegada”
    this.onLayerCleared()
  }

  onUIModeChanged = (e) => {
    this.c._uiMode = e.detail?.mode

    if (this.c._uiMode === "comparador") this.c._compareMode = "delta"
    this.c.setCellsVisible(false)

    const useSlider = (this.c._uiMode === "comparador" && this.c._compareMode === "slider")
    this.c.compareSlider?.setEnabled(useSlider)

    const useSplit = (this.c._uiMode === "comparador" && this.c._compareMode === "split")
    this.c.compareSplit?.setEnabled(useSplit)

    // opcional: si quieres limpiar al entrar comparador, lo mantienes acá
  }

  onComparisonContextChanged = (e) => {
    this.c._scenarioAId = e.detail?.scenario_a_id
    this.c._scenarioBId = e.detail?.scenario_b_id
    this.c._compareMode = e.detail?.compare_mode

    const useSlider = (this.c._uiMode === "comparador" && this.c._compareMode === "slider")
    const useSplit = (this.c._uiMode === "comparador" && this.c._compareMode === "split")

    // Disable inactive modes first — avoids container visibility conflicts when switching modes
    // (e.g. split.disable() sets mapContainer visible; if called AFTER slider.enable() it undoes it)
    const sliderWasEnabled = this.c.compareSlider?.enabled
    const splitWasEnabled = this.c.compareSplit?.enabled

    if (!useSlider) this.c.compareSlider?.setEnabled(false)
    if (!useSplit) this.c.compareSplit?.setEnabled(false)

    if (useSlider) {
      this.c.compareSlider?.setEnabled(true)
      // Only call syncData() directly when slider was already running (maps are loaded).
      // For a fresh enable, onBothLoaded handles the initial data load.
      if (sliderWasEnabled) this.c.compareSlider?.syncData()
    }

    if (useSplit) {
      this.c.compareSplit?.setEnabled(true)
      if (splitWasEnabled) this.c.compareSplit?.syncData()
    }
  }

  onOpportunitySelected = (event) => {
    this.c._selectedOpportunityCode = event.detail.opportunity_code
    this.c._selectedAccessibilityType = event.detail.category === "POI" ? "units" : "surface"
    this.c._hasFitCells = false // reset so next cell load zooms to fit
    if (this.c._uiMode === "comparador" && this.c._compareMode === "slider") {
      this.c.compareSlider?.syncData()
      return
    }

    if (this.c._uiMode === "comparador" && this.c._compareMode === "split") {
      this.c.compareSplit?.syncData()
      return
    }
    console.log("✅ guardé opp:", this.c._selectedOpportunityCode)
  }

  onLayerCleared = () => {
    // apaga visibilidad
    this.c.setCellsVisible(false)

    // limpia data para que no quede “pegado”
    const src = this.c.map.getSource("cells")
    if (src) src.setData({ type: "FeatureCollection", features: [] })

    this.c._cellsBreaks = null
    this.c._cellsFeatures = null
    this.c._selectedMetric = null
    this.c._selectedLayerType = null
    this.c._selectedAccessibilityMode = null

    if (this.c._clearCellsHover) this.c._clearCellsHover()

    this.c.legend.hide()
    this.c.legend.showButtonIfNeeded()
    this.c.legend.clearClassFocus()
    this.c.dashboard?.hide()
  }
}
