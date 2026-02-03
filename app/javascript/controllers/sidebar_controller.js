import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "panel",
    "mapArea",
    "toggle",
    "regionSelect",
    "municipalitySelect",
    "useSelect",
    "layerSection",
    "locateSection"
  ]

  connect() {
    this.collapsed = false
    this.loadRegionsIntoSelect()
    this.loadMunicipalitiesIntoSelect()
    this.loadUsesIntoSelect()
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

  loadUsesIntoSelect() {
    fetch("/uses")
    .then(response => response.json())
    .then(data => {
      const selector = this.useSelectTarget
      selector.innerHTML = "<option>Seleccionar uso...</option>"

      data.forEach(use => {
        const option = document.createElement("option")
        option.value = use.use_code
        option.textContent = use.name
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
  }

  municipalityChanged(e) {
    const munCode = e.target.value
    if (!munCode || munCode.includes("Seleccionar")) return

    this.useSelectTarget.disabled = false
    this.locateSectionTarget.hidden = false

    // Ocultar el hint del uso de suelo seleccionado
    const useHint = this.useSelectTarget.closest('.sidebar__section').querySelector('.sidebar__hint')
    if (useHint) useHint.style.display = 'none'

    window.dispatchEvent(new CustomEvent("municipality:selected", {
      detail: { municipality_code: munCode }
    }))
  }

  useChanged(e) {
    const useCode = e.target.value
    if (!useCode || useCode.includes("Seleccionar")) return

    this.layerSectionTarget.hidden = false
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
