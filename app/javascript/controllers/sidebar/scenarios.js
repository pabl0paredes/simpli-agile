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
        controller._hasBaseScenario = !!baseId

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
      if (previousStatus === "draft" && controller._hasDraftProjects && String(newScenarioId) !== String(previousScenarioId)) {
        controller.scenarioSelectTarget.value = previousScenarioId
        alert("Estás en un borrador con proyectos. Guarda los cambios antes de cambiar de escenario.")
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
      controller._selectedScenarioStatus = e.detail.status

      const opt = controller.scenarioSelectTarget.selectedOptions?.[0]
      controller._selectedScenarioIsBase = (opt?.dataset?.isBase === "1")

      if (e.detail.status === "draft") {
        controller._draftScenarioId = e.detail.scenario_id
      } else {
        controller._draftScenarioId = null
      }

      controller.refreshProjectsLists()
    },

    openCreateScenarioModal() {
      if (!controller._selectedMunicipalityCode) return alert("Selecciona una comuna primero.")

      const parentName = controller.scenarioSelectTarget?.selectedOptions?.[0]?.textContent?.trim() || "—"
      if (controller.hasScenarioParentDisplayTarget) {
        controller.scenarioParentDisplayTarget.textContent = parentName
      }

      controller.publishNameInputTarget.value = ""
      controller.publishModalTarget.hidden = false
      setTimeout(() => controller.publishNameInputTarget.focus(), 0)
    },

    closeCreateScenarioModal() {
      controller.publishModalTarget.hidden = true
    },

    async confirmCreateScenario() {
      const name = controller.publishNameInputTarget.value?.trim()
      if (!name) return alert("Escribe un nombre para el escenario.")

      const csrf = document.querySelector('meta[name="csrf-token"]').content

      const baseScenarioId = controller._selectedScenarioIsBase
        ? controller._selectedScenarioId
        : null

      const resp = await fetch("/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({
          municipality_code: controller._selectedMunicipalityCode,
          name,
          base_scenario_id: baseScenarioId
        })
      })

      const json = await resp.json()
      if (!resp.ok) return alert(json.error || "Error creando escenario.")

      controller.scenarios.closeCreateScenarioModal()

      await controller.scenarios.loadScenariosIntoSelect(
        controller._selectedMunicipalityCode,
        json.scenario_id
      )
    }
  }
}
