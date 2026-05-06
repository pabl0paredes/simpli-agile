// app/javascript/controllers/sidebar/ui_state.js

export function createUIState(controller) {
  return {
    // -------------------------
    // Métodos UI (mismos nombres)
    // -------------------------

    resetAfterMunicipalityChange() {
      // 1) limpiar mapa (celdas)
      window.dispatchEvent(new CustomEvent("layer:cleared"))

      // 2) reset UI capas
      controller.clearLayerButtonsUI()

      // Limpiar escenarios
      if (controller.hasScenarioSelectTarget) {
        controller.scenarioSelectTarget.innerHTML = "<option>Seleccionar escenario...</option>"
        controller.scenarioSelectTarget.disabled = true
        controller.scenarioSectionTarget.hidden = true
        if (controller.hasScenarioHintTarget) controller.scenarioHintTarget.style.display = ""
      }

      if (controller._selectedCellId) {
        controller.map.setFeatureState(
          { source: "cells", id: controller._selectedCellId },
          { selected: false }
        )
        controller._selectedCellId = null
      }

      // 2b) ocultar botones de acción de escenario
      if (controller.hasAddScenarioBtnTarget) controller.addScenarioBtnTarget.hidden = true
      if (controller.hasSaveScenarioBtnTarget) controller.saveScenarioBtnTarget.hidden = true
      if (controller.hasDeleteScenarioBtnTarget) controller.deleteScenarioBtnTarget.hidden = true

      // 3) reset oportunidad
      controller._hasBaseScenario = false
      controller._hasDraftProjects = false
      controller._noBaseScenario = false
      if (controller.hasNoDataSectionTarget) controller.noDataSectionTarget.hidden = true
      if (controller.hasOpportunitySelectTarget) {
        controller.opportunitySelectTarget.value = "Seleccionar oportunidad..."
        controller.opportunitySelectTarget.disabled = true
      }
      if (controller.hasOpportunitySectionTarget) controller.opportunitySectionTarget.hidden = true

      // 4) ocultar secciones que dependen de oportunidad/capas
      if (controller.hasLayerSectionTarget) controller.layerSectionTarget.hidden = true
      if (controller.hasLocateSectionTarget) controller.locateSectionTarget.hidden = true
      if (controller.hasNormativeSectionTarget) controller.normativeSectionTarget.hidden = true

      // 5) reset municipality access flag + hide no-access notice
      controller._hasAccess = false
      controller._features  = []
      window.dispatchEvent(new CustomEvent("municipality:features_loaded", { detail: { features: [] } }))
      if (controller.hasNoAccessSectionTarget) controller.noAccessSectionTarget.hidden = true

    },

    clearLayerButtonsUI() {
      // botones principales
      controller.element.querySelectorAll(".sidebar__layer-btn")
        .forEach(b => b.classList.remove("is-active"))

      // sub-botones accesibilidad
      if (controller.hasAccessibilityChoicesTarget) {
        controller.accessibilityChoicesTarget.hidden = true
        controller.accessibilityChoicesTarget
          .querySelectorAll(".sidebar__subchoice-btn")
          .forEach(b => b.classList.remove("is-active"))
      }
    },

    applyOpportunityCategory(category, opportunityCode) {
      const surfaceBtn  = controller.element.querySelector('.sidebar__layer-btn[data-metric="surface"]')
      const accBtn      = controller.element.querySelector('.sidebar__layer-btn[data-layer="accessibility"]')
      const attrWrap    = controller.element.querySelector('.sidebar__layer-btn-wrap')

      const isPOI       = (category === "POI")
      const isResidential = ["HC", "HD", "P"].includes(opportunityCode)

      if (surfaceBtn) {
        surfaceBtn.hidden = isPOI
        if (isPOI && surfaceBtn.classList.contains("is-active")) {
          surfaceBtn.classList.remove("is-active")
          window.dispatchEvent(new CustomEvent("layer:cleared"))
        }
      }

      const isDelta = controller._compareMode === "delta" && controller._uiMode === "comparador"
      if (accBtn) accBtn.hidden = isResidential || isDelta
      if (attrWrap) attrWrap.hidden = isResidential || isDelta

      if (isResidential) {
        controller._selectedLayerType = null
        controller.accessibilityChoicesTarget.hidden = true
        controller.accessibilityChoicesTarget
          .querySelectorAll(".sidebar__subchoice-btn")
          .forEach(b => b.classList.remove("is-active"))
        // layer:cleared ya fue despachado en opportunityChanged, pero lo reforzamos
        // para asegurarnos que el mapa limpie cualquier capa de accesibilidad activa
        window.dispatchEvent(new CustomEvent("layer:cleared"))
      }
    },

  }
}
