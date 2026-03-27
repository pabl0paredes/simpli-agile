import { dataFetch } from "controllers/sidebar/api"

export class MapLocator {
  constructor(controller) {
    this.c = controller
  }

  // Mantiene la convención “safe” que ya usas para no romper si layer no existe
  safeSetVisibility(id, visible) {
    const map = this.c.map
    if (!map) return
    if (!map.getLayer(id)) return
    map.setLayoutProperty(id, "visibility", visible ? "visible" : "none")
  }

  snapshotBeforeOpen() {
    const source = this.c.map?.getSource("cells")
    if (!source) return

    // OJO: Mapbox no expone "getData()" oficial para geojson source en todas las versiones,
    // pero en Mapbox GL JS suele estar como source._data.
    // Si tú ya tenías una forma segura, usa esa misma.
    const currentData = source._data

    this.c._locatorPrev = {
      fc: currentData ? structuredClone(currentData) : null,
      breaks: this.c._cellsBreaks ? [...this.c._cellsBreaks] : null,
      wasVisible: this.c.map.getLayoutProperty("cells-fill", "visibility") !== "none",
      layerType: this.c._selectedLayerType || null,
      metric: this.c._selectedMetric || null,
      accessibilityMode: this.c._selectedAccessibilityMode || null
    }
  }

  async onOpened(event) {
    const municipalityCode = event.detail?.municipality_code
    const scenarioId = event.detail?.scenario_id

    this.c._inLocator = true

    if (!municipalityCode || !scenarioId) {
      console.warn("[locator] missing municipality_code/scenario_id", event.detail)
      return
    }

    this.snapshotBeforeOpen()

    this.c.ensureCellsLayer()
    const ok = this.c.ensureLocatorLayers()
    if (!ok) return

    // If a data layer is already visible, keep it — just overlay locator indicators on top
    const hasActiveLayer = !!(this.c._selectedLayerType &&
      this.c.map?.getLayoutProperty("cells-fill", "visibility") !== "none")

    this.c._locatorDataWasKept = hasActiveLayer

    // Clear any previously selected cell
    this.c.selection?.clearCellSelected()

    // Always fetch locator_status — populate cells-locator source for overlay layers
    // (red parent cells + draft hatch), regardless of whether a data layer is active
    try {
      const url = `/cells/locator_status?municipality_code=${encodeURIComponent(municipalityCode)}&scenario_id=${encodeURIComponent(scenarioId)}`

      const payload = await dataFetch(url).then(r => r.json())

      const fc = payload?.type === "FeatureCollection" ? payload : payload?.geojson || payload?.data

      if (fc) {
        // Always update the locator overlay source
        const locatorSrc = this.c.map.getSource("cells-locator")
        if (locatorSrc) locatorSrc.setData(fc)

        if (!hasActiveLayer) {
          // No data layer: also show cells for picking (transparent fill, border only)
          const cellsSrc = this.c.map.getSource("cells")
          if (cellsSrc) cellsSrc.setData(fc)

          this.c._locatorTransparentMode = true
          if (this.c.map.getLayer("cells-fill")) {
            this.c.map.setPaintProperty("cells-fill", "fill-opacity", 0)
          }

          this.c.setCellsVisible(true)
        }
      } else {
        console.warn("[locator] unexpected payload", payload)
      }

      this.safeSetVisibility("cells-draft-hatch", true)
      this.safeSetVisibility("cells-parent-fill", true)
    } catch (err) {
      console.error("Error onLocatorOpened:", err)
    }
  }

  onClosed() {
    this.c._inLocator = false
    this.c.ensureCellsLayer()

    this.safeSetVisibility("cells-parent-fill", false)
    this.safeSetVisibility("cells-draft-hatch", false)

    // Clear locator overlay source
    const locatorSrc = this.c.map.getSource("cells-locator")
    if (locatorSrc) locatorSrc.setData({ type: "FeatureCollection", features: [] })

    // Deselect any picked cell
    this.c.selection?.clearCellSelected()

    const prev = this.c._locatorPrev
    const dataWasKept = !!this.c._locatorDataWasKept
    this.c._locatorDataWasKept = false
    this.c._locatorTransparentMode = false

    // Restore metadata
    if (prev) {
      this.c._cellsBreaks = prev.breaks || null
      this.c._selectedLayerType = prev.layerType || this.c._selectedLayerType
    }

    // If cells data was never replaced, nothing to reload — leave as-is
    if (dataWasKept) {
      this.c._locatorPrev = null
      return
    }

    const layerType = this.c._selectedLayerType
    const metric = this.c._selectedMetric
    const accMode = this.c._selectedAccessibilityMode

    // Restore thematic layer
    if (
      layerType === "thematic" &&
      this.c._selectedMunicipalityCode &&
      this.c._selectedScenarioId &&
      this.c._selectedOpportunityCode &&
      metric
    ) {
      this.c.thematicLayer?.loadCellsThematic({
        municipalityCode: this.c._selectedMunicipalityCode,
        scenarioId: this.c._selectedScenarioId,
        opportunityCode: this.c._selectedOpportunityCode,
        metric: metric
      })

      this.c._locatorPrev = null
      return
    }

    // Restore accessibility layer
    if (
      layerType === "accessibility" &&
      this.c._selectedMunicipalityCode &&
      this.c._selectedScenarioId &&
      this.c._selectedOpportunityCode &&
      accMode
    ) {
      window.dispatchEvent(new CustomEvent("accessibility:mode_selected", {
        detail: { mode: accMode }
      }))

      this.c._locatorPrev = null
      return
    }

    // Fallback: no active layer — reset fill-opacity and hide cells
    if (this.c.map.getLayer("cells-fill")) {
      this.c.map.setPaintProperty("cells-fill", "fill-opacity", [
        "case",
        ["==", ["get", "class"], 0],
        0,
        0.75
      ])
    }

    const source = this.c.map.getSource("cells")
    if (source) source.setData({ type: "FeatureCollection", features: [] })

    this.c._cellsBreaks = null
    this.c.setCellsVisible(false)
    this.c.legend.hide?.()
    this.c.legend.showButtonIfNeeded?.()

    this.c._locatorPrev = null
  }
}
