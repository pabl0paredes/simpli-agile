import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "panel",
    "mapArea",
    "toggle",
    "regionSelect",
    "municipalitySelect",
    "opportunitySelect",
    "layerSection",
    "locateSection",
    "locatorPanel",
    "accessibilityChoices",
    "scenarioSelect",
    "scenarioSection",
    "scenarioHint",
    "selectedCellDisplay",
    "selectedCellH3",
    "pickCellModal",
    "projectNameInput",
    "addBtn",
    "unitsInput",
    "areaPerUnitInput",
    "locatorOpportunitySelect",
    "previousProjectsList",
    "draftProjectsList",
    "previousProjectsSection",
    "publishModal",
    "publishNameInput",
    "deleteScenarioBtn",
  ]

  connect() {
    this.collapsed = false
    this.loadRegionsIntoSelect()
    this.loadMunicipalitiesIntoSelect()
    this.loadOpportunitiesIntoSelect()
    this.loadLocatorOpportunitiesIntoSelect()

    window.addEventListener("region:clicked", this.onRegionClicked)
    window.addEventListener("municipality:clicked", this.onMunicipalityClicked)
    window.addEventListener("sidebar:toggle", this.onSidebarToggle)
    window.addEventListener("cell:picked", this.onCellPicked)
    window.addEventListener("scenario:selected", this.onScenarioSelected)
  }

  disconnect() {
    window.removeEventListener("region:clicked", this.onRegionClicked)
    window.removeEventListener("municipality:clicked", this.onMunicipalityClicked)
    window.removeEventListener("sidebar:toggle", this.onSidebarToggle)
    window.removeEventListener("cell:picked", this.onCellPicked)
    window.removeEventListener("scenario:selected", this.onScenarioSelected)
  }

  loadRegionsIntoSelect() {
    fetch('/regions/names')
    .then(response => response.json())
    .then(data => {
      const selector = this.regionSelectTarget  // Accedemos al select del HTML

      // Limpiar las opciones actuales (si existen)
      selector.innerHTML = "<option>Seleccionar región...</option>"

      // Agregar las opciones de las regiones al desplegable
      data.forEach(region => {
        const option = document.createElement("option")
        option.value = region.region_code  // Usamos el `region_code` para el valor de la opción
        option.textContent = region.name  // Mostramos el `name` de la región
        selector.appendChild(option)
      })
    })
    .catch(error => console.error("Error al cargar las regiones:", error))
  }

  onRegionClicked = (e) => {
    const regionCode = e.detail.region_code
    if (!regionCode) return

    this.regionSelectTarget.value = regionCode

    this.regionChanged({ target: this.regionSelectTarget })
  }

  loadMunicipalitiesIntoSelect(regionCode = null) {
    let url = '/municipalities/names'
    if (regionCode) {
      url += `?region_code=${regionCode}`
    }

    fetch(url)
    .then(response => response.json())
    .then(data => {
      const selector = this.municipalitySelectTarget
      selector.innerHTML = "<option>Seleccionar comuna...</option>"

      data.forEach(municipality => {
        const option = document.createElement("option")
        option.value = municipality.municipality_code
        option.textContent = municipality.name
        selector.appendChild(option)
      })
    })
    .catch(error => console.error("Error al cargar las comunas:", error))
  }

  onMunicipalityClicked = (e) => {
    const munCode = e.detail.municipality_code
    if (!munCode) return

    // hace el cambio en el selector
    this.municipalitySelectTarget.value = munCode

    // reutiliza la lógica de municipality changed
    this.municipalityChanged({ target: this.municipalitySelectTarget })
  }

  loadOpportunitiesIntoSelect() {
    fetch("/opportunities")
    .then(response => response.json())
    .then(data => {
      const selector = this.opportunitySelectTarget
      selector.innerHTML = "<option>Seleccionar uso...</option>"

      data.forEach(opportunity => {
        const option = document.createElement("option")
        option.value = opportunity.opportunity_code
        option.textContent = opportunity.name
        // ✅ Guardar category en el DOM
        option.dataset.category = opportunity.category
        selector.appendChild(option)
      })
    })
    .catch(error => console.error("Error al cargar los usos:", error))
  }

  loadScenariosIntoSelect(munCode) {
    if (!this.hasScenarioSelectTarget) return

    this.scenarioSectionTarget.hidden = false
    this.scenarioSelectTarget.disabled = true
    if (this.hasScenarioHintTarget) this.scenarioHintTarget.style.display = "none"

    fetch(`/scenarios/names?municipality_code=${encodeURIComponent(munCode)}`)
      .then(r => r.json())
      .then(data => {
        const selector = this.scenarioSelectTarget
        selector.innerHTML = "<option>Seleccionar escenario...</option>"

        let baseId = null

        data.forEach(s => {
          const option = document.createElement("option")
          option.value = s.id
          option.textContent = s.name
          option.dataset.isBase = s.is_base ? "1" : "0"
          selector.appendChild(option)
          if (s.is_base) baseId = String(s.id)
        })

        selector.disabled = false

        // ✅ Seleccionar base por defecto y avisar al mapa
        if (baseId) {
          selector.value = baseId
          this._selectedScenarioId = baseId
          window.dispatchEvent(new CustomEvent("scenario:selected", {
            detail: { scenario_id: baseId }
          }))
        }

        // const { autoSelectBase = true } = opts

        // // ✅ Seleccionar base por defecto y avisar al mapa
        // if (autoSelectBase && baseId) {
        //   selector.value = baseId

        //   // ✅ sincroniza flags + estado
        //   this._selectedScenarioId = String(baseId)
        //   this._selectedScenarioIsBase = true

        //   if (this.hasDeleteScenarioBtnTarget) {
        //     this.deleteScenarioBtnTarget.hidden = true
        //   }

        //   // ✅ ESTE es el punto clave: avisar a toda la app
        //   window.dispatchEvent(new CustomEvent("scenario:selected", {
        //     detail: { scenario_id: String(baseId) }
        //   }))
        // }

      })
      .catch(err => {
        console.error("Error cargando escenarios:", err)
        this.scenarioSelectTarget.disabled = true
      })
  }

  loadLocatorOpportunitiesIntoSelect() {
    if (!this.hasLocatorOpportunitySelectTarget) return

    fetch("/opportunities")
      .then(r => r.json())
      .then(data => {
        const selector = this.locatorOpportunitySelectTarget
        selector.innerHTML = "<option>Seleccionar oportunidad...</option>"

        data.forEach(op => {
          const option = document.createElement("option")
          option.value = op.opportunity_code
          option.textContent = op.name
          selector.appendChild(option)
        })

        // si quieres que se habilite al cargar:
        selector.disabled = false
      })
      .catch(err => console.error("Error cargando oportunidades (localizador):", err))
  }


  regionChanged(e) {
    const regionCode = e.target.value
    this.loadMunicipalitiesIntoSelect(regionCode)

    if (!regionCode || regionCode.includes("Seleccionar")) return

    // avisar al mapa
    window.dispatchEvent(new CustomEvent("region:selected", {
      detail: { region_code: regionCode }
    }))

    this.municipalitySelectTarget.value = ""

    window.dispatchEvent(new CustomEvent("municipality:cleared"))
  }

  municipalityChanged(e) {
    const munCode = e.target.value
    if (!munCode || munCode.includes("Seleccionar")) {
      this.resetAfterMunicipalityChange()
      window.dispatchEvent(new CustomEvent("municipality:cleared"))
      return
    }


    // ✅ Reset completo cada vez que cambia comuna (aunque venga una válida)
    this.resetAfterMunicipalityChange()

    this.opportunitySelectTarget.disabled = false
    this.locateSectionTarget.hidden = false
    this._selectedMunicipalityCode = munCode

    // Ocultar el hint de oportunidad seleccionada
    const opportunityHint = this.opportunitySelectTarget.closest('.sidebar__section').querySelector('.sidebar__hint')
    if (opportunityHint) opportunityHint.style.display = 'none'

    window.dispatchEvent(new CustomEvent("municipality:selected", {
      detail: { municipality_code: munCode }
    }))

    if (this.hasScenarioSelectTarget) {
      this.scenarioSectionTarget.hidden = false
      this.loadScenariosIntoSelect(munCode)
    }
  }

  async addProject() {
    // 1) validar inputs
    const name = this.projectNameInputTarget.value?.trim()
    const h3 = this.selectedCellH3Target.value
    const opportunityCode = this.locatorOpportunitySelectTarget.value
    const units = Number(this.unitsInputTarget.value)
    const areaPerUnit = Number(this.areaPerUnitInputTarget.value)

    if (!name) return alert("Pon un nombre al proyecto.")
    if (!h3) return alert("Selecciona una celda.")
    if (!opportunityCode || opportunityCode.includes("Seleccionar")) return alert("Selecciona una oportunidad.")
    if (!Number.isFinite(units) || units <= 0) return alert("Unidades debe ser > 0.")
    if (!Number.isFinite(areaPerUnit) || areaPerUnit <= 0) return alert("Superficie por unidad debe ser > 0.")

    // 2) asegurar draft scenario (solo si estás parado en base o si no tienes draft)
    // Si ya estás en draft, usa ese.
    let scenarioId = this._selectedScenarioId

    // regla: si el seleccionado es base (system) o no hay selected, aseguro draft
    // (por ahora: siempre aseguro draft y el server devuelve el mismo si ya existe)
    const csrf = document.querySelector('meta[name="csrf-token"]').content

    const draftRes = await fetch("/scenarios/ensure_draft", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({
        municipality_code: this._selectedMunicipalityCode,
        base_scenario_id: this._selectedScenarioId // si justo era el base
      })
    })
    const draftJson = await draftRes.json()
    scenarioId = draftJson.scenario_id
    this._draftScenarioId = String(scenarioId)

    // (opcional) actualizar selector escenario a draft y disparar scenario:selected
    scenarioId = draftJson.scenario_id
    this._draftScenarioId = String(scenarioId)

    // 3) crear project
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

    // 4) UX: limpiar inputs “variables” para agregar otro
    this.projectNameInputTarget.value = ""
    this.unitsInputTarget.value = ""
    this.areaPerUnitInputTarget.value = ""


    await this.refreshProjectsLists()
  }


  scenarioChanged(e) {
    const scenarioId = e.target.value
    if (!scenarioId || scenarioId.includes("Seleccionar")) return

    // ✅ si hay draft con proyectos, no permitir cambiar
    if (this._draftScenarioId && String(scenarioId) !== String(this._draftScenarioId)) {
      this.scenarioSelectTarget.value = this._draftScenarioId
      return alert("Tienes cambios en borrador. Primero ‘Guardar y recalcular’ para cambiar de escenario.")
    }

    // ✅ 1) Despejar todo (UI + mapa) antes de cambiar scenario
    window.dispatchEvent(new CustomEvent("layer:cleared"))
    this.clearLayerButtonsUI()

    // (recomendado) cerrar sub-paneles / modos que dejan estado
    if (this.hasAccessibilityChoicesTarget) this.accessibilityChoicesTarget.hidden = true
    if (this.hasPickCellModalTarget) this.pickCellModalTarget.hidden = true

    const opt = this.scenarioSelectTarget.selectedOptions?.[0]

    const isBase = (opt?.dataset?.isBase === "1")
    this._selectedScenarioIsBase = isBase

    if (this.hasDeleteScenarioBtnTarget) {
      this.deleteScenarioBtnTarget.hidden = isBase
    }

    // ✅ 2) Cambiar scenario
    window.dispatchEvent(new CustomEvent("scenario:selected", {
      detail: { scenario_id: scenarioId }
    }))
  }


  onScenarioSelected = (e) => {
    this._selectedScenarioId = e.detail.scenario_id

    const opt = this.scenarioSelectTarget.selectedOptions?.[0]
    this._selectedScenarioIsBase = (opt?.dataset?.isBase === "1")

    this.refreshProjectsLists()
  }



  resetAfterMunicipalityChange() {
    // 1) limpiar mapa (celdas)
    window.dispatchEvent(new CustomEvent("layer:cleared"))

    // 2) reset UI capas
    this.clearLayerButtonsUI()

    // Limpiar escenarios
    if (this.hasScenarioSelectTarget) {
      this.scenarioSelectTarget.innerHTML = "<option>Seleccionar escenario...</option>"
      this.scenarioSelectTarget.disabled = true
      this.scenarioSectionTarget.hidden = true
      if (this.hasScenarioHintTarget) this.scenarioHintTarget.style.display = ""
    }

    if (this._selectedCellId) {
      this.map.setFeatureState(
        { source: "cells", id: this._selectedCellId },
        { selected: false }
      )
      this._selectedCellId = null
    }

    // 3) reset oportunidad
    if (this.hasOpportunitySelectTarget) {
      this.opportunitySelectTarget.value = "Seleccionar uso..."
      // this.opportunitySelectTarget.disabled = true
    }

    // 4) ocultar secciones que dependen de oportunidad/capas
    if (this.hasLayerSectionTarget) this.layerSectionTarget.hidden = true
    if (this.hasLocateSectionTarget) this.locateSectionTarget.hidden = true

    // 5) (opcional) volver a mostrar el hint de oportunidad
    const hint = this.opportunitySelectTarget?.closest('.sidebar__section')?.querySelector('.sidebar__hint')
    if (hint) hint.style.display = ''
  }


  opportunityChanged(e) {
    const opportunityCode = e.target.value
    if (!opportunityCode || opportunityCode.includes("Seleccionar")) return

    // category viene desde el <option selected>
    const selectedOption = e.target.selectedOptions?.[0]
    const category = selectedOption?.dataset?.category

    this.layerSectionTarget.hidden = false
    this.locateSectionTarget.hidden = false

    window.dispatchEvent(new CustomEvent("layer:cleared"))

    this.clearLayerButtonsUI()

    // ✅ Aplicar visibilidad de botones según category
    this.applyOpportunityCategory(category)

    window.dispatchEvent(new CustomEvent("opportunity:selected", {
      detail: { opportunity_code: opportunityCode }
    }))
  }

  selectLayer(e) {
    const btn = e.currentTarget

    // toggle devuelve true si quedó activo
    const isActive = btn.classList.toggle("is-active")

    // quitar active de los otros botones principales
    const allButtons = this.element.querySelectorAll(".sidebar__layer-btn")
    allButtons.forEach(otherBtn => {
      if (otherBtn !== btn) {
        otherBtn.classList.remove("is-active")
      }
    })

    const metric = btn.dataset.metric

    // Solo disparamos evento si quedó activo
    if (isActive && metric) {
      window.dispatchEvent(new CustomEvent("layer:selected", {
        detail: { metric }
      }))
    } else if (!isActive) {
      window.dispatchEvent(new CustomEvent("layer:cleared"))
    }

    // 👇 Mostrar/ocultar sub-botones solo si es Accesibilidad
    const isAccessibility = btn.dataset.layer === "accessibility"

    if (isAccessibility) {
      this.accessibilityChoicesTarget.hidden = !isActive

      // si se desactiva accesibilidad → limpiar sub-botones
      if (!isActive) {
        this.accessibilityChoicesTarget
          .querySelectorAll(".sidebar__subchoice-btn")
          .forEach(b => b.classList.remove("is-active"))
      }
    } else {
      // si se selecciona otra capa → ocultar accesibilidad
      this.accessibilityChoicesTarget.hidden = true

      // ✅ NUEVO: limpiar sub-botones siempre
      this.accessibilityChoicesTarget
        .querySelectorAll(".sidebar__subchoice-btn")
        .forEach(b => b.classList.remove("is-active"))
    }
  }

  applyOpportunityCategory(category) {
    const surfaceBtn = this.element.querySelector('.sidebar__layer-btn[data-metric="surface"]')
    if (!surfaceBtn) return

    const isPOI = (category === "POI")
    surfaceBtn.hidden = isPOI   // POI => ocultar superficie

    // si ocultamos superficie, asegurar que no quede activa
    if (isPOI && surfaceBtn.classList.contains("is-active")) {
      surfaceBtn.classList.remove("is-active")
      window.dispatchEvent(new CustomEvent("layer:cleared"))
    }
  }

  clearLayerButtonsUI() {
    // botones principales
    this.element.querySelectorAll(".sidebar__layer-btn")
      .forEach(b => b.classList.remove("is-active"))

    // sub-botones accesibilidad
    if (this.hasAccessibilityChoicesTarget) {
      this.accessibilityChoicesTarget.hidden = true
      this.accessibilityChoicesTarget
        .querySelectorAll(".sidebar__subchoice-btn")
        .forEach(b => b.classList.remove("is-active"))
    }
  }


  selectAccessibilityMode(e) {
    const mode = e.currentTarget.dataset.mode // "walk" o "car"

    // UI: toggle exclusivo (opcional)
    this.accessibilityChoicesTarget
      .querySelectorAll(".sidebar__subchoice-btn")
      .forEach(b => b.classList.remove("is-active"))
    e.currentTarget.classList.add("is-active")

    window.dispatchEvent(new CustomEvent("accessibility:mode_selected", {
      detail: { mode }
    }))
  }



  toggleLocator() {
    this.locatorPanelTarget.hidden = !this.locatorPanelTarget.hidden

    if (!this.locatorPanelTarget.hidden) {
      // ✅ si está colapsada, se pega al borde; si no, queda al lado
      this.locatorPanelTarget.style.left = this.collapsed ? "0px" : "300px"
    }
  }


  toggle() {
    this.collapsed = !this.collapsed

    // Clase en el root para estilos
    this.element.classList.toggle("is-sidebar-collapsed", this.collapsed)

    // Cambiar icono (‹ / ›)
    this.toggleTarget.textContent = this.collapsed ? "›" : "‹"

    // ✅ Si el localizador está abierto, NO lo cierres: solo muévelo
    if (this.hasLocatorPanelTarget && !this.locatorPanelTarget.hidden) {
      this.locatorPanelTarget.style.left = this.collapsed ? "0px" : "300px"
    }

    // Mantén esto por si el map_controller necesita resize
    window.dispatchEvent(new Event("sidebar:toggle"))
  }

  startPickCell() {
    this.pickCellModalTarget.hidden = false
    window.dispatchEvent(new CustomEvent("cell:pick_start"))

    this._onEscPickCell = (ev) => {
      if (ev.key === "Escape") this.cancelPickCell()
    }
    window.addEventListener("keydown", this._onEscPickCell)
  }

  cancelPickCell() {
    this.pickCellModalTarget.hidden = true
    window.dispatchEvent(new CustomEvent("cell:pick_cancel"))

    if (this._onEscPickCell) {
      window.removeEventListener("keydown", this._onEscPickCell)
      this._onEscPickCell = null
    }
  }

  onCellPicked = (e) => {
    const { h3, show_id } = e.detail

    this.selectedCellH3Target.value = h3
    this.selectedCellDisplayTarget.value = `Celda ${show_id ?? ""}`.trim()

    // ✅ cerrar hint
    this.pickCellModalTarget.hidden = true

    if (this.hasLocatorOpportunitySelectTarget) {
      this.locatorOpportunitySelectTarget.disabled = false
    }

    // ✅ apagar modo selección en el mapa
    window.dispatchEvent(new CustomEvent("cell:pick_cancel"))

    // ✅ si habilitaste ESC, limpiar listener
    if (this._onEscPickCell) {
      window.removeEventListener("keydown", this._onEscPickCell)
      this._onEscPickCell = null
    }
  }

  async refreshProjectsLists() {
    if (!this._selectedScenarioId) return
    if (!this.hasPreviousProjectsListTarget || !this.hasDraftProjectsListTarget) return

    // ✅ si es base: ocultar historial y NO pedirlo
    if (this._selectedScenarioIsBase) {
      if (this.hasPreviousProjectsSectionTarget) this.previousProjectsSectionTarget.hidden = true
      if (this.hasPreviousProjectsListTarget) this.previousProjectsListTarget.innerHTML = ""
      // pero sí mostramos borrador:
      // -> podemos pedir un endpoint reducido (draft-only) o usar el mismo endpoint (ya no falla).
    } else {
      if (this.hasPreviousProjectsSectionTarget) this.previousProjectsSectionTarget.hidden = false
    }

    const url = `/scenarios/${encodeURIComponent(this._selectedScenarioId)}/projects_lists`

    try {
      const resp = await fetch(url)
      const data = await resp.json()

      if (!resp.ok) {
        console.error(data)
        this.previousProjectsListTarget.innerHTML = "<div class='sidebar__hint sidebar__hint--muted'>No se pudieron cargar.</div>"
        this.draftProjectsListTarget.innerHTML = ""
        return
      }

      this._draftScenarioId = data.draft_scenario?.id ? String(data.draft_scenario.id) : null

      const renderNames = (items, emptyText) => {
        if (!Array.isArray(items) || items.length === 0) {
          return `<div class='sidebar__hint sidebar__hint--muted'>${emptyText}</div>`
        }
        return items.map(p => `
          <div class="locator-project">
            <div class="locator-project__name">${(p.name || "").replaceAll("<","&lt;").replaceAll(">","&gt;")}</div>
          </div>
        `).join("")
      }

      this.previousProjectsListTarget.innerHTML =
        renderNames(data.previous_projects, "No hay proyectos en el historial.")

      this.draftProjectsListTarget.innerHTML =
        renderNames(data.draft_projects, "No hay proyectos en borrador.")
    } catch (err) {
      console.error(err)
      this.previousProjectsListTarget.innerHTML = "<div class='sidebar__hint sidebar__hint--muted'>Error cargando.</div>"
      this.draftProjectsListTarget.innerHTML = ""
    }
  }

  openPublishModal() {

    console.log("✅ openPublishModal() fired", this._draftScenarioId)
    if (!this._draftScenarioId) return alert("No hay borrador para guardar.")
    this.publishNameInputTarget.value = ""
    this.publishModalTarget.hidden = false

    // opcional UX: autofocus
    setTimeout(() => this.publishNameInputTarget.focus(), 0)
  }

  closePublishModal() {
    this.publishModalTarget.hidden = true
  }

  async confirmPublishScenario() {
    const scenarioId = this._draftScenarioId
    if (!scenarioId) return alert("No hay borrador para guardar.")

    const name = this.publishNameInputTarget.value?.trim()
    if (!name) return alert("Escribe un nombre para el escenario.")

    const csrf = document.querySelector('meta[name="csrf-token"]').content

    // bloquear botón mientras corre
    if (this.hasAddBtnTarget) this.addBtnTarget.disabled = true

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

      this.closePublishModal()

      // recargar escenarios
      if (this._selectedMunicipalityCode) {
        this.loadScenariosIntoSelect(this._selectedMunicipalityCode)
      }

      // ya no hay borrador
      this._draftScenarioId = null

      // refrescar listas (historial/borrador)
      await this.refreshProjectsLists()

      alert("Escenario guardado y accesibilidades recalculadas ✅")
    } finally {
      if (this.hasAddBtnTarget) this.addBtnTarget.disabled = false
    }
  }

  async deleteScenario() {
    const scenarioId = this._selectedScenarioId || this.scenarioSelectTarget?.value
    if (!scenarioId) return

    // Nunca borrar base desde front (doble protección)
    const opt = this.scenarioSelectTarget?.selectedOptions?.[0]
    const isBase = (opt?.dataset?.isBase === "1")
    if (isBase) return alert("No puedes eliminar el escenario base.")

    // Si hay borrador colgando, mejor impedir o avisar
    if (this._draftScenarioId) {
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

    // 1) limpiar mapa/capas
    window.dispatchEvent(new CustomEvent("layer:cleared"))
    this.clearLayerButtonsUI()

    // 2) recargar escenarios de la comuna
    if (this._selectedMunicipalityCode) {
      await this.loadScenariosIntoSelect(this._selectedMunicipalityCode, { autoSelectBase: true })
    }

    // 3) asegurar que el estado interno quede base
    this._draftScenarioId = null


    alert("Escenario eliminado ✅")
  }





}
