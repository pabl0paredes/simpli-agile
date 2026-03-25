import { Controller } from "@hotwired/stimulus"
import { csrfToken, getJSON, postJSON, deleteJSON, escapeHTML, trackEvent } from "controllers/sidebar/api"
import { createUIState } from "controllers/sidebar/ui_state"
import { createRegionsMunicipalities } from "controllers/sidebar/regions_municipalities"
import { createScenarios } from "controllers/sidebar/scenarios"
import { createOpportunitiesLayers } from "controllers/sidebar/opportunities_layers"
import { createLocator } from "controllers/sidebar/locator"
import { createProjectLists } from "controllers/sidebar/project_lists"
import { createPublishDelete } from "controllers/sidebar/publish_delete"
import { createComparator } from "controllers/sidebar/comparator"

export default class extends Controller {
  static values = { defaultMunicipality: String }

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
    "modeToggle",
    "regionSection",
    "municipalitySection",
    "comparatorSection",
    "comparatorDivider",
    "compareModeSection",
    "scenarioASelect",
    "scenarioBSelect",
    "saveScenarioBtn",
    "scenarioParentDisplay",
    "locatorBtn",
    "regionSelectWrap",
    "regionBackBtn",
    "municipalitySelectWrap",
    "municipalityBackBtn",
    "opportunitySection",
    "addScenarioBtn",
    "unitsSection",
    "areaPerUnitSection",
    "noDataSection",
  ]

  connect() {
    this.collapsed = false
    this.ui = createUIState(this)
    this.regionsMunicipalities = createRegionsMunicipalities(this)
    this.scenarios = createScenarios(this)
    this.opportunitiesLayers = createOpportunitiesLayers(this)
    this.locator = createLocator(this)
    this.projectLists = createProjectLists(this)
    this.publishDelete = createPublishDelete(this)
    this.comparator = createComparator(this)

    this.loadRegionsIntoSelect()
    this.loadMunicipalitiesIntoSelect()
    this.loadOpportunitiesIntoSelect()
    this.loadLocatorOpportunitiesIntoSelect()
    this._api = { csrfToken, getJSON, postJSON, deleteJSON, escapeHTML, trackEvent }

    window.addEventListener("region:clicked", this.onRegionClicked)
    window.addEventListener("municipality:clicked", this.onMunicipalityClicked)
    window.addEventListener("sidebar:toggle", this.onSidebarToggle)
    window.addEventListener("cell:picked", this.onCellPicked)
    window.addEventListener("scenario:selected", this.onScenarioSelected)
    window.addEventListener("ui:mode_changed", this.onUIModeChanged)
    window.addEventListener("comparison:context_changed", this.onComparisonContextChanged)
    window.addEventListener("region:context_resolved", this.onRegionContextResolved)
    window.addEventListener("map:ready", this.onMapReady)
  }

  disconnect() {
    window.removeEventListener("region:clicked", this.onRegionClicked)
    window.removeEventListener("municipality:clicked", this.onMunicipalityClicked)
    window.removeEventListener("sidebar:toggle", this.onSidebarToggle)
    window.removeEventListener("cell:picked", this.onCellPicked)
    window.removeEventListener("scenario:selected", this.onScenarioSelected)
    window.removeEventListener("ui:mode_changed", this.onUIModeChanged)
    window.removeEventListener("comparison:context_changed", this.onComparisonContextChanged)
    window.removeEventListener("region:context_resolved", this.onRegionContextResolved)
    window.removeEventListener("map:ready", this.onMapReady)
  }

  loadRegionsIntoSelect() { return this.regionsMunicipalities.loadRegionsIntoSelect() }
  onRegionClicked = (e) => { return this.regionsMunicipalities.onRegionClicked(e) }
  onRegionContextResolved = (e) => { return this.regionsMunicipalities.onRegionContextResolved(e) }

  onMapReady = () => {
    this._mapReady = true
    // If sidebar was pre-rendered in municipality state, just set internal state.
    // loadMunicipalitiesIntoSelect will call municipalityChanged to set up the full sidebar UI.
    if (this.defaultMunicipalityValue && !this._pendingDefaultMunicipality) {
      const munCode = this.defaultMunicipalityValue
      this._selectedMunicipalityCode = munCode
      return
    }
    if (this._pendingDefaultMunicipality) {
      const munCode = this._pendingDefaultMunicipality
      this._pendingDefaultMunicipality = null
      if (this.hasMunicipalitySelectTarget) {
        this.municipalitySelectTarget.value = munCode
        this._instantMunicipalityLoad = true
        this.municipalityChanged({ target: this.municipalitySelectTarget })
      }
    }
  }

  loadMunicipalitiesIntoSelect(regionCode = null, opts = {}) {
    return this.regionsMunicipalities.loadMunicipalitiesIntoSelect(regionCode, opts)
  }
  onMunicipalityClicked = (e) => { return this.regionsMunicipalities.onMunicipalityClicked(e) }

  regionChanged(e) { return this.regionsMunicipalities.regionChanged(e) }
  municipalityChanged(e) { return this.regionsMunicipalities.municipalityChanged(e) }
  clearRegion() { return this.regionsMunicipalities.clearRegion() }
  clearMunicipality() { return this.regionsMunicipalities.clearMunicipality() }


  resetAfterMunicipalityChange() { return this.ui.resetAfterMunicipalityChange() }
  clearLayerButtonsUI() { return this.ui.clearLayerButtonsUI() }
  applyOpportunityCategory(category) { return this.ui.applyOpportunityCategory(category) }

  openCreateScenarioModal() { return this.scenarios.openCreateScenarioModal() }
  closePublishModal() { return this.scenarios.closeCreateScenarioModal() }
  confirmCreateScenario() { return this.scenarios.confirmCreateScenario() }

  loadScenariosIntoSelect(munCode) { return this.scenarios.loadScenariosIntoSelect(munCode) }
  scenarioChanged(e) { return this.scenarios.scenarioChanged(e) }

  // IMPORTANTE: tu listener usa this.onScenarioSelected (arrow). Mantén arrow.
  onScenarioSelected = (e) => { return this.scenarios.onScenarioSelected(e) }

  loadOpportunitiesIntoSelect() { return this.opportunitiesLayers.loadOpportunitiesIntoSelect() }
  opportunityChanged(e) { return this.opportunitiesLayers.opportunityChanged(e) }
  selectLayer(e) { return this.opportunitiesLayers.selectLayer(e) }
  selectAccessibilityMode(e) { return this.opportunitiesLayers.selectAccessibilityMode(e) }

  loadLocatorOpportunitiesIntoSelect() { return this.locator.loadLocatorOpportunitiesIntoSelect() }
  locatorOpportunityChanged(e) { return this.locator.locatorOpportunityChanged(e) }
  toggleLocator() { return this.locator.toggleLocator() }
  startPickCell() { return this.locator.startPickCell() }
  cancelPickCell() { return this.locator.cancelPickCell() }

  // IMPORTANTE: listener usa arrow. Mantén arrow:
  onCellPicked = (e) => { return this.locator.onCellPicked(e) }

  addProject() { return this.locator.addProject() }

  refreshProjectsLists() { return this.projectLists.refreshProjectsLists() }

  recalculateAccessibilities() { return this.publishDelete.recalculateAccessibilities() }
  deleteScenario() { return this.publishDelete.deleteScenario() }

  onUIModeChanged = (e) => { return this.comparator.onUIModeChanged(e) }
  onComparisonContextChanged = (e) => { return this.comparator.onComparisonContextChanged(e)}

  enterComparatorMode() { return this.comparator.enterComparatorMode() }
  enterConstructorMode() { return this.comparator.enterConstructorMode() }

  loadScenariosIntoComparatorSelects(munCode) { return this.comparator.loadScenariosIntoComparatorSelects(munCode) }

  scenarioAChanged(e) { return this.comparator.scenarioAChanged(e) }
  scenarioBChanged(e) { return this.comparator.scenarioBChanged(e) }

  compareModeSelected(e) { return this.comparator.compareModeSelected(e) }

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

  snapshotSidebarBeforeOpen() {
    // Guarda una sola vez por apertura
    if (this._locatorSidebarPrev) return

    const prev = {}

    // Opportunity select
    if (this.hasOpportunitySelectTarget) {
      prev.opportunityDisabled = this.opportunitySelectTarget.disabled
      prev.opportunityValue = this.opportunitySelectTarget.value
    }

    // Sección de capas
    if (this.hasLayerSectionTarget) {
      prev.layerSectionHidden = this.layerSectionTarget.hidden
    }

    // Estado de botones de capas (disabled + active)
    const btns = Array.from(this.element.querySelectorAll(".sidebar__layer-btn"))
    prev.layerButtons = btns.map((b) => ({
      id: b.id || null,
      datasetKey: b.dataset?.layer || b.dataset?.metric || null, // usa lo que tengas
      disabled: b.disabled,
      className: b.className,
      ariaPressed: b.getAttribute("aria-pressed"),
      // Si usas dataset para trackear active:
      isActive: b.classList.contains("is-active") || b.classList.contains("is-selected")
    }))

    // Si tienes un “estado lógico” interno de capa seleccionada, guárdalo también
    prev.selectedLayerType = this._selectedLayerType || null
    prev.selectedMetric = this._selectedMetric || null
    prev.selectedAccessibilityMode = this._selectedAccessibilityMode || null
    prev.selectedOpportunityCode = this._selectedOpportunityCode || null

    this._locatorSidebarPrev = prev
  }

  restoreSidebarAfterClose() {
    const prev = this._locatorSidebarPrev
    if (!prev) return

    // Opportunity select
    if (this.hasOpportunitySelectTarget) {
      this.opportunitySelectTarget.disabled = !!prev.opportunityDisabled
      if (prev.opportunityValue !== undefined) {
        this.opportunitySelectTarget.value = prev.opportunityValue
      }
    }

    // Sección de capas
    if (this.hasLayerSectionTarget && prev.layerSectionHidden !== undefined) {
      this.layerSectionTarget.hidden = !!prev.layerSectionHidden
    }

    // Botones: restaurar disabled + clases (y aria-pressed si lo usas)
    const btns = Array.from(this.element.querySelectorAll(".sidebar__layer-btn"))
    if (Array.isArray(prev.layerButtons) && prev.layerButtons.length === btns.length) {
      btns.forEach((b, i) => {
        const p = prev.layerButtons[i]
        b.disabled = !!p.disabled
        b.className = p.className || b.className
        if (p.ariaPressed !== null && p.ariaPressed !== undefined) {
          b.setAttribute("aria-pressed", p.ariaPressed)
        }
      })
    } else {
      // Fallback: al menos re-enable si no calza el número (por seguridad)
      btns.forEach((b) => {
        b.disabled = false
        b.classList.remove("is-disabled")
      })
    }

    // Restaurar estado lógico (si lo usas para que el UI no “mienta”)
    this._selectedLayerType = prev.selectedLayerType
    this._selectedMetric = prev.selectedMetric
    this._selectedAccessibilityMode = prev.selectedAccessibilityMode
    this._selectedOpportunityCode = prev.selectedOpportunityCode

    // Limpia snapshot
    this._locatorSidebarPrev = null
  }

  syncScenarioActionsUI() {
    const inComparator = (this._uiMode === "comparador")
    const opt = this.scenarioSelectTarget?.selectedOptions?.[0]
    const isBase = (opt?.dataset?.isBase === "1")
    const hasValidScenario = !!(opt?.value && !opt.value.includes("Seleccionar"))

    // + button: solo cuando existe escenario base en esta comuna
    if (this.hasAddScenarioBtnTarget) {
      this.addScenarioBtnTarget.hidden = !this._hasBaseScenario || inComparator
    }

    if (this.hasDeleteScenarioBtnTarget) {
      this.deleteScenarioBtnTarget.hidden = inComparator || isBase || !hasValidScenario
    }

    if (this.hasSaveScenarioBtnTarget) {
      const showSave = !inComparator && !isBase && hasValidScenario
      this.saveScenarioBtnTarget.hidden = !showSave
      if (showSave) this.saveScenarioBtnTarget.disabled = true // se habilita en refreshProjectsLists
    }

    if (this.hasLocatorBtnTarget) {
      this.locatorBtnTarget.disabled = isBase
    }

    // Oportunidad: visible cuando hay escenario válido O cuando estamos en comparador
    // (en comparador, syncComparatorGatingUI maneja el disabled del select)
    if (this.hasOpportunitySectionTarget) {
      this.opportunitySectionTarget.hidden = !hasValidScenario && !inComparator
    }

    if (this.hasOpportunitySelectTarget && hasValidScenario) {
      this.opportunitySelectTarget.disabled = false
    }

    if (this.hasLocateSectionTarget) {
      this.locateSectionTarget.hidden = !hasValidScenario || inComparator
    }
  }

  syncComparatorGatingUI() {
    const inComparator = (this._uiMode === "comparador")

    if (!this.hasOpportunitySelectTarget) return
    if (!this.hasLayerSectionTarget) return

    if (!inComparator) {
      // modo normal: oportunidad habilitada (si corresponde por tu UX)
      this.opportunitySelectTarget.disabled = false
      return
    }

    const hasA = !!this._scenarioAId
    const hasB = !!this._scenarioBId
    const ready = hasA && hasB

    // ✅ En comparador: deshabilitar hasta que estén ambos
    this.opportunitySelectTarget.disabled = !ready

    // ✅ Si no está listo, ocultar capas y resetear opportunity
    if (!ready) {
      this.layerSectionTarget.hidden = true
      this.opportunitySelectTarget.value = "Seleccionar oportunidad..." // o el placeholder real del <option>
      this.clearLayerButtonsUI()
      window.dispatchEvent(new CustomEvent("layer:cleared"))
    }
  }

  closeLocator() {
    if (!this.hasLocatorPanelTarget) return
    if (this.locatorPanelTarget.hidden) return // ya está cerrado

    // fuerza estado visual a "cerrado"
    this.locatorPanelTarget.hidden = true

    // restaura sidebar principal + re-enable
    this.restoreSidebarAfterClose()

    if (this.hasOpportunitySelectTarget) this.opportunitySelectTarget.disabled = false
    this.element.querySelectorAll(".sidebar__layer-btn").forEach(b => {
      b.disabled = false
      b.classList.remove("is-disabled")
    })

    // avisa al mapa que cierre locator (restauración del snapshot del mapa)
    window.dispatchEvent(new CustomEvent("locator:closed"))
  }

  resetVisualizationStateAfterScenarioChange() {
    // oportunidad
    if (this.hasOpportunitySelectTarget) {
      this.opportunitySelectTarget.disabled = false
      this.opportunitySelectTarget.value = "Seleccionar oportunidad..."
    }
    this._selectedOpportunityCode = null

    // capas
    window.dispatchEvent(new CustomEvent("layer:cleared"))
    this.clearLayerButtonsUI()
    if (this.hasLayerSectionTarget) this.layerSectionTarget.hidden = true

    // accesibilidad subopciones
    if (this.hasAccessibilityChoicesTarget) {
      this.accessibilityChoicesTarget.hidden = true
      this.accessibilityChoicesTarget
        .querySelectorAll(".sidebar__subchoice-btn")
        .forEach(b => b.classList.remove("is-active"))
    }

    // comparador
    this._scenarioAId = null
    this._scenarioBId = null
    this._compareMode = null

    // locator snapshot viejo
    this._locatorPrev = null
    this._locatorSidebarPrev = null
  }
}
