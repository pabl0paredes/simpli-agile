export function createProjectLists(controller) {
  return {
    async refreshProjectsLists() {
      if (!controller._selectedScenarioId) return
      if (!controller.hasPreviousProjectsListTarget || !controller.hasDraftProjectsListTarget) return

      if (controller._selectedScenarioIsBase) {
        if (controller.hasPreviousProjectsSectionTarget) controller.previousProjectsSectionTarget.hidden = true
        if (controller.hasPreviousProjectsListTarget) controller.previousProjectsListTarget.innerHTML = ""
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

        const renderPreviousProjects = (items, emptyText) => {
          if (!Array.isArray(items) || items.length === 0) {
            return `<div class='sidebar__hint sidebar__hint--muted'>${emptyText}</div>`
          }

          return items.map(p => `
            <div class="locator-project locator-project--readonly" data-project-id="${esc(p.id)}">
              <div class="locator-project__main">
                <div class="locator-project__name">${esc(p.name)}</div>
              </div>
            </div>
          `).join("")
        }

        const renderDraftProjects = (items, emptyText) => {
          if (!Array.isArray(items) || items.length === 0) {
            return `<div class='sidebar__hint sidebar__hint--muted'>${emptyText}</div>`
          }

          return items.map(p => `
            <div class="locator-project locator-project--draft" data-project-id="${esc(p.id)}">
              <div class="locator-project__main">
                <div class="locator-project__name">${esc(p.name)}</div>
              </div>

              <div class="locator-project__actions">
                <button
                  type="button"
                  class="locator-project__icon-btn"
                  aria-label="Editar proyecto"
                  title="Editar proyecto"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  class="locator-project__icon-btn locator-project__icon-btn--danger"
                  data-action="delete-project"
                  data-project-id="${esc(p.id)}"
                  aria-label="Eliminar proyecto"
                  title="Eliminar proyecto"
                >
                  🗑️
                </button>
              </div>
            </div>
          `).join("")
        }

        controller.previousProjectsListTarget.innerHTML =
          renderPreviousProjects(data.previous_projects, "No hay proyectos en el historial.")

        controller.draftProjectsListTarget.innerHTML =
          renderDraftProjects(data.draft_projects, "No hay proyectos en borrador.")
      } catch (err) {
        console.error(err)
        controller.previousProjectsListTarget.innerHTML =
          "<div class='sidebar__hint sidebar__hint--muted'>Error cargando.</div>"
        controller.draftProjectsListTarget.innerHTML = ""
      }

      this.bindProjectHover()
      this.bindDraftProjectActions()
    },

    bindProjectHover() {
      controller._projectHoverToken = 0

      const items = [
        ...controller.previousProjectsListTarget.querySelectorAll(".locator-project"),
        ...controller.draftProjectsListTarget.querySelectorAll(".locator-project")
      ]

      items.forEach(el => {
        el.addEventListener("mouseenter", async () => {
          const projectId = el.dataset.projectId
          if (!projectId) return

          const token = ++controller._projectHoverToken

          try {
            const resp = await fetch(`/projects/${projectId}/hover_info`)
            if (!resp.ok) return

            const data = await resp.json()

            if (token !== controller._projectHoverToken) return

            window.dispatchEvent(new CustomEvent("project:hover", {
              detail: data
            }))
          } catch (err) {
            console.error(err)
          }
        })

        el.addEventListener("mouseleave", () => {
          controller._projectHoverToken++
          window.dispatchEvent(new CustomEvent("project:hover_end"))
        })
      })
    },

    bindDraftProjectActions() {
      const deleteButtons = controller.draftProjectsListTarget
        .querySelectorAll('[data-action="delete-project"]')

      deleteButtons.forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.preventDefault()
          e.stopPropagation()

          const projectId = btn.dataset.projectId
          if (!projectId) return

          const ok = window.confirm("¿Eliminar este proyecto del borrador?")
          if (!ok) return

          const csrf = document.querySelector('meta[name="csrf-token"]').content

          try {
            const resp = await fetch(`/projects/${projectId}`, {
              method: "DELETE",
              headers: { "X-CSRF-Token": csrf, "Accept": "application/json" }
            })

            const data = await resp.json().catch(() => ({}))

            if (!resp.ok) {
              console.error(data)
              alert(data.error || "No se pudo eliminar el proyecto.")
              return
            }

            window.dispatchEvent(new CustomEvent("project:hover_end"))

            await this.refreshProjectsLists()

            window.dispatchEvent(new CustomEvent("locator:opened", {
              detail: {
                municipality_code: controller._selectedMunicipalityCode,
                scenario_id: controller._selectedScenarioId
              }
            }))
          } catch (err) {
            console.error(err)
            alert("Error eliminando el proyecto.")
          }
        })
      })
    }
  }
}
