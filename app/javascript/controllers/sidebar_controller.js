import { Controller } from "@hotwired/stimulus"
import { csrfToken, getJSON, postJSON, deleteJSON, escapeHTML } from "./sidebar/api"
import { createUIState } from "./sidebar/ui_state"
import { createRegionsMunicipalities } from "./sidebar/regions_municipalities"
import { createScenarios } from "./sidebar/scenarios"
import { createOpportunitiesLayers } from "./sidebar/opportunities_layers"
import { createLocator } from "./sidebar/locator"
import { createProjectLists } from "./sidebar/project_lists"
import { createPublishDelete } from "./sidebar/publish_delete"
import { createComparator } from "./sidebar/comparator"

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
    "modeToggle",
    "regionSection",
    "municipalitySection",
    "comparatorSection",
    "comparatorDivider",
    "compareModeSection",
    "scenarioASelect",
    "scenarioBSelect",
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
    this._api = { csrfToken, getJSON, postJSON, deleteJSON, escapeHTML }

    window.addEventListener("region:clicked", this.onRegionClicked)
    window.addEventListener("municipality:clicked", this.onMunicipalityClicked)
    window.addEventListener("sidebar:toggle", this.onSidebarToggle)
    window.addEventListener("cell:picked", this.onCellPicked)
    window.addEventListener("scenario:selected", this.onScenarioSelected)
    window.addEventListener("ui:mode_changed", this.onUIModeChanged)
  }

  disconnect() {
    window.removeEventListener("region:clicked", this.onRegionClicked)
    window.removeEventListener("municipality:clicked", this.onMunicipalityClicked)
    window.removeEventListener("sidebar:toggle", this.onSidebarToggle)
    window.removeEventListener("cell:picked", this.onCellPicked)
    window.removeEventListener("scenario:selected", this.onScenarioSelected)
    window.removeEventListener("ui:mode_changed", this.onUIModeChanged)
  }

  loadRegionsIntoSelect() { return this.regionsMunicipalities.loadRegionsIntoSelect() }
  onRegionClicked = (e) => { return this.regionsMunicipalities.onRegionClicked(e) }

  loadMunicipalitiesIntoSelect(regionCode = null) {
    return this.regionsMunicipalities.loadMunicipalitiesIntoSelect(regionCode)
  }
  onMunicipalityClicked = (e) => { return this.regionsMunicipalities.onMunicipalityClicked(e) }

  regionChanged(e) { return this.regionsMunicipalities.regionChanged(e) }
  municipalityChanged(e) { return this.regionsMunicipalities.municipalityChanged(e) }


  resetAfterMunicipalityChange() { return this.ui.resetAfterMunicipalityChange() }
  clearLayerButtonsUI() { return this.ui.clearLayerButtonsUI() }
  applyOpportunityCategory(category) { return this.ui.applyOpportunityCategory(category) }

  openPublishModal() { return this.ui.openPublishModal() }
  closePublishModal() { return this.ui.closePublishModal() }

  loadScenariosIntoSelect(munCode) { return this.scenarios.loadScenariosIntoSelect(munCode) }
  scenarioChanged(e) { return this.scenarios.scenarioChanged(e) }

  // IMPORTANTE: tu listener usa this.onScenarioSelected (arrow). Mantén arrow.
  onScenarioSelected = (e) => { return this.scenarios.onScenarioSelected(e) }

  loadOpportunitiesIntoSelect() { return this.opportunitiesLayers.loadOpportunitiesIntoSelect() }
  opportunityChanged(e) { return this.opportunitiesLayers.opportunityChanged(e) }
  selectLayer(e) { return this.opportunitiesLayers.selectLayer(e) }
  selectAccessibilityMode(e) { return this.opportunitiesLayers.selectAccessibilityMode(e) }

  loadLocatorOpportunitiesIntoSelect() { return this.locator.loadLocatorOpportunitiesIntoSelect() }
  toggleLocator() { return this.locator.toggleLocator() }
  startPickCell() { return this.locator.startPickCell() }
  cancelPickCell() { return this.locator.cancelPickCell() }

  // IMPORTANTE: listener usa arrow. Mantén arrow:
  onCellPicked = (e) => { return this.locator.onCellPicked(e) }

  addProject() { return this.locator.addProject() }

  refreshProjectsLists() { return this.projectLists.refreshProjectsLists() }

  confirmPublishScenario() { return this.publishDelete.confirmPublishScenario() }
  deleteScenario() { return this.publishDelete.deleteScenario() }

  onUIModeChanged = (e) => { return this.comparator.onUIModeChanged(e) }

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
}
