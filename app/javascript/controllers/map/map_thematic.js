// app/javascript/controllers/map_thematic.js
export class MapThematic {
  constructor(ctx) {
    this.ctx = ctx // ctx = map_controller (tiene this.map, estado, ensureCellsLayer, etc.)
  }

  onLayerSelected = (event) => {
    const metric = event.detail.metric

    // ⚠️ actualizar estado SIEMPRE
    this.setSelectedMetric(metric)

    if (this.ctx._uiMode === "comparador" && this.ctx._compareMode === "slider") {
      this.ctx.compareSlider?.syncData()
      return
    }

    if (this.ctx._uiMode === "comparador" && this.ctx._compareMode === "split") {
      this.ctx.compareSplit?.syncData()
      return
    }

    if (!this.canLoad()) return

    this.loadCellsThematic({
      municipalityCode: this.ctx._selectedMunicipalityCode,
      scenarioId: this.ctx._selectedScenarioId,
      opportunityCode: this.ctx._selectedOpportunityCode,
      metric: metric
    })
  }

  setSelectedMetric(metric) {
    this.ctx._selectedMetric = metric
    this.ctx._selectedLayerType = "thematic"
    this.ctx._selectedAccessibilityMode = null
  }

  canLoad() {
    return !!(this.ctx._selectedMunicipalityCode && this.ctx._selectedOpportunityCode && this.ctx._selectedScenarioId)
  }

  async loadCellsThematic({ municipalityCode, scenarioId, opportunityCode, metric }) {
    this.ctx.ensureCellsLayer()

    const url =
      `/cells/thematic?municipality_code=${encodeURIComponent(municipalityCode)}` +
      `&scenario_id=${encodeURIComponent(scenarioId)}` +               // ✅ NUEVO
      `&opportunity_code=${encodeURIComponent(opportunityCode)}` +
      `&metric=${encodeURIComponent(metric)}`

    const payload = await fetch(url).then(r => r.json())

    this.ctx.map.getSource("cells").setData({
      type: "FeatureCollection",
      features: payload.features
    })

    this.ctx._cellsBreaks = payload.breaks
    this.ctx.setCellsVisible(true)

    this.ctx.legend.render()
    this.ctx.legend.showButtonIfNeeded()
    this.ctx.legend.show()
  }
}
