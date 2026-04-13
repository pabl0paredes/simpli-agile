// resetAfterMunicipalityChange() {
//   // 1) limpiar mapa (celdas)
//   window.dispatchEvent(new CustomEvent("layer:cleared"))

//   // 2) reset UI capas
//   this.clearLayerButtonsUI()

//   // Limpiar escenarios
//   if (this.hasScenarioSelectTarget) {
//     this.scenarioSelectTarget.innerHTML = "<option>Seleccionar escenario...</option>"
//     this.scenarioSelectTarget.disabled = true
//     this.scenarioSectionTarget.hidden = true
//     if (this.hasScenarioHintTarget) this.scenarioHintTarget.style.display = ""
//   }

//   if (this._selectedCellId) {
//     this.map.setFeatureState(
//       { source: "cells", id: this._selectedCellId },
//       { selected: false }
//     )
//     this._selectedCellId = null
//   }

//   // 3) reset oportunidad
//   if (this.hasOpportunitySelectTarget) {
//     this.opportunitySelectTarget.value = "Seleccionar uso..."
//     // this.opportunitySelectTarget.disabled = true
//   }

//   // 4) ocultar secciones que dependen de oportunidad/capas
//   if (this.hasLayerSectionTarget) this.layerSectionTarget.hidden = true
//   if (this.hasLocateSectionTarget) this.locateSectionTarget.hidden = true

//   // 5) (opcional) volver a mostrar el hint de oportunidad
//   const hint = this.opportunitySelectTarget?.closest('.sidebar__section')?.querySelector('.sidebar__hint')
//   if (hint) hint.style.display = ''
// }


// clearLayerButtonsUI() {
//   // botones principales
//   this.element.querySelectorAll(".sidebar__layer-btn")
//     .forEach(b => b.classList.remove("is-active"))

//   // sub-botones accesibilidad
//   if (this.hasAccessibilityChoicesTarget) {
//     this.accessibilityChoicesTarget.hidden = true
//     this.accessibilityChoicesTarget
//       .querySelectorAll(".sidebar__subchoice-btn")
//       .forEach(b => b.classList.remove("is-active"))
//   }
// }


// applyOpportunityCategory(category) {
//   const surfaceBtn = this.element.querySelector('.sidebar__layer-btn[data-metric="surface"]')
//   if (!surfaceBtn) return

//   const isPOI = (category === "POI")
//   surfaceBtn.hidden = isPOI   // POI => ocultar superficie

//   // si ocultamos superficie, asegurar que no quede activa
//   if (isPOI && surfaceBtn.classList.contains("is-active")) {
//     surfaceBtn.classList.remove("is-active")
//     window.dispatchEvent(new CustomEvent("layer:cleared"))
//   }
// }


// openPublishModal() {

//   console.log("✅ openPublishModal() fired", this._draftScenarioId)
//   if (!this._draftScenarioId) return alert("No hay borrador para guardar.")
//   this.publishNameInputTarget.value = ""
//   this.publishModalTarget.hidden = false

//   // opcional UX: autofocus
//   setTimeout(() => this.publishNameInputTarget.focus(), 0)
// }

// closePublishModal() {
//   this.publishModalTarget.hidden = true
// }


// enterComparatorMode() {
//   // 1) fija comuna: esconder región/comuna
//   if (this.hasRegionSectionTarget) this.regionSectionTarget.hidden = true
//   if (this.hasMunicipalitySectionTarget) this.municipalitySectionTarget.hidden = true

//   // Esconder selector de escenario
//   if (this.hasScenarioSectionTarget) this.scenarioSectionTarget.hidden = true

//   // 2) mostrar UI comparador
//   if (this.hasComparatorSectionTarget) this.comparatorSectionTarget.hidden = false
//   if (this.hasComparatorDividerTarget) this.comparatorDividerTarget.hidden = false
//   if (this.hasCompareModeSectionTarget) this.compareModeSectionTarget.hidden = false

//   // 3) mantener selector oportunidad + capas tal cual (no tocamos)
//   // 4) esconder localizador/botón localizar (comparador no construye)
//   if (this.hasLocateSectionTarget) this.locateSectionTarget.hidden = true
//   if (this.hasLocatorPanelTarget) this.locatorPanelTarget.hidden = true

//   // 5) cargar escenarios A/B para la comuna actual
//   if (this._selectedMunicipalityCode) {
//     this.loadScenariosIntoComparatorSelects(this._selectedMunicipalityCode)
//   } else {
//     // si por alguna razón no hay comuna, deshabilitar selects
//     if (this.hasScenarioASelectTarget) this.scenarioASelectTarget.disabled = true
//     if (this.hasScenarioBSelectTarget) this.scenarioBSelectTarget.disabled = true
//   }
// }

// enterConstructorMode() {
//   // 1) mostrar región/comuna de vuelta
//   if (this.hasRegionSectionTarget) this.regionSectionTarget.hidden = false
//   if (this.hasMunicipalitySectionTarget) this.municipalitySectionTarget.hidden = false

//   // mostrar selector de escenario
//   if (this.hasScenarioSectionTarget) this.scenarioSectionTarget.hidden = false

//   // 2) esconder UI comparador
//   if (this.hasComparatorSectionTarget) this.comparatorSectionTarget.hidden = true
//   if (this.hasComparatorDividerTarget) this.comparatorDividerTarget.hidden = true
//   if (this.hasCompareModeSectionTarget) this.compareModeSectionTarget.hidden = true

//   // 3) restaurar locate section (solo si hay comuna)
//   if (this.hasLocateSectionTarget) {
//     this.locateSectionTarget.hidden = !this._selectedMunicipalityCode
//   }

//   // Nota: el bloque de "ESCENARIO" normal lo dejas como está hoy (scenarioSection)
//   // Si quieres que en constructor vuelva a aparecer scenarioSection, no lo tocamos aquí.
// }


// loadRegionsIntoSelect() {
//   fetch('/regions/names')
//   .then(response => response.json())
//   .then(data => {
//     const selector = this.regionSelectTarget  // Accedemos al select del HTML

//     // Limpiar las opciones actuales (si existen)
//     selector.innerHTML = "<option>Seleccionar región...</option>"

//     // Agregar las opciones de las regiones al desplegable
//     data.forEach(region => {
//       const option = document.createElement("option")
//       option.value = region.region_code  // Usamos el `region_code` para el valor de la opción
//       option.textContent = region.name  // Mostramos el `name` de la región
//       selector.appendChild(option)
//     })
//   })
//   .catch(error => console.error("Error al cargar las regiones:", error))
// }

// loadMunicipalitiesIntoSelect(regionCode = null) {
//   let url = '/municipalities/names'
//   if (regionCode) {
//     url += `?region_code=${regionCode}`
//   }

//   fetch(url)
//   .then(response => response.json())
//   .then(data => {
//     const selector = this.municipalitySelectTarget
//     selector.innerHTML = "<option>Seleccionar comuna...</option>"

//     data.forEach(municipality => {
//       const option = document.createElement("option")
//       option.value = municipality.municipality_code
//       option.textContent = municipality.name
//       selector.appendChild(option)
//     })
//   })
//   .catch(error => console.error("Error al cargar las comunas:", error))
// }

// onRegionClicked = (e) => {
//   const regionCode = e.detail.region_code
//   if (!regionCode) return

//   this.regionSelectTarget.value = regionCode

//   this.regionChanged({ target: this.regionSelectTarget })
// }

// onMunicipalityClicked = (e) => {
//   const munCode = e.detail.municipality_code
//   if (!munCode) return

//   // hace el cambio en el selector
//   this.municipalitySelectTarget.value = munCode

//   // reutiliza la lógica de municipality changed
//   this.municipalityChanged({ target: this.municipalitySelectTarget })
// }


// regionChanged(e) {
//   const regionCode = e.target.value
//   this.loadMunicipalitiesIntoSelect(regionCode)

//   if (!regionCode || regionCode.includes("Seleccionar")) return

//   // avisar al mapa
//   window.dispatchEvent(new CustomEvent("region:selected", {
//     detail: { region_code: regionCode }
//   }))

//   this.municipalitySelectTarget.value = ""

//   window.dispatchEvent(new CustomEvent("municipality:cleared"))
// }

// municipalityChanged(e) {
//   const munCode = e.target.value
//   if (!munCode || munCode.includes("Seleccionar")) {
//     this.resetAfterMunicipalityChange()
//     window.dispatchEvent(new CustomEvent("municipality:cleared"))
//     return
//   }


//   // ✅ Reset completo cada vez que cambia comuna (aunque venga una válida)
//   this.resetAfterMunicipalityChange()

//   this.opportunitySelectTarget.disabled = false
//   this.locateSectionTarget.hidden = false
//   this._selectedMunicipalityCode = munCode
//   if (this.hasModeToggleTarget) {
//     this.modeToggleTarget.hidden = false
//   }


//   // Ocultar el hint de oportunidad seleccionada
//   const opportunityHint = this.opportunitySelectTarget.closest('.sidebar__section').querySelector('.sidebar__hint')
//   if (opportunityHint) opportunityHint.style.display = 'none'

//   window.dispatchEvent(new CustomEvent("municipality:selected", {
//     detail: { municipality_code: munCode }
//   }))

//   if (this.hasScenarioSelectTarget) {
//     this.scenarioSectionTarget.hidden = false
//     this.loadScenariosIntoSelect(munCode)
//   }
// }


// loadScenariosIntoSelect(munCode) {
//   if (!this.hasScenarioSelectTarget) return

//   this.scenarioSectionTarget.hidden = false
//   this.scenarioSelectTarget.disabled = true
//   if (this.hasScenarioHintTarget) this.scenarioHintTarget.style.display = "none"

//   fetch(`/scenarios/names?municipality_code=${encodeURIComponent(munCode)}`)
//     .then(r => r.json())
//     .then(data => {
//       const selector = this.scenarioSelectTarget
//       selector.innerHTML = "<option>Seleccionar escenario...</option>"

//       let baseId = null

//       data.forEach(s => {
//         const option = document.createElement("option")
//         option.value = s.id
//         option.textContent = s.name
//         option.dataset.isBase = s.is_base ? "1" : "0"
//         selector.appendChild(option)
//         if (s.is_base) baseId = String(s.id)
//       })

//       selector.disabled = false

//       // ✅ Seleccionar base por defecto y avisar al mapa
//       if (baseId) {
//         selector.value = baseId
//         this._selectedScenarioId = baseId
//         window.dispatchEvent(new CustomEvent("scenario:selected", {
//           detail: { scenario_id: baseId }
//         }))
//       }

//     })
//     .catch(err => {
//       console.error("Error cargando escenarios:", err)
//       this.scenarioSelectTarget.disabled = true
//     })
// }


// scenarioChanged(e) {
//   const scenarioId = e.target.value
//   if (!scenarioId || scenarioId.includes("Seleccionar")) return

//   // ✅ si hay draft con proyectos, no permitir cambiar
//   if (this._draftScenarioId && String(scenarioId) !== String(this._draftScenarioId)) {
//     this.scenarioSelectTarget.value = this._draftScenarioId
//     return alert("Tienes cambios en borrador. Primero ‘Guardar y recalcular’ para cambiar de escenario.")
//   }

//   // ✅ 1) Despejar todo (UI + mapa) antes de cambiar scenario
//   window.dispatchEvent(new CustomEvent("layer:cleared"))
//   this.clearLayerButtonsUI()

//   // (recomendado) cerrar sub-paneles / modos que dejan estado
//   if (this.hasAccessibilityChoicesTarget) this.accessibilityChoicesTarget.hidden = true
//   if (this.hasPickCellModalTarget) this.pickCellModalTarget.hidden = true

//   const opt = this.scenarioSelectTarget.selectedOptions?.[0]

//   const isBase = (opt?.dataset?.isBase === "1")
//   this._selectedScenarioIsBase = isBase

//   if (this.hasDeleteScenarioBtnTarget) {
//     this.deleteScenarioBtnTarget.hidden = isBase
//   }

//   // ✅ 2) Cambiar scenario
//   window.dispatchEvent(new CustomEvent("scenario:selected", {
//     detail: { scenario_id: scenarioId }
//   }))
// }


// onScenarioSelected = (e) => {
//   this._selectedScenarioId = e.detail.scenario_id

//   const opt = this.scenarioSelectTarget.selectedOptions?.[0]
//   this._selectedScenarioIsBase = (opt?.dataset?.isBase === "1")

//   this.refreshProjectsLists()
// }


// loadOpportunitiesIntoSelect() {
//   fetch("/opportunities")
//   .then(response => response.json())
//   .then(data => {
//     const selector = this.opportunitySelectTarget
//     selector.innerHTML = "<option>Seleccionar uso...</option>"

//     data.forEach(opportunity => {
//       const option = document.createElement("option")
//       option.value = opportunity.opportunity_code
//       option.textContent = opportunity.name
//       // ✅ Guardar category en el DOM
//       option.dataset.category = opportunity.category
//       selector.appendChild(option)
//     })
//   })
//   .catch(error => console.error("Error al cargar los usos:", error))
// }


// opportunityChanged(e) {
//   const opportunityCode = e.target.value
//   if (!opportunityCode || opportunityCode.includes("Seleccionar")) return

//   // category viene desde el <option selected>
//   const selectedOption = e.target.selectedOptions?.[0]
//   const category = selectedOption?.dataset?.category

//   this.layerSectionTarget.hidden = false
//   // Si estamos en comparador, NO mostrar localizador
//   const inComparator = this.hasComparatorSectionTarget && !this.comparatorSectionTarget.hidden
//   if (inComparator) {
//     if (this.hasLocateSectionTarget) this.locateSectionTarget.hidden = true
//   }


//   window.dispatchEvent(new CustomEvent("layer:cleared"))

//   this.clearLayerButtonsUI()

//   // ✅ Aplicar visibilidad de botones según category
//   this.applyOpportunityCategory(category)

//   window.dispatchEvent(new CustomEvent("opportunity:selected", {
//     detail: { opportunity_code: opportunityCode }
//   }))
// }


// selectLayer(e) {
//   const btn = e.currentTarget

//   // toggle devuelve true si quedó activo
//   const isActive = btn.classList.toggle("is-active")

//   // quitar active de los otros botones principales
//   const allButtons = this.element.querySelectorAll(".sidebar__layer-btn")
//   allButtons.forEach(otherBtn => {
//     if (otherBtn !== btn) {
//       otherBtn.classList.remove("is-active")
//     }
//   })

//   const metric = btn.dataset.metric

//   // Solo disparamos evento si quedó activo
//   if (isActive && metric) {
//     window.dispatchEvent(new CustomEvent("layer:selected", {
//       detail: { metric }
//     }))
//   } else if (!isActive) {
//     window.dispatchEvent(new CustomEvent("layer:cleared"))
//   }

//   // 👇 Mostrar/ocultar sub-botones solo si es Accesibilidad
//   const isAccessibility = btn.dataset.layer === "accessibility"

//   if (isAccessibility) {
//     this.accessibilityChoicesTarget.hidden = !isActive

//     // si se desactiva accesibilidad → limpiar sub-botones
//     if (!isActive) {
//       this.accessibilityChoicesTarget
//         .querySelectorAll(".sidebar__subchoice-btn")
//         .forEach(b => b.classList.remove("is-active"))
//     }
//   } else {
//     // si se selecciona otra capa → ocultar accesibilidad
//     this.accessibilityChoicesTarget.hidden = true

//     // ✅ NUEVO: limpiar sub-botones siempre
//     this.accessibilityChoicesTarget
//       .querySelectorAll(".sidebar__subchoice-btn")
//       .forEach(b => b.classList.remove("is-active"))
//   }
// }


// selectAccessibilityMode(e) {
//   const mode = e.currentTarget.dataset.mode // "walk" o "car"

//   // UI: toggle exclusivo (opcional)
//   this.accessibilityChoicesTarget
//     .querySelectorAll(".sidebar__subchoice-btn")
//     .forEach(b => b.classList.remove("is-active"))
//   e.currentTarget.classList.add("is-active")

//   window.dispatchEvent(new CustomEvent("accessibility:mode_selected", {
//     detail: { mode }
//   }))
// }


// loadLocatorOpportunitiesIntoSelect() {
//   if (!this.hasLocatorOpportunitySelectTarget) return

//   fetch("/opportunities")
//     .then(r => r.json())
//     .then(data => {
//       const selector = this.locatorOpportunitySelectTarget
//       selector.innerHTML = "<option>Seleccionar oportunidad...</option>"

//       data.forEach(op => {
//         const option = document.createElement("option")
//         option.value = op.opportunity_code
//         option.textContent = op.name
//         selector.appendChild(option)
//       })

//       // si quieres que se habilite al cargar:
//       selector.disabled = false
//     })
//     .catch(err => console.error("Error cargando oportunidades (localizador):", err))
// }




// async addProject() {
//   // 1) validar inputs
//   const name = this.projectNameInputTarget.value?.trim()
//   const h3 = this.selectedCellH3Target.value
//   const opportunityCode = this.locatorOpportunitySelectTarget.value
//   const units = Number(this.unitsInputTarget.value)
//   const areaPerUnit = Number(this.areaPerUnitInputTarget.value)

//   if (!name) return alert("Pon un nombre al proyecto.")
//   if (!h3) return alert("Selecciona una celda.")
//   if (!opportunityCode || opportunityCode.includes("Seleccionar")) return alert("Selecciona una oportunidad.")
//   if (!Number.isFinite(units) || units <= 0) return alert("Unidades debe ser > 0.")
//   if (!Number.isFinite(areaPerUnit) || areaPerUnit <= 0) return alert("Superficie por unidad debe ser > 0.")

//   // 2) asegurar draft scenario (solo si estás parado en base o si no tienes draft)
//   // Si ya estás en draft, usa ese.
//   let scenarioId = this._selectedScenarioId

//   // regla: si el seleccionado es base (system) o no hay selected, aseguro draft
//   // (por ahora: siempre aseguro draft y el server devuelve el mismo si ya existe)
//   const csrf = document.querySelector('meta[name="csrf-token"]').content

//   const draftRes = await fetch("/scenarios/ensure_draft", {
//     method: "POST",
//     headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
//     body: JSON.stringify({
//       municipality_code: this._selectedMunicipalityCode,
//       base_scenario_id: this._selectedScenarioId // si justo era el base
//     })
//   })
//   const draftJson = await draftRes.json()
//   scenarioId = draftJson.scenario_id
//   this._draftScenarioId = String(scenarioId)

//   // (opcional) actualizar selector escenario a draft y disparar scenario:selected
//   scenarioId = draftJson.scenario_id
//   this._draftScenarioId = String(scenarioId)

//   // 3) crear project
//   const resp = await fetch("/projects", {
//     method: "POST",
//     headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
//     body: JSON.stringify({
//       scenario_id: scenarioId,
//       project: {
//         name,
//         h3,
//         opportunity_code: opportunityCode,
//         total_agents: units,
//         surface_per_agent: areaPerUnit
//       }
//     })
//   })

//   const json = await resp.json()
//   if (!resp.ok) {
//     console.error(json)
//     return alert(json.error || (json.errors || ["Error guardando"]).join("\n"))
//   }

//   // 4) UX: limpiar inputs “variables” para agregar otro
//   this.projectNameInputTarget.value = ""
//   this.unitsInputTarget.value = ""
//   this.areaPerUnitInputTarget.value = ""


//   await this.refreshProjectsLists()
// }

// toggleLocator() {
//   this.locatorPanelTarget.hidden = !this.locatorPanelTarget.hidden

//   if (!this.locatorPanelTarget.hidden) {
//     // ✅ si está colapsada, se pega al borde; si no, queda al lado
//     this.locatorPanelTarget.style.left = this.collapsed ? "0px" : "300px"
//   }
// }


// startPickCell() {
//   this.pickCellModalTarget.hidden = false
//   window.dispatchEvent(new CustomEvent("cell:pick_start"))

//   this._onEscPickCell = (ev) => {
//     if (ev.key === "Escape") this.cancelPickCell()
//   }
//   window.addEventListener("keydown", this._onEscPickCell)
// }

// cancelPickCell() {
//   this.pickCellModalTarget.hidden = true
//   window.dispatchEvent(new CustomEvent("cell:pick_cancel"))

//   if (this._onEscPickCell) {
//     window.removeEventListener("keydown", this._onEscPickCell)
//     this._onEscPickCell = null
//   }
// }

// onCellPicked = (e) => {
//   const { h3, show_id } = e.detail

//   this.selectedCellH3Target.value = h3
//   this.selectedCellDisplayTarget.value = `Celda ${show_id ?? ""}`.trim()

//   // ✅ cerrar hint
//   this.pickCellModalTarget.hidden = true

//   if (this.hasLocatorOpportunitySelectTarget) {
//     this.locatorOpportunitySelectTarget.disabled = false
//   }

//   // ✅ apagar modo selección en el mapa
//   window.dispatchEvent(new CustomEvent("cell:pick_cancel"))

//   // ✅ si habilitaste ESC, limpiar listener
//   if (this._onEscPickCell) {
//     window.removeEventListener("keydown", this._onEscPickCell)
//     this._onEscPickCell = null
//   }
// }


// async refreshProjectsLists() {
//   if (!this._selectedScenarioId) return
//   if (!this.hasPreviousProjectsListTarget || !this.hasDraftProjectsListTarget) return

//   // ✅ si es base: ocultar historial y NO pedirlo
//   if (this._selectedScenarioIsBase) {
//     if (this.hasPreviousProjectsSectionTarget) this.previousProjectsSectionTarget.hidden = true
//     if (this.hasPreviousProjectsListTarget) this.previousProjectsListTarget.innerHTML = ""
//     // pero sí mostramos borrador:
//     // -> podemos pedir un endpoint reducido (draft-only) o usar el mismo endpoint (ya no falla).
//   } else {
//     if (this.hasPreviousProjectsSectionTarget) this.previousProjectsSectionTarget.hidden = false
//   }

//   const url = `/scenarios/${encodeURIComponent(this._selectedScenarioId)}/projects_lists`

//   try {
//     const resp = await fetch(url)
//     const data = await resp.json()

//     if (!resp.ok) {
//       console.error(data)
//       this.previousProjectsListTarget.innerHTML = "<div class='sidebar__hint sidebar__hint--muted'>No se pudieron cargar.</div>"
//       this.draftProjectsListTarget.innerHTML = ""
//       return
//     }

//     this._draftScenarioId = data.draft_scenario?.id ? String(data.draft_scenario.id) : null

//     const renderNames = (items, emptyText) => {
//       if (!Array.isArray(items) || items.length === 0) {
//         return `<div class='sidebar__hint sidebar__hint--muted'>${emptyText}</div>`
//       }
//       return items.map(p => `
//         <div class="locator-project">
//           <div class="locator-project__name">${(p.name || "").replaceAll("<","&lt;").replaceAll(">","&gt;")}</div>
//         </div>
//       `).join("")
//     }

//     this.previousProjectsListTarget.innerHTML =
//       renderNames(data.previous_projects, "No hay proyectos en el historial.")

//     this.draftProjectsListTarget.innerHTML =
//       renderNames(data.draft_projects, "No hay proyectos en borrador.")
//   } catch (err) {
//     console.error(err)
//     this.previousProjectsListTarget.innerHTML = "<div class='sidebar__hint sidebar__hint--muted'>Error cargando.</div>"
//     this.draftProjectsListTarget.innerHTML = ""
//   }
// }


// async confirmPublishScenario() {
//   const scenarioId = this._draftScenarioId
//   if (!scenarioId) return alert("No hay borrador para guardar.")

//   const name = this.publishNameInputTarget.value?.trim()
//   if (!name) return alert("Escribe un nombre para el escenario.")

//   const csrf = document.querySelector('meta[name="csrf-token"]').content

//   // bloquear botón mientras corre
//   if (this.hasAddBtnTarget) this.addBtnTarget.disabled = true

//   try {
//     const resp = await fetch(`/scenarios/${scenarioId}/publish`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
//       body: JSON.stringify({ name })
//     })

//     const json = await resp.json()

//     if (!resp.ok) {
//       console.error(json)
//       return alert(json.error || "Error publicando escenario")
//     }

//     this.closePublishModal()

//     // recargar escenarios
//     if (this._selectedMunicipalityCode) {
//       this.loadScenariosIntoSelect(this._selectedMunicipalityCode)
//     }

//     // ya no hay borrador
//     this._draftScenarioId = null

//     // refrescar listas (historial/borrador)
//     await this.refreshProjectsLists()

//     alert("Escenario guardado y accesibilidades recalculadas ✅")
//   } finally {
//     if (this.hasAddBtnTarget) this.addBtnTarget.disabled = false
//   }
// }

// async deleteScenario() {
//   const scenarioId = this._selectedScenarioId || this.scenarioSelectTarget?.value
//   if (!scenarioId) return

//   // Nunca borrar base desde front (doble protección)
//   const opt = this.scenarioSelectTarget?.selectedOptions?.[0]
//   const isBase = (opt?.dataset?.isBase === "1")
//   if (isBase) return alert("No puedes eliminar el escenario base.")

//   // Si hay borrador colgando, mejor impedir o avisar
//   if (this._draftScenarioId) {
//     return alert("Tienes un borrador activo. Guarda/recalcula o descártalo antes de eliminar.")
//   }

//   const ok = confirm("¿Eliminar este escenario y todos sus descendientes? Esta acción no se puede deshacer.")
//   if (!ok) return

//   const csrf = document.querySelector('meta[name="csrf-token"]').content

//   const resp = await fetch(`/scenarios/${encodeURIComponent(scenarioId)}`, {
//     method: "DELETE",
//     headers: { "X-CSRF-Token": csrf }
//   })

//   const json = await resp.json().catch(() => ({}))

//   if (!resp.ok) {
//     console.error(json)
//     return alert(json.error || "Error eliminando escenario.")
//   }

//   // 1) limpiar mapa/capas
//   window.dispatchEvent(new CustomEvent("layer:cleared"))
//   this.clearLayerButtonsUI()

//   // 2) recargar escenarios de la comuna
//   if (this._selectedMunicipalityCode) {
//     await this.loadScenariosIntoSelect(this._selectedMunicipalityCode, { autoSelectBase: true })
//   }

//   // 3) asegurar que el estado interno quede base
//   this._draftScenarioId = null


//   alert("Escenario eliminado")
// }


// onUIModeChanged = (e) => {
//     const mode = e.detail?.mode
//     if (mode === "comparador") {
//       this.enterComparatorMode()
//     } else {
//       this.enterConstructorMode()
//     }
//   }

//   loadScenariosIntoComparatorSelects(munCode) {
//     if (!this.hasScenarioASelectTarget || !this.hasScenarioBSelectTarget) return

//     this.scenarioASelectTarget.disabled = true
//     this.scenarioBSelectTarget.disabled = true

//     fetch(`/scenarios/names?municipality_code=${encodeURIComponent(munCode)}`)
//       .then(r => r.json())
//       .then(data => {
//         // ✅ Incluir base + escenarios del usuario, pero excluir draft
//         const scenarios = data.filter(s => s.name !== "Borrador" && s.name !== "Draft")

//         const base = scenarios.find(s => s.is_base)
//         const nonBase = scenarios.filter(s => !s.is_base)

//         const fill = (sel, placeholder) => {
//           sel.innerHTML = `<option>${placeholder}</option>`

//           // ✅ base primero
//           if (base) {
//             const opt = document.createElement("option")
//             opt.value = base.id
//             opt.textContent = base.name
//             sel.appendChild(opt)
//           }

//           // ✅ luego los demás
//           nonBase.forEach(s => {
//             const opt = document.createElement("option")
//             opt.value = s.id
//             opt.textContent = s.name
//             sel.appendChild(opt)
//           })

//           sel.disabled = scenarios.length === 0
//         }

//         fill(this.scenarioASelectTarget, "Seleccionar escenario A...")
//         fill(this.scenarioBSelectTarget, "Seleccionar escenario B...")

//         // (opcional) default: A = base si existe
//         if (base) {
//           this.scenarioASelectTarget.value = String(base.id)
//           this._scenarioAId = String(base.id)
//         }
//       })
//       .catch(err => {
//         console.error("Error cargando escenarios (comparador):", err)
//         this.scenarioASelectTarget.disabled = true
//         this.scenarioBSelectTarget.disabled = true
//       })
//   }

//   scenarioAChanged(e) {
//     const id = e.target.value
//     if (!id || id.includes("Seleccionar")) return
//     this._scenarioAId = id
//   }

//   scenarioBChanged(e) {
//     const id = e.target.value
//     if (!id || id.includes("Seleccionar")) return
//     this._scenarioBId = id
//   }

//   compareModeSelected(e) {
//     const btn = e.currentTarget
//     const mode = btn.dataset.mode

//     // UI toggle
//     btn.closest(".compare-modes")
//       .querySelectorAll(".compare-modes__btn")
//       .forEach(b => b.classList.remove("is-active"))
//     btn.classList.add("is-active")

//     this._compareMode = mode

//     // Más adelante: dispatch para que el mapa cambie
//     // window.dispatchEvent(new CustomEvent("compare:mode_selected", { detail: { mode } }))
//   }


// hideLegend() {
//   if (this.hasLegendPanelTarget) this.legendPanelTarget.hidden = true
// }

// showLegendButtonIfNeeded() {
//   // Mostrar solo si hay celdas visibles y tenemos breaks
//   const shouldShow = !!(this._cellsBreaks && this._cellsBreaks.length >= 2)
//   if (this.hasLegendBtnTarget) this.legendBtnTarget.hidden = !shouldShow
//   if (!shouldShow) this.legend.hide()
// }

// renderLegend() {
//   if (!this.hasLegendItemsTarget) return
//   if (!this._cellsBreaks || this._cellsBreaks.length < 2) return

//   const breaks = this._cellsBreaks.map(Number)
//   const k = breaks.length - 1
//   const rows = []

//   // Colores deben calzar con tu match en cells-fill
//   const colorsByClass = {
//     0: "#e5e7eb",
//     1: "#dbeafe",
//     2: "#93c5fd",
//     3: "#3b82f6",
//     4: "#1d4ed8",
//     5: "#0b3aa4"
//   }

//   const isAccessibility = (this._selectedLayerType === "accessibility")
//   const isDelta = (this._selectedLayerType === "delta")

//   if (isAccessibility) {
//     for (let i = 1; i <= 5; i++) {
//       rows.push({ klass: i, label: this.accessibilityLabelForClass(i) })
//     }
//   } else {
//     // thematic normal: incluye "Sin datos / 0" + rangos
//     rows.push({ klass: 0, label: isDelta ? "Sin cambio / 0" : "Sin datos / 0" })

//     const breaks = this._cellsBreaks.map(Number)
//     for (let i = 1; i <= k; i++) {
//       const lo = breaks[i - 1]
//       const hi = breaks[i]
//       rows.push({ klass: i, label: `${Math.round(lo).toLocaleString("es-CL")} – ${Math.round(hi).toLocaleString("es-CL")}` })
//     }
//   }

//   this.legendItemsTarget.innerHTML = rows.map(r => {
//     const color = colorsByClass[r.klass] || "#000"
//     return `
//       <div class="map-legend__row" data-klass="${r.klass}">
//         <span class="map-legend__swatch" style="background:${color}"></span>
//         <span class="map-legend__label">${r.label}</span>
//       </div>
//     `
//   }).join("")

//   this.bindLegendHoverOnce()
// }

// clearLegendClassFocus() {
//   if (!this.map?.getLayer("cells-fill")) return
//   this._legendFocusClass = null

//   // Vuelve a tu opacidad normal original
//   this.map.setPaintProperty("cells-fill", "fill-opacity", 0.75)
// }

// toggleLegend = () => {
//   if (!this.hasLegendPanelTarget) return
//   this.legendPanelTarget.hidden = !this.legendPanelTarget.hidden
// }


// formatLegendNumber(n) {
//   if (!Number.isFinite(n)) return "-"
//   // accesibilidad puede ser float; surface/units int
//   if (this._selectedLayerType === "accessibility") {
//     return n.toFixed(2)
//   }
//   // surface/units: enteros
//   return Math.round(n).toLocaleString("es-CL")
// }

// accessibilityLabelForClass(klass) {
//   const labels = {
//     1: "Muy baja",
//     2: "Baja",
//     3: "Media",
//     4: "Alta",
//     5: "Muy alta"
//   }
//   return labels[klass] || "-"
// }

// bindLegendHoverOnce() {
//   if (!this.hasLegendItemsTarget) return
//   if (this._legendHoverBound) return
//   this._legendHoverBound = true

//   this.legendItemsTarget.addEventListener("mouseover", (e) => {
//     const row = e.target.closest?.(".map-legend__row")
//     if (!row) return

//     const klass = row.dataset.klass
//     if (!klass) return

//     // En thematic puede existir clase 0 ("Sin datos"), si no quieres filtrar por 0, ignóralo:
//     // if (Number(klass) === 0) return

//     this.applyLegendClassFocus(klass)
//   })

//   this.legendItemsTarget.addEventListener("mouseout", (e) => {
//     // Si saliste completamente de la leyenda, resetea
//     const stillInside = this.legendItemsTarget.contains(e.relatedTarget)
//     if (!stillInside) this.legend.clearClassFocus()
//   })
// }

// applyLegendClassFocus(klass) {
//   if (!this.map?.getLayer("cells-fill")) return
//   const k = Number(klass)

//   // Guarda estado por si lo necesitas
//   this._legendFocusClass = k

//   // Atenúa todo lo que NO sea la clase
//   this.map.setPaintProperty("cells-fill", "fill-opacity", [
//     "case",
//     ["==", ["get", "class"], k],
//     0.80,   // clase enfocada
//     0    // resto atenuado
//   ])
// }

// setCellsVisible(visible) {
//   const visibility = visible ? "visible" : "none"

//   if (this.map.getLayer("cells-fill")) {
//     this.map.setLayoutProperty("cells-fill", "visibility", visibility)
//   }

//   if (this.map.getLayer("cells-outline")) {
//     this.map.setLayoutProperty("cells-outline", "visibility", visibility)
//   }
// }

// ensureCellsLayer() {
//   if (!this.map.getSource("cells")) {
//     this.map.addSource("cells", {
//       type: "geojson",
//       data: { type: "FeatureCollection", features: [] },
//       promoteId: "h3"
//     })
//   }

//   if (!this.map.getLayer("cells-fill")) {
//     this.map.addLayer({
//       id: "cells-fill",
//       type: "fill",
//       source: "cells",
//       paint: {
//         "fill-opacity": 0.75,
//         "fill-color": [
//           "match",
//           ["get", "class"],
//           0, "#e5e7eb",
//           1, "#dbeafe",
//           2, "#93c5fd",
//           3, "#3b82f6",
//           4, "#1d4ed8",
//           5, "#0b3aa4",
//           "#f3f4f6"
//         ]
//       }
//     })
//   }

//   if (!this.map.getLayer("cells-outline")) {
//     this.map.addLayer({
//       id: "cells-outline",
//       type: "line",
//       source: "cells",
//       paint: {
//         "line-color": [
//           "case",
//           ["boolean", ["feature-state", "selected"], false],
//           "#2563eb",                // azul selección
//           "rgba(17,24,39,0.20)"     // normal
//         ],
//         "line-width": [
//           "case",
//           ["boolean", ["feature-state", "selected"], false],
//           3,   // grosor seleccionado
//           1
//         ]
//       }
//     })
//   }

//   if (!this.map.getLayer("cells-hover")) {
//     this.map.addLayer({
//       id: "cells-hover",
//       type: "fill",
//       source: "cells",
//       paint: {
//         "fill-color": "#111827",
//         "fill-opacity": [
//           "case",
//           ["boolean", ["feature-state", "hover"], false],
//           0.15,
//           0
//         ]
//       }
//     })
//   }
//   this.hover.bindCellsHoverTooltip()
// }

// ensureLocatorLayers() {
//   try {
//     if (!this.map.hasImage("hatch-60")) {
//       this.map.addImage("hatch-60", this.createHatchPattern60())
//     }
//   } catch (err) {
//     console.error("❌ hatch-60 addImage failed:", err)
//     return false
//   }

//   if (!this.map.getLayer("cells-parent-fill")) {
//     this.map.addLayer({
//       id: "cells-parent-fill",
//       type: "fill",
//       source: "cells",
//       paint: { "fill-opacity": 0.70, "fill-color": "#ef4444" },
//       filter: ["==", ["get", "has_parent_projects"], true]
//     })
//     this.map.setLayoutProperty("cells-parent-fill", "visibility", "none")
//   }

//   if (!this.map.getLayer("cells-draft-hatch")) {
//     this.map.addLayer({
//       id: "cells-draft-hatch",
//       type: "fill",
//       source: "cells",
//       paint: { "fill-opacity": 1, "fill-pattern": "hatch-60" },
//       filter: ["==", ["get", "has_draft_projects"], true]
//     })
//     this.map.setLayoutProperty("cells-draft-hatch", "visibility", "none")
//   }

//   return true
// }

// onRegionSelected = async (event) => {
//   const regionCode = event.detail.region_code

//   // 1) mover cámara
//   const focus = await fetch(`/regions/focus?region_code=${encodeURIComponent(regionCode)}`).then(r => r.json())
//   this.map.flyTo({
//     center: focus.centroid, // [lng, lat]
//     zoom: focus.zoom,
//     essential: true
//   })

//   // 2) cargar comunas y pintar
//   const fc = await fetch(`/municipalities?region_code=${encodeURIComponent(regionCode)}`).then(r => r.json())
//   this.map.getSource("municipalities").setData(fc)

//   this.setRegionsVisible(false)
//   this.setMunicipalitiesVisible(true)
// }

// onMunicipalitySelected = async (event) => {
//   const munCode = event.detail.municipality_code
//   this._selectedMunicipalityCode = munCode

//   const focus = await fetch(`/municipalities/focus?municipality_code=${encodeURIComponent(munCode)}`).then(r => r.json())
//   this.map.flyTo({
//     center: focus.centroid,
//     zoom: focus.zoom,
//     essential: true
//   })

//   this.setRegionsVisible(false)
//   this.setMunicipalitiesVisible(false)

//   this.map.getSource("selected-municipality").setData(focus.geometry)
// }

// onMunicipalityCleared = () => {
//   const src = this.map.getSource("selected-municipality")
//   if (!src) return

//   src.setData({ type: "FeatureCollection", features: [] })
// }

// setRegionsVisible(visible) {
//   const v = visible ? "visible" : "none"
//   ;["regions-fill", "regions-outline", "regions-hover"].forEach((id) => {
//     if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", v)
//   })
// }

// setMunicipalitiesVisible(visible) {
//   const v = visible ? "visible" : "none"
//   ;["municipalities-fill", "municipalities-outline"].forEach((id) => {
//     if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", v)
//   })
// }

// ensureMunicipalitiesLayer() {
//   // source vacío inicial
//   this.map.addSource("municipalities", {
//     type: "geojson",
//     data: { type: "FeatureCollection", features: [] },
//     promoteId: "municipality_code"
//   })

//   // fill
//   this.map.addLayer({
//     id: "municipalities-fill",
//     type: "fill",
//     source: "municipalities",
//     paint: {
//       "fill-color": "#2bf89a",
//       "fill-opacity": 0.25
//     }
//   })

//   // borde
//   this.map.addLayer({
//     id: "municipalities-outline",
//     type: "line",
//     source: "municipalities",
//     paint: {
//       "line-color": "#1cb66e",
//       "line-width": 2
//     }
//   })

//   if (!this.map.getLayer("municipalities-hover")) {
//     this.map.addLayer({
//       id: "municipalities-hover",
//       type: "fill",
//       source: "municipalities",
//       paint: {
//         "fill-color": "#2bf89a",
//         "fill-opacity": [
//           "case",
//           ["boolean", ["feature-state", "hover"], false],
//           0.3,
//           0
//         ]
//       }
//     })
//   }

//   this.setMunicipalitiesVisible(false)

//   if (!this.map.getSource("selected-municipality")) {
//     this.map.addSource("selected-municipality", {
//       type: "geojson",
//       data: { type: "FeatureCollection", features: [] }
//     })
//   }

//   if (!this.map.getLayer("selected-municipality-outline")) {
//     this.map.addLayer({
//       id: "selected-municipality-outline",
//       type: "line",
//       source: "selected-municipality",
//       paint: {
//         "line-color": "#111827",
//         "line-width": 2.5,
//         "line-opacity": 0.9,
//         "line-dasharray": [2, 2]
//       }
//     })
//   }
// }

// loadRegionsIntoMap() {
//   fetch("/regions")
//     .then(r => r.json())
//     .then((fc) => {
//       if (!Array.isArray(fc.features)) {
//         console.error("GeoJSON inválido en /regions", fc)
//         return
//       }

//       // 1) source único
//       if (this.map.getSource("regions")) {
//         this.map.getSource("regions").setData(fc)
//       } else {
//         this.map.addSource("regions", { type: "geojson", data: fc, promoteId: "region_code"})
//       }

//       // 2) layers únicos (fill + outline)
//       if (!this.map.getLayer("regions-fill")) {
//         this.map.addLayer({
//           id: "regions-fill",
//           type: "fill",
//           source: "regions",
//           paint: {
//             // "fill-color": "#88B4FF",
//             "fill-color": "#2bf89a",
//             "fill-opacity": 0.5
//           }
//         })
//       }

//       if (!this.map.getLayer("regions-outline")) {
//         this.map.addLayer({
//           id: "regions-outline",
//           type: "line",
//           source: "regions",
//           paint: {
//             "line-color": "#1cb66e",
//             "line-width": 2
//           }
//         })
//       }

//       // 3) hover highlight con feature-state (sin duplicar layers)
//       if (!this.map.getLayer("regions-hover")) {
//         this.map.addLayer({
//           id: "regions-hover",
//           type: "fill",
//           source: "regions",
//           paint: {
//             "fill-color": "#2bf89a",
//             "fill-opacity": [
//               "case",
//               ["boolean", ["feature-state", "hover"], false],
//               0.3,
//               0
//             ]
//           }
//         })
//       }

//       this.hover.bindRegionsHoverTooltip() // ✅ listeners 1 vez
//     })
//     .catch(err => console.error("Error cargando regiones:", err))
// }

// bindRegionsClick() {
//   if (this._regionsClickBound) return
//   this._regionsClickBound = true

//   this.map.on("click", "regions-fill", (e) => {
//     const f = e.features && e.features[0]
//     if (!f) return

//     const regionCode = f.properties?.region_code
//     if (!regionCode) return

//     window.dispatchEvent(new CustomEvent("region:clicked", {
//       detail: { region_code: regionCode }
//     }))
//   })
// }

// bindMunicipalitiesClick() {
//   // evita registrarlo dos veces, importante para eventos de click
//   if (this._municipalitiesClickBound) return
//   this._municipalitiesClickBound = true

//   this.map.on("click", "municipalities-fill", (e) => {
//     const f = e.features && e.features[0]
//     if (!f) return

//     const munCode = f.properties?.municipality_code

//     if (!munCode) return

//     window.dispatchEvent(new CustomEvent("municipality:clicked", {
//       detail: { municipality_code: munCode }
//     }))
//   })
// }

// safeSetVisibility(layerId, vis) {
//   if (this.map.getLayer(layerId)) {
//     this.map.setLayoutProperty(layerId, "visibility", vis)
//   }
// }


// onLocatorOpened = async () => {
//   this._inLocator = true
//   this.ensureCellsLayer()

//   const ok = this.ensureLocatorLayers()
//   if (!ok) return

//   const mun = this._selectedMunicipalityCode
//   const selectedId = this._selectedScenarioId

//   if (!mun || !selectedId) {
//     console.warn("locator missing context", { mun, selectedId })
//     return
//   }

//   // ✅ decidir draftScenarioId según el status del escenario seleccionado
//   const selectedIsDraft = (this._selectedScenarioStatus === "draft")
//   const draftScenarioId = selectedIsDraft ? selectedId : this._draftScenarioId

//   console.log(this._selectedScenarioId)
//   console.log(this._selectedScenarioStatus)
//   console.log(draftScenarioId)

//   // ✅ snapshot para restaurar al cerrar
//   if (!this._locatorPrev) this._locatorPrev = {}
//   this._locatorPrev.fc = this.map.getSource("cells")?._data || null
//   this._locatorPrev.layerType = this._selectedLayerType || null
//   this._locatorPrev.metric = this._selectedMetric || null
//   this._locatorPrev.accessMode = this._selectedAccessibilityMode || null
//   this._locatorPrev.breaks = this._cellsBreaks || null
//   this._locatorPrev.wasVisible = (this.map.getLayer("cells-fill") &&
//     this.map.getLayoutProperty("cells-fill", "visibility") !== "none")

//   let url =
//     `/cells/locator_status?municipality_code=${encodeURIComponent(mun)}` +
//     `&base_scenario_id=${encodeURIComponent(selectedId)}`

//   if (draftScenarioId) {
//     url += `&draft_scenario_id=${encodeURIComponent(draftScenarioId)}`
//   }

//   const fc = await fetch(url).then(r => r.json())
//   this.map.getSource("cells").setData(fc)

//   this.setCellsVisible(true)
//   this.safeSetVisibility("cells-parent-fill", "visible")
//   this.safeSetVisibility("cells-draft-hatch", "visible")
// }

// onLocatorClosed = () => {
//   this._inLocator = false
//   this.ensureCellsLayer()

//   // ocultar overlays
//   this.safeSetVisibility("cells-parent-fill", "none")
//   this.safeSetVisibility("cells-draft-hatch", "none")

//   const prev = this._locatorPrev
//   const source = this.map.getSource("cells")

//   if (prev?.fc && source) {
//     // ✅ restaurar data anterior
//     source.setData(prev.fc)

//     // restaurar breaks si aplica
//     this._cellsBreaks = prev.breaks || null

//     // restaurar visibilidad (si antes estaba visible)
//     this.setCellsVisible(!!prev.wasVisible)

//     // opcional: re-render leyenda si corresponde
//     if (prev.wasVisible) {
//       this.legend.render?.()
//       this.legend.showButtonIfNeeded?.()
//     }
//   } else {
//     // ✅ si antes no había capa seleccionada, dejar vacío
//     if (source) {
//       source.setData({ type: "FeatureCollection", features: [] })
//     }
//     this._cellsBreaks = null
//     this.setCellsVisible(false)
//   }

//   // limpiar snapshot
//   this._locatorPrev = null
// }

// onScenarioSelected = (event) => {
//   this._selectedScenarioId = event.detail.scenario_id
//   this._selectedScenarioStatus = event.detail.status

//   // ✅ Cambió el escenario: limpia lo que esté pintado para evitar “data pegada”
//   this.onLayerCleared()
// }

// onUIModeChanged = (e) => {
//   this._uiMode = e.detail?.mode

//   // opcional: cuando cambias de modo, puedes limpiar estados visuales
//   // if (this._uiMode === "comparador") this.onLayerCleared()
// }

// onComparisonContextChanged = (e) => {
//   this._scenarioAId = e.detail?.scenario_a_id
//   this._scenarioBId = e.detail?.scenario_b_id
//   this._compareMode = e.detail?.compare_mode
// }

// onLayerCleared = () => {
//   // apaga visibilidad
//   this.setCellsVisible(false)

//   // limpia data para que no quede “pegado”
//   const src = this.map.getSource("cells")
//   if (src) {
//     src.setData({ type: "FeatureCollection", features: [] })
//   }

//   this._cellsBreaks = null
//   this._selectedMetric = null
//   this._selectedLayerType = null
//   this._selectedAccessibilityMode = null

//   if (this._clearCellsHover) this._clearCellsHover()

//   this.legend.hide()
//   this.legend.showButtonIfNeeded()
//   this.legend.clearClassFocus()
// }

// onOpportunitySelected = (event) => {
//   this._selectedOpportunityCode = event.detail.opportunity_code
//   console.log("✅ guardé opp:", this._selectedOpportunityCode)
// }

// onAccessibilityModeSelected = async (event) => {
//   const mode = event.detail.mode
//   if (!this._selectedMunicipalityCode) return
//   if (!this._selectedOpportunityCode) return

//   // ✅ si estamos en comparador y modo delta → accessibility_delta
//   const inComparator = (this._uiMode === "comparador") // ajusta al nombre real que uses
//   const isDelta = (this._compareMode === "delta")       // ajusta

//   this.ensureCellsLayer()

//   if (inComparator && isDelta) {
//     if (!this._scenarioAId || !this._scenarioBId) return

//     this._selectedLayerType = "delta"
//     this._selectedAccessibilityMode = mode
//     this._selectedMetric = null

//     const url =
//       `/cells/accessibility_delta?municipality_code=${encodeURIComponent(this._selectedMunicipalityCode)}` +
//       `&mode=${encodeURIComponent(mode)}` +
//       `&opportunity_code=${encodeURIComponent(this._selectedOpportunityCode)}` +
//       `&scenario_a_id=${encodeURIComponent(this._scenarioAId)}` +
//       `&scenario_b_id=${encodeURIComponent(this._scenarioBId)}`

//     const fc = await fetch(url).then(r => r.json())

//     this.map.getSource("cells").setData({ type: "FeatureCollection", features: fc.features })
//     this._cellsBreaks = fc.breaks

//     this.setCellsVisible(true)
//     this.legend.render()
//     this.legend.showButtonIfNeeded()
//     return
//   }

//   this._selectedLayerType = "accessibility"     // ✅
//   this._selectedAccessibilityMode = mode        // ✅
//   this._selectedMetric = null                   // ✅

//   const scenarioId = this._selectedScenarioId

//   const url =
//     `/cells/accessibility?municipality_code=${encodeURIComponent(this._selectedMunicipalityCode)}` +
//     `&mode=${encodeURIComponent(mode)}` +
//     `&opportunity_code=${encodeURIComponent(this._selectedOpportunityCode)}` +
//     `&scenario_id=${encodeURIComponent(scenarioId)}`

//   const fc = await fetch(url).then(r => r.json())

//   this.map.getSource("cells").setData({
//     type: "FeatureCollection",
//     features: fc.features
//   })

//   this._cellsBreaks = fc.breaks
//   this.setCellsVisible(true)

//   this.legend.render()
//   this.legend.showButtonIfNeeded()
// }

// createHatchPattern60() {
//   const size = 32
//   const canvas = document.createElement("canvas")
//   canvas.width = size
//   canvas.height = size
//   const ctx = canvas.getContext("2d")

//   ctx.clearRect(0, 0, size, size)
//   ctx.translate(size / 2, size / 2)
//   ctx.rotate((60 * Math.PI) / 180)
//   ctx.translate(-size / 2, -size / 2)

//   ctx.lineWidth = 2
//   ctx.strokeStyle = "rgba(17,24,39,0.35)"
//   for (let x = -size; x < size * 2; x += 8) {
//     ctx.beginPath()
//     ctx.moveTo(x, -size)
//     ctx.lineTo(x, size * 2)
//     ctx.stroke()
//   }

//   // ✅ devuelve ImageData en vez de canvas (evita mismatch)
//   return ctx.getImageData(0, 0, size, size)
// }

// onComparisonDeltaSelected = async (event) => {
//   const { scenario_a_id, scenario_b_id, opportunity_code, metric } = event.detail

//   if (!this._selectedMunicipalityCode) return
//   if (!scenario_a_id || !scenario_b_id) return
//   if (!opportunity_code || !metric) return

//   this._selectedLayerType = "delta"
//   this._selectedMetric = metric
//   this._selectedOpportunityCode = opportunity_code

//   this.ensureCellsLayer()

//   const url =
//     `/cells/delta?municipality_code=${encodeURIComponent(this._selectedMunicipalityCode)}` +
//     `&scenario_a_id=${encodeURIComponent(scenario_a_id)}` +
//     `&scenario_b_id=${encodeURIComponent(scenario_b_id)}` +
//     `&opportunity_code=${encodeURIComponent(opportunity_code)}` +
//     `&metric=${encodeURIComponent(metric)}`

//   const payload = await fetch(url).then(r => r.json())

//   this.map.getSource("cells").setData({
//     type: "FeatureCollection",
//     features: payload.features
//   })

//   this._cellsBreaks = payload.breaks
//   this.setCellsVisible(true)

//   this.legend.render()
//   this.legend.showButtonIfNeeded()
// }
