// app/javascript/controllers/sidebar/locator.js

export function createLocator(controller) {
  return {
    // -------------------------
    // Métodos (mismos nombres)
    // -------------------------

    loadLocatorOpportunitiesIntoSelect() {
      if (!controller.hasLocatorOpportunitySelectTarget) return

      fetch("/opportunities")
        .then(r => r.json())
        .then(data => {
          const selector = controller.locatorOpportunitySelectTarget
          selector.innerHTML = "<option>Seleccionar oportunidad...</option>"

          data.forEach(op => {
            const option = document.createElement("option")
            option.value = op.opportunity_code
            option.textContent = op.name
            selector.appendChild(option)
          })

          selector.disabled = false
        })
        .catch(err => console.error("Error cargando oportunidades (localizador):", err))
    },

    toggleLocator() {
      const opening = controller.locatorPanelTarget.hidden
      controller.locatorPanelTarget.hidden = !controller.locatorPanelTarget.hidden

      if (!controller.locatorPanelTarget.hidden) {
        controller.locatorPanelTarget.style.left = controller.collapsed ? "0px" : "300px"
      }

      if (opening) {
        // ✅ SNAPSHOT ANTES de modificar UI
        controller.snapshotSidebarBeforeOpen()

        // ✅ clear + disable sidebar principal
        if (controller.hasOpportunitySelectTarget) {
          controller.opportunitySelectTarget.value = "Seleccionar oportunidad..."
          controller.opportunitySelectTarget.disabled = true
        }
        if (controller.hasScenarioSelectTarget) controller.scenarioSelectTarget.disabled = true
        controller.clearLayerButtonsUI()
        controller.element.querySelectorAll(".sidebar__layer-btn").forEach(b => {
          b.disabled = true
          b.classList.add("is-disabled")
        })
        if (controller.hasLayerSectionTarget) controller.layerSectionTarget.hidden = true

        window.dispatchEvent(new CustomEvent("locator:opened", {
          detail: {
            municipality_code: controller._selectedMunicipalityCode,
            scenario_id: controller._selectedScenarioId
          }
        }))
      } else {
        // ✅ RESTORE exacto
        controller.restoreSidebarAfterClose()
        // ✅ re-enable
        if (controller.hasOpportunitySelectTarget) controller.opportunitySelectTarget.disabled = false
        if (controller.hasScenarioSelectTarget) controller.scenarioSelectTarget.disabled = false
        controller.element.querySelectorAll(".sidebar__layer-btn").forEach(b => {
          b.disabled = false
          b.classList.remove("is-disabled")
        })

        window.dispatchEvent(new CustomEvent("locator:closed"))
      }
    },

    startPickCell() {
      controller.pickCellModalTarget.hidden = false
      window.dispatchEvent(new CustomEvent("cell:pick_start"))

      controller._onEscPickCell = (ev) => {
        if (ev.key === "Escape") controller.cancelPickCell()
      }
      window.addEventListener("keydown", controller._onEscPickCell)
    },

    cancelPickCell() {
      controller.pickCellModalTarget.hidden = true
      window.dispatchEvent(new CustomEvent("cell:pick_cancel"))

      if (controller._onEscPickCell) {
        window.removeEventListener("keydown", controller._onEscPickCell)
        controller._onEscPickCell = null
      }
    },

    onCellPicked(e) {
      const { h3, show_id } = e.detail

      controller.selectedCellH3Target.value = h3
      controller.selectedCellDisplayTarget.value = `Celda ${show_id ?? ""}`.trim()

      controller.pickCellModalTarget.hidden = true

      if (controller.hasLocatorOpportunitySelectTarget) {
        controller.locatorOpportunitySelectTarget.disabled = false
      }

      window.dispatchEvent(new CustomEvent("cell:pick_cancel"))

      if (controller._onEscPickCell) {
        window.removeEventListener("keydown", controller._onEscPickCell)
        controller._onEscPickCell = null
      }
    },

    async addProject() {
      const scenarioId = controller._selectedScenarioId

      if (!scenarioId) return alert("Selecciona un escenario primero.")
      if (controller._selectedScenarioIsBase) return alert("No puedes agregar proyectos al escenario base. Crea un escenario propio con el botón '+'.")

      const name = controller.projectNameInputTarget.value?.trim()
      const h3 = controller.selectedCellH3Target.value
      const opportunityCode = controller.locatorOpportunitySelectTarget.value
      const units = Number(controller.unitsInputTarget.value)
      const areaPerUnit = Number(controller.areaPerUnitInputTarget.value)

      if (!name) return alert("Pon un nombre al proyecto.")
      if (!h3) return alert("Selecciona una celda.")
      if (!opportunityCode || opportunityCode.includes("Seleccionar")) return alert("Selecciona una oportunidad.")
      if (!Number.isFinite(units) || units <= 0) return alert("Unidades debe ser > 0.")
      if (!Number.isFinite(areaPerUnit) || areaPerUnit <= 0) return alert("Superficie por unidad debe ser > 0.")

      const csrf = document.querySelector('meta[name="csrf-token"]').content

      const resp = await fetch("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({
          scenario_id: scenarioId,
          project: {
            name,
            h3,
            opportunity_code: opportunityCode,
            total_agents: units,
            surface_per_agent: areaPerUnit
          }
        })
      })

      const json = await resp.json()
      if (!resp.ok) {
        console.error(json)
        return alert(json.error || (json.errors || ["Error guardando"]).join("\n"))
      }

      // UX reset inputs
      controller.projectNameInputTarget.value = ""
      controller.unitsInputTarget.value = ""
      controller.areaPerUnitInputTarget.value = ""
      controller.selectedCellH3Target.value = ""
      controller.selectedCellDisplayTarget.value = ""
      controller.locatorOpportunitySelectTarget.value = "Seleccionar oportunidad..."

      window.dispatchEvent(new CustomEvent("cell:pick_cancel"))
      window.dispatchEvent(new CustomEvent("cell:selection_clear"))

      await controller.refreshProjectsLists()

      window.dispatchEvent(new CustomEvent("locator:opened", {
        detail: {
          municipality_code: controller._selectedMunicipalityCode,
          scenario_id: scenarioId
        }
      }))
    }
  }
}
