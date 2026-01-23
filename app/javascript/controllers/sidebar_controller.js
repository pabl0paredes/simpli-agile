import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["panel", "mapArea", "toggle", "regionSelect"]

  connect() {
    this.collapsed = false
    this.loadRegionsIntoSelect()
  }

  loadRegionsIntoSelect() {
    fetch('/region/names')
    .then(response => response.json())
    .then(data => {
      const selector = this.regionSelectTarget  // Accedemos al select del HTML

      // Limpiar las opciones actuales (si existen)
      selector.innerHTML = "<option>Seleccionar región...</option>"

      // Agregar las opciones de las regiones al desplegable
      data.features.forEach(region => {
        const option = document.createElement("option")
        option.value = region.id  // Usamos el `id` para el valor de la opción
        option.textContent = region.properties.name  // Mostramos el `name` de la región
        selector.appendChild(option)
      })
    })
    .catch(error => console.error("Error al cargar las regiones:", error))
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
