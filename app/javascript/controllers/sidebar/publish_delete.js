// app/javascript/controllers/sidebar/publish_delete.js

export function createPublishDelete(controller) {
  return {

    async recalculateAccessibilities() {
      const scenarioId = controller._selectedScenarioId
      if (!scenarioId) return alert("No hay escenario seleccionado.")
      if (controller._selectedScenarioIsBase) return alert("No puedes recalcular el escenario base.")

      if (controller.hasAddBtnTarget) controller.addBtnTarget.disabled = true
      if (controller.hasSaveScenarioBtnTarget) controller.saveScenarioBtnTarget.disabled = true

      try {
        const csrf = document.querySelector('meta[name="csrf-token"]').content

        const resp = await fetch(`/scenarios/${scenarioId}/recalculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf }
        })

        const json = await resp.json()

        if (!resp.ok) {
          console.error(json)
          return alert(json.error || "Error recalculando accesibilidades.")
        }

        controller._selectedScenarioStatus = "published"
        controller._draftScenarioId = null

        controller.closeLocator()

        controller.resetVisualizationStateAfterScenarioChange()

        if (controller.hasScenarioSelectTarget) controller.scenarioSelectTarget.disabled = false

        if (controller._selectedMunicipalityCode) {
          await controller.scenarios.loadScenariosIntoSelect(controller._selectedMunicipalityCode, scenarioId)
        }

        window.dispatchEvent(new CustomEvent("scenario:selected", {
          detail: { scenario_id: String(scenarioId), status: "published" }
        }))

        controller._api?.trackEvent("scenario_saved", {
          scenario_id: scenarioId,
          municipality_code: controller._selectedMunicipalityCode
        })

        alert("El Escenario ha sido actualizado y guardado exitosamente.")
      } finally {
        if (controller.hasAddBtnTarget) controller.addBtnTarget.disabled = false
        if (controller.hasSaveScenarioBtnTarget) controller.saveScenarioBtnTarget.disabled = false
      }
    },

    async deleteScenario() {
      const scenarioId = controller._selectedScenarioId || controller.scenarioSelectTarget?.value
      if (!scenarioId) return

      const opt = controller.scenarioSelectTarget?.selectedOptions?.[0]
      const isBase = (opt?.dataset?.isBase === "1")
      if (isBase) return alert("No puedes eliminar el Escenario Base.")

      if (controller._selectedScenarioStatus === "draft" && controller._hasDraftProjects) {
        return alert("Recalcula las accesibilidades antes de eliminar este Escenario, o elimínalo directamente desde el selector.")
      }

      const ok = confirm("¿Eliminar este Escenario y todos sus descendientes? Esta acción no se puede deshacer.")
      if (!ok) return

      const csrf = document.querySelector('meta[name="csrf-token"]').content

      const resp = await fetch(`/scenarios/${encodeURIComponent(scenarioId)}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrf }
      })

      const json = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        console.error(json)
        return alert(json.error || "Error eliminando Escenario.")
      }

      controller.resetVisualizationStateAfterScenarioChange()

      if (controller._selectedMunicipalityCode) {
        controller.loadScenariosIntoSelect(controller._selectedMunicipalityCode)
      }

      controller._draftScenarioId = null
      controller.syncScenarioActionsUI()

      alert("El Escenario ha sido eliminado exitosamente.")
    }
  }
}
