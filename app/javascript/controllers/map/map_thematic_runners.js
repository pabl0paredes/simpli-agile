export class MapThematicRunners {
  constructor(controller) {
    this.c = controller
  }

  onAccessibilityModeSelected = async (event) => {
    const mode = event.detail.mode
    if (!this.c._selectedMunicipalityCode) return
    if (!this.c._selectedOpportunityCode) return

    const inComparator = (this.c._uiMode === "comparador")
    const isDelta = (this.c._compareMode === "delta")
    const isSlider = (this.c._compareMode === "slider")
    const isSplit = (this.c._compareMode === "split")

    // ✅ actualizar estado SIEMPRE antes de refrescar
    this.c._selectedLayerType = "accessibility"
    this.c._selectedAccessibilityMode = mode
    this.c._selectedMetric = null

    this.c.ensureCellsLayer()

    if (inComparator && isDelta) {
      if (!this.c._scenarioAId || !this.c._scenarioBId) return

      const url =
        `/cells/accessibility_delta?municipality_code=${encodeURIComponent(this.c._selectedMunicipalityCode)}` +
        `&mode=${encodeURIComponent(mode)}` +
        `&opportunity_code=${encodeURIComponent(this.c._selectedOpportunityCode)}` +
        `&scenario_a_id=${encodeURIComponent(this.c._scenarioAId)}` +
        `&scenario_b_id=${encodeURIComponent(this.c._scenarioBId)}`

      const fc = await fetch(url).then(r => r.json())

      this.c.map.getSource("cells").setData({ type: "FeatureCollection", features: fc.features })
      this.c._cellsBreaks = fc.breaks

      this.c.setCellsVisible(true)
      this.c.legend.render()
      this.c.legend.showButtonIfNeeded()
      return
    }

    if (inComparator && isSlider) {
      this.c.compareSlider?.syncData()
      return
    }

    if (inComparator && isSplit) {
      this.c.compareSplit?.syncData()
      return
    }

    const scenarioId = this.c._selectedScenarioId

    const url =
      `/cells/accessibility?municipality_code=${encodeURIComponent(this.c._selectedMunicipalityCode)}` +
      `&mode=${encodeURIComponent(mode)}` +
      `&opportunity_code=${encodeURIComponent(this.c._selectedOpportunityCode)}` +
      `&scenario_id=${encodeURIComponent(scenarioId)}`

    const fc = await fetch(url).then(r => r.json())

    this.c.map.getSource("cells").setData({
      type: "FeatureCollection",
      features: fc.features
    })

    this.c._cellsBreaks = fc.breaks
    this.c.setCellsVisible(true)

    this.c.legend.render()
    this.c.legend.showButtonIfNeeded()
    this.c.legend.show()
  }

  onComparisonDeltaSelected = async (event) => {
    const { scenario_a_id, scenario_b_id, opportunity_code, metric } = event.detail

    if (!this.c._selectedMunicipalityCode) return
    if (!scenario_a_id || !scenario_b_id) return
    if (!opportunity_code || !metric) return

    this.c._selectedLayerType = "metric"  // ✅ o "metric" si prefieres
    this.c._selectedMetric = metric         // metric = "surface" | "units"
    this.c._selectedOpportunityCode = opportunity_code

    this.c.ensureCellsLayer()

    const url =
      `/cells/delta?municipality_code=${encodeURIComponent(this.c._selectedMunicipalityCode)}` +
      `&scenario_a_id=${encodeURIComponent(scenario_a_id)}` +
      `&scenario_b_id=${encodeURIComponent(scenario_b_id)}` +
      `&opportunity_code=${encodeURIComponent(opportunity_code)}` +
      `&metric=${encodeURIComponent(metric)}`

    const payload = await fetch(url).then(r => r.json())

    this.c.map.getSource("cells").setData({
      type: "FeatureCollection",
      features: payload.features
    })

    this.c._cellsBreaks = payload.breaks
    this.c.setCellsVisible(true)

    this.c.legend.render()
    this.c.legend.showButtonIfNeeded()
    this.c.legend.show()
  }
}
