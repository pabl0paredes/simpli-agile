// app/javascript/controllers/sidebar/project_lists.js

export function createProjectLists(controller) {
  return {
    // -------------------------
    // Métodos (mismos nombres)
    // -------------------------

    async refreshProjectsLists() {
      if (!controller._selectedScenarioId) return
      if (!controller.hasPreviousProjectsListTarget || !controller.hasDraftProjectsListTarget) return

      // ✅ si es base: ocultar historial y NO pedirlo
      if (controller._selectedScenarioIsBase) {
        if (controller.hasPreviousProjectsSectionTarget) controller.previousProjectsSectionTarget.hidden = true
        if (controller.hasPreviousProjectsListTarget) controller.previousProjectsListTarget.innerHTML = ""
        // pero sí mostramos borrador (el endpoint ya debiese soportarlo)
      } else {
        if (controller.hasPreviousProjectsSectionTarget) controller.previousProjectsSectionTarget.hidden = false
      }

      const url = `/scenarios/${encodeURIComponent(controller._selectedScenarioId)}/projects_lists`

      try {
        const resp = await fetch(url)
        const data = await resp.json()

        if (!resp.ok) {
          console.error(data)
          controller.previousProjectsListTarget.innerHTML =
            "<div class='sidebar__hint sidebar__hint--muted'>No se pudieron cargar.</div>"
          controller.draftProjectsListTarget.innerHTML = ""
          return
        }

        controller._draftScenarioId = data.draft_scenario?.id ? String(data.draft_scenario.id) : null

        const esc = (s) => String(s || "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;")

        const renderNames = (items, emptyText) => {
          if (!Array.isArray(items) || items.length === 0) {
            return `<div class='sidebar__hint sidebar__hint--muted'>${emptyText}</div>`
          }
          return items.map(p => `
            <div class="locator-project">
              <div class="locator-project__name">${esc(p.name)}</div>
            </div>
          `).join("")
        }

        controller.previousProjectsListTarget.innerHTML =
          renderNames(data.previous_projects, "No hay proyectos en el historial.")

        controller.draftProjectsListTarget.innerHTML =
          renderNames(data.draft_projects, "No hay proyectos en borrador.")
      } catch (err) {
        console.error(err)
        controller.previousProjectsListTarget.innerHTML =
          "<div class='sidebar__hint sidebar__hint--muted'>Error cargando.</div>"
        controller.draftProjectsListTarget.innerHTML = ""
      }
    }
  }
}
