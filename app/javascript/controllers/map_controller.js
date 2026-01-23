import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { token: String }

  connect() {
    console.log("✅ map_controller connect()", this.tokenValue?.slice(0, 8))

    const mapboxgl = window.mapboxgl
    if (!mapboxgl) {
      console.error("mapboxgl no está disponible (script CDN no cargó)")
      return
    }

    if (!this.tokenValue) {
      console.warn("MAPBOX_TOKEN no está definido en ENV")
      return
    }

    mapboxgl.accessToken = this.tokenValue

    new mapboxgl.Map({
      container: this.element,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-70.6371, -33.4378],
      zoom: 10
    })
  }
}
