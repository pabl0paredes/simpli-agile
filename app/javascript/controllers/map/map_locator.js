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
    const baseScenarioId = event.detail?.base_scenario_id
    const draftScenarioId = event.detail?.draft_scenario_id

    this.c._inLocator = true

    // Si tu flujo depende de estos, mantenemos el guard
    if (!municipalityCode || !baseScenarioId) {
      console.warn("[locator] missing municipality_code/base_scenario_id", event.detail)
      return
    }

    this.snapshotBeforeOpen()

    // Asegura cells + overlays (esto ya lo movimos a MapCellsLayer en Paso 2)
    this.c.ensureCellsLayer()
    const ok = this.c.ensureLocatorLayers()
    if (!ok) return

    try {
      let url = `/cells/locator_status?municipality_code=${encodeURIComponent(municipalityCode)}&base_scenario_id=${encodeURIComponent(baseScenarioId)}`
      if (draftScenarioId) {
        url += `&draft_scenario_id=${encodeURIComponent(draftScenarioId)}`
      }

      const payload = await fetch(url, { headers: { "Accept": "application/json" } }).then(r => r.json())

      // payload debe ser FeatureCollection o algo que tu controller ya sabe consumir;
      // por como lo tenías, asumimos que ya viene listo para setData del source "cells"
      // Si tu payload viene como { features: [...] } o { data: ... }, ajustamos aquí.
      const fc = payload?.type === "FeatureCollection" ? payload : payload?.geojson || payload?.data

      if (fc) {
        const src = this.c.map.getSource("cells")
        if (src) src.setData(fc)
      } else {
        console.warn("[locator] unexpected payload", payload)
      }

      // Mostrar overlays del locator (parent fill + hatch draft)
      this.safeSetVisibility("cells-draft-hatch", true)
      this.safeSetVisibility("cells-parent-fill", true)

      // Importante: si el UX pide que al abrir locator se vean celdas, nos aseguramos
      this.c.setCellsVisible(true)

      // Si tu UI tiene botón de leyenda, normalmente en locator no la queremos;
      // pero no lo cambio. Si quieres: this.c.hideLegend()
    } catch (err) {
      console.error("Error onLocatorOpened:", err)
    }
  }

  onClosed() {
    this.c._inLocator = false
    this.c.ensureCellsLayer()

    this.safeSetVisibility("cells-parent-fill", false)
    this.safeSetVisibility("cells-draft-hatch", false)

    const prev = this.c._locatorPrev

    // restaurar solo metadata auxiliar, no la data cruda del locator
    if (prev) {
      this.c._cellsBreaks = prev.breaks || null
      this.c._selectedLayerType = prev.layerType || this.c._selectedLayerType
    }

    const layerType = this.c._selectedLayerType
    const metric = this.c._selectedMetric
    const accMode = this.c._selectedAccessibilityMode

    // ✅ si hay capa temática activa, recargarla desde el estado actual
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

    // ✅ si hay accesibilidad activa, re-disparar su carga
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

    // fallback: si no había capa activa, limpiar
    const source = this.c.map.getSource("cells")
    if (source) source.setData({ type: "FeatureCollection", features: [] })

    this.c._cellsBreaks = null
    this.c.setCellsVisible(false)
    this.c.legend.hide?.()
    this.c.legend.showButtonIfNeeded?.()

    this.c._locatorPrev = null
  }
}
