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
    "locatorPanel"
  ]

  connect() {
    this.collapsed = false
    this.loadRegionsIntoSelect()
    this.loadMunicipalitiesIntoSelect()
    this.loadOpportunitiesIntoSelect()

    window.addEventListener("region:clicked", this.onRegionClicked)
    window.addEventListener("municipality:clicked", this.onMunicipalityClicked)
    window.addEventListener("sidebar:toggle", this.onSidebarToggle)
  }

  disconnect() {
    window.removeEventListener("region:clicked", this.onRegionClicked)
    window.removeEventListener("municipality:clicked", this.onMunicipalityClicked)
    window.removeEventListener("sidebar:toggle", this.onSidebarToggle)
  }

  onSidebarToggle = () => {
    if (this.collapsed) {
      this.locatorPanelTarget.style.left = '0px'
    } else {
      this.locatorPanelTarget.style.left = '300px'
    }
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
        selector.appendChild(option)
      })
    })
    .catch(error => console.error("Error al cargar los usos:", error))
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
      window.dispatchEvent(new CustomEvent("municipality:cleared"))
      return
    }

    this.opportunitySelectTarget.disabled = false
    this.locateSectionTarget.hidden = false

    // Ocultar el hint de oportunidad seleccionada
    const opportunityHint = this.opportunitySelectTarget.closest('.sidebar__section').querySelector('.sidebar__hint')
    if (opportunityHint) opportunityHint.style.display = 'none'

    window.dispatchEvent(new CustomEvent("municipality:selected", {
      detail: { municipality_code: munCode }
    }))
  }

  opportunityChanged(e) {
    const opportunityCode = e.target.value
    if (!opportunityCode || opportunityCode.includes("Seleccionar")) return

    this.layerSectionTarget.hidden = false

    window.dispatchEvent(new CustomEvent("opportunity:selected", {
      detail: { opportunity_code: opportunityCode }
    }))
  }

  selectLayer(e) {
    const btn = e.currentTarget
    btn.classList.toggle("is-active")

    const allButtons = this.element.querySelectorAll(".sidebar__layer-btn");
    allButtons.forEach(btn => {
      if (btn !== e.target) {
        btn.classList.remove("is-active");
      }
    });

    const metric = e.target.dataset.metric  // "surface" o "units"

    window.dispatchEvent(new CustomEvent("layer:selected", {
      detail: { metric }
    }))
  }

  toggleLocator() {
    this.locatorPanelTarget.hidden = !this.locatorPanelTarget.hidden
    if (!this.locatorPanelTarget.hidden) {
      this.locatorPanelTarget.style.left = '300px'
    }
  }


  toggle() {
    this.collapsed = !this.collapsed

    // Clase en el root para estilos
    this.element.classList.toggle("is-sidebar-collapsed", this.collapsed)

    // Cambiar icono (‹ / ›)
    this.toggleTarget.textContent = this.collapsed ? "›" : "‹"

    // Importante: Mapbox necesita "resize" cuando cambia el layout
    // Disparamos un evento para que map_controller lo escuche (en el próximo paso si quieres)
    window.dispatchEvent(new Event("sidebar:toggle"))
  }
}
