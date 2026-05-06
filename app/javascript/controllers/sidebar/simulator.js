// app/javascript/controllers/sidebar/simulator.js

export function createSimulator(controller) {
  return {
    loadAgentTypesIntoPanel() {
      const munCode = controller._selectedMunicipalityCode
      if (!munCode || !controller.hasAgentInputsContainerTarget) return

      fetch(`/simulation_agent_types?municipality_code=${munCode}`, {
        headers: { "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content }
      })
        .then(r => r.json())
        .then(data => {
          const container = controller.agentInputsContainerTarget
          container.innerHTML = ""

          if (data.length === 0) {
            container.innerHTML = '<p class="sidebar__no-data-msg">No hay tipos de agente configurados para esta comuna.</p>'
            return
          }

          data.forEach(agentType => {
            const section = document.createElement("div")
            section.className = "sidebar__section"
            section.innerHTML = `
              <div class="sidebar__label">${agentType.name.toUpperCase()}</div>
              <input
                class="sidebar__input"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="Nº de agentes"
                data-agent-type-code="${agentType.code}"
                data-sidebar-target="agentInput"
              >
            `
            container.appendChild(section)
          })
        })
        .catch(err => console.error("Error cargando tipos de agente:", err))
    },

    toggleSimulator() {
      const opening = controller.simulatorPanelTarget.hidden
      controller.simulatorPanelTarget.hidden = !opening

      if (opening) {
        // Cierra el localizador si estaba abierto
        if (controller.hasLocatorPanelTarget && !controller.locatorPanelTarget.hidden) {
          controller.closeLocator()
        }

        controller.simulatorPanelTarget.style.left = controller.collapsed ? "0px" : "304px"
        controller.loadAgentTypesIntoPanel()

        if (controller.hasOpportunitySelectTarget) controller.opportunitySelectTarget.disabled = true
        if (controller.hasScenarioSelectTarget) controller.scenarioSelectTarget.disabled = true
        controller.element.querySelectorAll(".sidebar__layer-btn").forEach(b => {
          b.disabled = true
          b.classList.add("is-disabled")
          b.style.opacity = "0.4"
          b.style.cursor = "not-allowed"
        })
      } else {
        _restoreAfterSimulatorClose(controller)
      }
    },

    async runSimulation() {
      const scenarioId = controller._selectedScenarioId
      if (!scenarioId) return alert("Selecciona un escenario primero.")
      if (controller._selectedScenarioIsBase) return alert("No puedes simular en el escenario base. Crea un escenario propio con el botón '+'.")

      const agents = controller.agentInputTargets
        .map(input => ({
          agent_type_code: input.dataset.agentTypeCode,
          n_agents: Number(input.value) || 0
        }))
        .filter(a => a.n_agents > 0)

      if (agents.length === 0) return alert("Ingresa al menos un agente para simular.")

      const btn = controller.simulateBtnTarget
      btn.disabled = true
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Simulando...'

      const csrf = document.querySelector('meta[name="csrf-token"]').content

      const resp = await fetch("/simulation_requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ scenario_id: scenarioId, agents })
      })

      const json = await resp.json()
      if (!resp.ok) {
        btn.disabled = false
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Simular'
        return alert(json.error || "Error al iniciar la simulación.")
      }

      controller.agentInputTargets.forEach(input => { input.value = "" })
      _pollSimulationRequests(json.simulation_request_ids, btn, controller)
    }
  }
}

function _pollSimulationRequests(requestIds, btn, controller) {
  const INTERVAL_MS = 3000

  const statusMap = {}
  requestIds.forEach(id => { statusMap[id] = "pending" })

  const csrf = document.querySelector('meta[name="csrf-token"]').content

  const checkAll = async () => {
    const pending = Object.entries(statusMap)
      .filter(([, s]) => s !== "completed" && s !== "failed")
      .map(([id]) => id)

    await Promise.all(pending.map(async id => {
      try {
        const r = await fetch(`/simulation_requests/${id}/status`, {
          headers: { "X-CSRF-Token": csrf }
        })
        const data = await r.json()
        statusMap[id] = data.status
      } catch (_) { /* keep polling */ }
    }))

    const statuses = Object.values(statusMap)
    const allDone = statuses.every(s => s === "completed" || s === "failed")

    if (!allDone) {
      setTimeout(checkAll, INTERVAL_MS)
      return
    }

    btn.disabled = false
    btn.innerHTML = '<i class="fa-solid fa-play"></i> Simular'

    const anyFailed = statuses.some(s => s === "failed")
    if (anyFailed) {
      alert("Una o más simulaciones fallaron. Revisa e intenta de nuevo.")
    } else {
      controller.simulatorPanelTarget.hidden = true
      _restoreAfterSimulatorClose(controller)
      controller.simulationResultModalTarget.hidden = false
      window.dispatchEvent(new CustomEvent("co2:refresh"))
    }
  }

  setTimeout(checkAll, INTERVAL_MS)
}

function _restoreAfterSimulatorClose(controller) {
  if (controller.hasOpportunitySelectTarget) controller.opportunitySelectTarget.disabled = false
  if (controller.hasScenarioSelectTarget) controller.scenarioSelectTarget.disabled = false
  controller.element.querySelectorAll(".sidebar__layer-btn").forEach(b => {
    b.disabled = false
    b.classList.remove("is-disabled")
    b.style.opacity = ""
    b.style.cursor = ""
  })
}
