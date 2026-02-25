// app/javascript/controllers/sidebar/publish_delete.js

export function createPublishDelete(controller) {
  return {
    // -------------------------
    // Métodos (mismos nombres)
    // -------------------------

    openPublishModal() {
      console.log("✅ openPublishModal() fired", controller._draftScenarioId)
      if (!controller._draftScenarioId) return alert("No hay borrador para guardar.")
      controller.publishNameInputTarget.value = ""
      controller.publishModalTarget.hidden = false
      setTimeout(() => controller.publishNameInputTarget.focus(), 0)
    },

    closePublishModal() {
      controller.publishModalTarget.hidden = true
    },

    async confirmPublishScenario() {
      const scenarioId = controller._draftScenarioId
      if (!scenarioId) return alert("No hay borrador para guardar.")

      const name = controller.publishNameInputTarget.value?.trim()
      if (!name) return alert("Escribe un nombre para el escenario.")

      const csrf = document.querySelector('meta[name="csrf-token"]').content

      if (controller.hasAddBtnTarget) controller.addBtnTarget.disabled = true

      try {
        const resp = await fetch(`/scenarios/${scenarioId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
          body: JSON.stringify({ name })
        })

        const json = await resp.json()

        if (!resp.ok) {
          console.error(json)
          return alert(json.error || "Error publicando escenario")
        }

        controller.closePublishModal()

        // ✅ el draft ahora es published (mismo id)
        controller._draftScenarioId = null
        controller._selectedScenarioId = String(scenarioId)
        controller._selectedScenarioStatus = "published"

        // ✅ desbloquear selector
        if (controller.hasScenarioSelectTarget) controller.scenarioSelectTarget.disabled = false

        // ✅ recargar selector, pero manteniendo seleccionado el published
        if (controller._selectedMunicipalityCode) {
          await controller.scenarios.loadScenariosIntoSelect(controller._selectedMunicipalityCode, String(scenarioId))
        }

        // ✅ avisar al mapa
        window.dispatchEvent(new CustomEvent("scenario:selected", {
          detail: { scenario_id: String(scenarioId), status: "published" }
        }))

        await controller.refreshProjectsLists()

        alert("Escenario guardado y accesibilidades recalculadas ✅")
      } finally {
        if (controller.hasAddBtnTarget) controller.addBtnTarget.disabled = false
      }
    },

    async deleteScenario() {
      const scenarioId = controller._selectedScenarioId || controller.scenarioSelectTarget?.value
      if (!scenarioId) return

      const opt = controller.scenarioSelectTarget?.selectedOptions?.[0]
      const isBase = (opt?.dataset?.isBase === "1")
      if (isBase) return alert("No puedes eliminar el escenario base.")

      if (controller._draftScenarioId) {
        return alert("Tienes un borrador activo. Guarda/recalcula o descártalo antes de eliminar.")
      }

      const ok = confirm("¿Eliminar este escenario y todos sus descendientes? Esta acción no se puede deshacer.")
      if (!ok) return

      const csrf = document.querySelector('meta[name="csrf-token"]').content

      const resp = await fetch(`/scenarios/${encodeURIComponent(scenarioId)}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrf }
      })

      const json = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        console.error(json)
        return alert(json.error || "Error eliminando escenario.")
      }

      // limpiar mapa/capas
      window.dispatchEvent(new CustomEvent("layer:cleared"))
      controller.clearLayerButtonsUI()

      // recargar escenarios de la comuna
      if (controller._selectedMunicipalityCode) {
        // (sin cambiar firma de loadScenariosIntoSelect)
        controller.loadScenariosIntoSelect(controller._selectedMunicipalityCode)
      }

      controller._draftScenarioId = null

      alert("Escenario eliminado ✅")
    }
  }
}
