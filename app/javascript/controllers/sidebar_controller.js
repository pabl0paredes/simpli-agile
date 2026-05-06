import { Controller } from "@hotwired/stimulus"
import { csrfToken, getJSON, postJSON, deleteJSON, escapeHTML, trackEvent } from "controllers/sidebar/api"
import { createUIState } from "controllers/sidebar/ui_state"
import { createRegionsMunicipalities } from "controllers/sidebar/regions_municipalities"
import { createScenarios } from "controllers/sidebar/scenarios"
import { createOpportunitiesLayers } from "controllers/sidebar/opportunities_layers"
import { createLocator } from "controllers/sidebar/locator"
import { createSimulator } from "controllers/sidebar/simulator"
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
    "locatorBtnWrap",
    "simulatorBtnWrap",
    "regionSelectWrap",
    "regionBackBtn",
    "municipalitySelectWrap",
    "municipalityBackBtn",
    "opportunitySection",
    "addScenarioBtn",
    "unitsSection",
    "areaPerUnitSection",
    "noDataSection",
    "noAccessSection",
    "configPanel",
    "configBtn",
    "mapStyleBtn",
    "paletteBtn",
    "normativeSection",
    "normativeLayers",
    "normativeToggleBtn",
    "normativeBtnWrap",
    "visualizacionSection",
    "normativeLayerBtn",
    "simulatorPanel",
    "simulatorBtn",
    "simulateBtn",
    "simulationResultModal",
    "agentInputsContainer",
    "agentInput",
    "streetsOnTopBtn",
  ]

  connect() {
    this.collapsed = false
    this.ui = createUIState(this)
    this.regionsMunicipalities = createRegionsMunicipalities(this)
    this.scenarios = createScenarios(this)
    this.opportunitiesLayers = createOpportunitiesLayers(this)
    this.locator = createLocator(this)
    this.simulator = createSimulator(this)
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
  applyOpportunityCategory(category, opportunityCode) { return this.ui.applyOpportunityCategory(category, opportunityCode) }

  // Muestra oportunidad y carga escenario base (igual que usuario sin sesión)
  _loadGuestMunicipalityView(munCode) {
    // Mostrar secciones de herramientas con botones deshabilitados (sin acceso)
    this.syncScenarioActionsUI()

    // Override: show opportunity section regardless of scenario (guest view)
    if (this.hasOpportunitySelectTarget) this.opportunitySelectTarget.disabled = false
    if (this.hasOpportunitySectionTarget) this.opportunitySectionTarget.hidden = false

    fetch(`/municipalities/base_scenario?municipality_code=${encodeURIComponent(munCode)}`)
      .then(r => r.json())
      .then(data => {
        if (data.scenario_id) {
          this._selectedScenarioId = String(data.scenario_id)
          this._noBaseScenario = false
          window.dispatchEvent(new CustomEvent("scenario:selected", {
            detail: { scenario_id: String(data.scenario_id), status: "base" }
          }))
        } else {
          this._selectedScenarioId = null
          this._noBaseScenario = true
        }
      })
      .catch(() => {
        this._selectedScenarioId = null
        this._noBaseScenario = true
      })
  }

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
  selectAttractivityMode(e)  { return this.opportunitiesLayers.selectAttractivityMode(e) }

  loadLocatorOpportunitiesIntoSelect() { return this.locator.loadLocatorOpportunitiesIntoSelect() }
  locatorOpportunityChanged(e) { return this.locator.locatorOpportunityChanged(e) }
  toggleLocator() { return this.locator.toggleLocator() }
  startPickCell() { return this.locator.startPickCell() }
  cancelPickCell() { return this.locator.cancelPickCell() }

  // IMPORTANTE: listener usa arrow. Mantén arrow:
  onCellPicked = (e) => { return this.locator.onCellPicked(e) }

  addProject() { return this.locator.addProject() }

  loadAgentTypesIntoPanel() { return this.simulator.loadAgentTypesIntoPanel() }
  toggleSimulator() { return this.simulator.toggleSimulator() }
  runSimulation() { return this.simulator.runSimulation() }
  closeSimulationModal() {
    if (this.hasSimulationResultModalTarget) this.simulationResultModalTarget.hidden = true
  }

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

  toggleNormativeLayers() {
    if (!this.hasNormativeLayersTarget || !this.hasNormativeToggleBtnTarget) return
    const open = this.normativeLayersTarget.hidden
    this.normativeLayersTarget.hidden = !open
    this.normativeToggleBtnTarget.setAttribute("aria-expanded", open ? "true" : "false")
  }

  toggleConfigPanel() {
    if (!this.hasConfigPanelTarget) return
    this.configPanelTarget.hidden = !this.configPanelTarget.hidden
  }

  openHelp() {
    window.dispatchEvent(new CustomEvent("help:open"))
  }

  selectMapStyle(e) {
    const styleId = e.currentTarget.dataset.styleId
    if (!styleId) return
    this.mapStyleBtnTargets.forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.styleId === styleId)
    })
    window.dispatchEvent(new CustomEvent("map:style-selected", { detail: { styleId } }))
  }

  toggleStreetsOnTop() {
    const btn = this.streetsOnTopBtnTarget
    const enabled = btn.getAttribute("aria-pressed") !== "true"
    btn.setAttribute("aria-pressed", String(enabled))
    btn.classList.toggle("is-active", enabled)
    window.dispatchEvent(new CustomEvent("map:streets-on-top", { detail: { enabled } }))
  }

  selectPalette(e) {
    const palette = e.currentTarget.dataset.palette
    if (!palette) return
    this.paletteBtnTargets.forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.palette === palette)
    })
    window.dispatchEvent(new CustomEvent("map:palette-selected", { detail: { palette } }))
  }

  toggle() {
    this.collapsed = !this.collapsed

    // Clase en el root para estilos
    this.element.classList.toggle("is-sidebar-collapsed", this.collapsed)

    // Cambiar icono (‹ / ›)
    this.toggleTarget.textContent = this.collapsed ? "›" : "‹"

    // ✅ Si el localizador está abierto, NO lo cierres: solo muévelo
    if (this.hasLocatorPanelTarget && !this.locatorPanelTarget.hidden) {
      this.locatorPanelTarget.style.left = this.collapsed ? "0px" : "304px"
    }
    if (this.hasSimulatorPanelTarget && !this.simulatorPanelTarget.hidden) {
      this.simulatorPanelTarget.style.left = this.collapsed ? "0px" : "304px"
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
        b.style.opacity = ""
        b.style.cursor = ""
        if (p.ariaPressed !== null && p.ariaPressed !== undefined) {
          b.setAttribute("aria-pressed", p.ariaPressed)
        }
      })
    } else {
      // Fallback: al menos re-enable si no calza el número (por seguridad)
      btns.forEach((b) => {
        b.disabled = false
        b.classList.remove("is-disabled")
        b.style.opacity = ""
        b.style.cursor = ""
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

    // Oportunidad: visible cuando hay escenario válido O cuando estamos en comparador
    // (en comparador, syncComparatorGatingUI maneja el disabled del select)
    if (this.hasOpportunitySectionTarget) {
      this.opportunitySectionTarget.hidden = !hasValidScenario && !inComparator
    }

    if (this.hasOpportunitySelectTarget && hasValidScenario && !inComparator) {
      this.opportunitySelectTarget.disabled = false
    }

    const features       = this._features || []
    const hasLocator     = features.includes("locator")
    const hasSimulator   = features.includes("simulator")
    const hasNormative   = features.includes("normative")
    const hasMunicipality = !!this._selectedMunicipalityCode
    const NO_ACCESS      = "No tienes acceso a este feature"
    const NO_SCENARIO    = "Selecciona un escenario para usar esta herramienta"

    const setNavBtn = (wrapTarget, hasFeature, needsScenario) => {
      const cap = wrapTarget.charAt(0).toUpperCase() + wrapTarget.slice(1)
      if (!this[`has${cap}Target`]) return
      const wrap = this[`${wrapTarget}Target`]
      const btn  = wrap.querySelector("button")
      const tip  = wrap.querySelector(".sidebar__tooltip")
      if (!btn) return
      if (!hasFeature) {
        btn.disabled = true
        if (tip) tip.textContent = NO_ACCESS
      } else if (needsScenario && (!hasValidScenario || isBase)) {
        btn.disabled = true
        if (tip) tip.textContent = NO_SCENARIO
      } else {
        btn.disabled = false
      }
    }

    setNavBtn("locatorBtnWrap",   hasLocator,   true)
    setNavBtn("simulatorBtnWrap", hasSimulator, true)

    if (this.hasLocateSectionTarget) {
      this.locateSectionTarget.hidden = !hasMunicipality || inComparator
    }

    if (this.hasVisualizacionSectionTarget) {
      this.visualizacionSectionTarget.hidden = !hasMunicipality
    }
    if (this.hasNormativeSectionTarget) {
      this.normativeSectionTarget.hidden = inComparator || !this._municipalityHasNormative
    }
    if (this.hasNormativeLayerBtnTarget) {
      this.normativeLayerBtnTargets.forEach(btn => {
        btn.disabled = !hasNormative
        btn.title = !hasNormative ? NO_ACCESS : ""
      })
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
      if (this.hasAttractivitySectionTarget) this.attractivitySectionTarget.hidden = true
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

    if (this.hasAttractivitySectionTarget) this.attractivitySectionTarget.hidden = true

    // comparador
    this._scenarioAId = null
    this._scenarioBId = null
    this._compareMode = null

    // locator snapshot viejo
    this._locatorPrev = null
    this._locatorSidebarPrev = null
  }
}
