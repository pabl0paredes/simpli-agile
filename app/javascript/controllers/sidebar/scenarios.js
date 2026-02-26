// app/javascript/controllers/sidebar/scenarios.js

export function createScenarios(controller) {
  return {
    // -------------------------
    // Métodos (mismos nombres)
    // -------------------------

    loadScenariosIntoSelect(munCode, selectedId = null) {
      if (!controller.hasScenarioSelectTarget) return

      controller.scenarioSectionTarget.hidden = false
      controller.scenarioSelectTarget.disabled = true
      if (controller.hasScenarioHintTarget) controller.scenarioHintTarget.style.display = "none"

      fetch(`/scenarios/names?municipality_code=${encodeURIComponent(munCode)}`)
      .then(r => r.json())
      .then(data => {
        const selector = controller.scenarioSelectTarget
        selector.innerHTML = "<option>Seleccionar escenario...</option>"

        let baseId = null

        data.forEach(s => {
          const option = document.createElement("option")
          option.value = s.id
          option.textContent = s.name
          option.dataset.isBase = s.is_base ? "1" : "0"
          option.dataset.status = s.status
          selector.appendChild(option)
          if (s.is_base) baseId = String(s.id)
        })

        selector.disabled = false

        // ✅ decide qué seleccionar
        const idToSelect = selectedId ? String(selectedId) : baseId
        if (idToSelect) {
          selector.value = idToSelect
          controller._selectedScenarioId = idToSelect

          const opt = selector.selectedOptions?.[0]
          const status = opt?.dataset?.status

          window.dispatchEvent(new CustomEvent("scenario:selected", {
            detail: { scenario_id: idToSelect, status }
          }))
        }
        controller.syncScenarioActionsUI()
      })
      .catch(err => {
        console.error("Error cargando escenarios:", err)
        controller.scenarioSelectTarget.disabled = true
      })
    },

    scenarioChanged(e) {
      const newScenarioId = e.target.value
      if (!newScenarioId || newScenarioId.includes("Seleccionar")) return

      const previousScenarioId = controller._selectedScenarioId
      const previousStatus = controller._selectedScenarioStatus

      // 🔒 Bloqueo correcto: usar estado interno, no el select
      if (previousStatus === "draft" && String(newScenarioId) !== String(previousScenarioId)) {
        controller.scenarioSelectTarget.value = previousScenarioId
        alert("Estás en un borrador. Publica/guarda antes de cambiar de escenario.")
        return
      }

      // ✅ Si el locator está abierto, ciérralo como corresponde
      if (!controller.locatorPanelTarget.hidden) {
        controller.closeLocator()
      }

      // ✅ 1) Despejar todo (UI + mapa) antes de cambiar scenario
      window.dispatchEvent(new CustomEvent("layer:cleared"))
      controller.clearLayerButtonsUI()

      if (controller.hasAccessibilityChoicesTarget)
        controller.accessibilityChoicesTarget.hidden = true

      if (controller.hasPickCellModalTarget)
        controller.pickCellModalTarget.hidden = true

      const opt = controller.scenarioSelectTarget.selectedOptions?.[0]
      const isBase = (opt?.dataset?.isBase === "1")
      const newStatus = opt?.dataset?.status

      controller._selectedScenarioIsBase = isBase
      controller._selectedScenarioStatus = newStatus
      controller._selectedScenarioId = String(newScenarioId)

      if (controller.hasDeleteScenarioBtnTarget) {
        controller.deleteScenarioBtnTarget.hidden = isBase
      }

      // ✅ 2) Cambiar scenario
      window.dispatchEvent(new CustomEvent("scenario:selected", {
        detail: {
          scenario_id: String(newScenarioId),
          status: newStatus
        }
      }))

      controller.syncScenarioActionsUI()
    },

    onScenarioSelected(e) {
      controller._selectedScenarioId = e.detail.scenario_id

      const opt = controller.scenarioSelectTarget.selectedOptions?.[0]
      controller._selectedScenarioIsBase = (opt?.dataset?.isBase === "1")

      controller.refreshProjectsLists()
    }
  }
}
