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

      // 3) reset oportunidad
      if (controller.hasOpportunitySelectTarget) {
        controller.opportunitySelectTarget.value = "Seleccionar uso..."
        // controller.opportunitySelectTarget.disabled = true
      }

      // 4) ocultar secciones que dependen de oportunidad/capas
      if (controller.hasLayerSectionTarget) controller.layerSectionTarget.hidden = true
      if (controller.hasLocateSectionTarget) controller.locateSectionTarget.hidden = true

      // 5) (opcional) volver a mostrar el hint de oportunidad
      const hint = controller.opportunitySelectTarget
        ?.closest('.sidebar__section')
        ?.querySelector('.sidebar__hint')
      if (hint) hint.style.display = ''
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

    applyOpportunityCategory(category) {
      const surfaceBtn = controller.element.querySelector('.sidebar__layer-btn[data-metric="surface"]')
      if (!surfaceBtn) return

      const isPOI = (category === "POI")
      surfaceBtn.hidden = isPOI // POI => ocultar superficie

      // si ocultamos superficie, asegurar que no quede activa
      if (isPOI && surfaceBtn.classList.contains("is-active")) {
        surfaceBtn.classList.remove("is-active")
        window.dispatchEvent(new CustomEvent("layer:cleared"))
      }
    },

    openPublishModal() {
      console.log("✅ openPublishModal() fired", controller._draftScenarioId)
      if (!controller._draftScenarioId) return alert("No hay borrador para guardar.")
      controller.publishNameInputTarget.value = ""
      controller.publishModalTarget.hidden = false

      // opcional UX: autofocus
      setTimeout(() => controller.publishNameInputTarget.focus(), 0)
    },

    closePublishModal() {
      controller.publishModalTarget.hidden = true
    },
  }
}
