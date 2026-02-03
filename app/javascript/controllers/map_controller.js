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

    this.map = new mapboxgl.Map({
      container: this.element,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-70.6371, -33.4378],
      zoom: 4
    })

    // ✅ todo lo que agrega layers/sources, dentro de "load"
    this.map.on("load", () => {
      this.ensureMunicipalitiesLayer()
      this.bindMunicipalitiesHoverTooltip()
      this.loadRegionsIntoMap() // ya no recibe map, usa this.map
      window.addEventListener("region:selected", this.onRegionSelected)
      window.addEventListener("municipality:selected", this.onMunicipalitySelected)
    })

    this.loadRegionsIntoMap(map)
  }

  disconnect() {
    window.removeEventListener("region:selected", this.onRegionSelected)
    window.removeEventListener("municipality:selected", this.onMunicipalitySelected)
  }

  onRegionSelected = async (event) => {
    const regionCode = event.detail.region_code

    // 1) mover cámara
    const focus = await fetch(`/regions/focus?region_code=${encodeURIComponent(regionCode)}`).then(r => r.json())
    this.map.flyTo({
      center: focus.centroid, // [lng, lat]
      zoom: focus.zoom,
      essential: true
    })

    // 2) cargar comunas y pintar
    const fc = await fetch(`/municipalities?region_code=${encodeURIComponent(regionCode)}`).then(r => r.json())
    this.map.getSource("municipalities").setData(fc)

    this.setRegionsVisible(false)
    this.setMunicipalitiesVisible(true)
  }

  onMunicipalitySelected = async (event) => {
    const munCode = event.detail.municipality_code

    const focus = await fetch(`/municipalities/focus?municipality_code=${encodeURIComponent(munCode)}`).then(r => r.json())
    this.map.flyTo({
      center: focus.centroid,
      zoom: focus.zoom,
      essential: true
    })

    this.setRegionsVisible(false)
    this.setMunicipalitiesVisible(false)

    // Falta cargar las celdas

  }

  ensureMunicipalitiesLayer() {
    // source vacío inicial
    this.map.addSource("municipalities", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    })

    // fill
    this.map.addLayer({
      id: "municipalities-fill",
      type: "fill",
      source: "municipalities",
      paint: {
        "fill-color": "#88B4FF",
        "fill-opacity": 0.25
      }
    })

    // borde
    this.map.addLayer({
      id: "municipalities-outline",
      type: "line",
      source: "municipalities",
      paint: {
        "line-color": "#4A90E2",
        "line-width": 2
      }
    })

    if (!this.map.getLayer("municipalities-hover")) {
    this.map.addLayer({
      id: "municipalities-hover",
      type: "fill",
      source: "municipalities",
      paint: {
        "fill-color": "#88B4FF",
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.7,
          0
        ]
      }
    })
  }

    this.setMunicipalitiesVisible(false)
  }

  loadRegionsIntoMap() {
    fetch("/regions")
      .then(r => r.json())
      .then((fc) => {
        if (!Array.isArray(fc.features)) {
          console.error("GeoJSON inválido en /regions", fc)
          return
        }

        // 1) source único
        if (this.map.getSource("regions")) {
          this.map.getSource("regions").setData(fc)
        } else {
          this.map.addSource("regions", { type: "geojson", data: fc })
        }

        // 2) layers únicos (fill + outline)
        if (!this.map.getLayer("regions-fill")) {
          this.map.addLayer({
            id: "regions-fill",
            type: "fill",
            source: "regions",
            paint: {
              "fill-color": "#88B4FF",
              "fill-opacity": 0.5
            }
          })
        }

        if (!this.map.getLayer("regions-outline")) {
          this.map.addLayer({
            id: "regions-outline",
            type: "line",
            source: "regions",
            paint: {
              "line-color": "#4A90E2",
              "line-width": 2
            }
          })
        }

        // 3) hover highlight con feature-state (sin duplicar layers)
        if (!this.map.getLayer("regions-hover")) {
          this.map.addLayer({
            id: "regions-hover",
            type: "fill",
            source: "regions",
            paint: {
              "fill-color": "#88B4FF",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.7,
                0
              ]
            }
          })
        }

        this.bindRegionsHoverTooltip() // ✅ listeners 1 vez
      })
      .catch(err => console.error("Error cargando regiones:", err))
  }

  bindRegionsHoverTooltip() {
    // evitar duplicar listeners si recargas
    if (this._regionsHoverBound) return
    this._regionsHoverBound = true

    let hoveredId = null
    let tooltipDiv = null

    const ensureTooltip = () => {
      if (tooltipDiv) return tooltipDiv
      tooltipDiv = document.createElement("div")
      tooltipDiv.className = "region-tooltip"
      tooltipDiv.style.position = "absolute"
      tooltipDiv.style.backgroundColor = "rgba(17, 24, 39, 0.95)" // oscuro elegante
      tooltipDiv.style.color = "#fff"
      tooltipDiv.style.padding = "10px 14px"
      tooltipDiv.style.borderRadius = "12px"
      tooltipDiv.style.fontWeight = "700"
      tooltipDiv.style.fontSize = "18px"
      tooltipDiv.style.pointerEvents = "none"
      tooltipDiv.style.whiteSpace = "nowrap"
      tooltipDiv.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)"
      this.map.getContainer().appendChild(tooltipDiv)
      return tooltipDiv
    }

    const moveTooltip = (lngLat) => {
      if (!tooltipDiv) return
      const p = this.map.project(lngLat)
      tooltipDiv.style.left = `${p.x + 12}px`
      tooltipDiv.style.top = `${p.y - 56}px`
    }

    this.map.on("mouseenter", "regions-fill", () => {
      this.map.getCanvas().style.cursor = "pointer"
    })

    this.map.on("mousemove", "regions-fill", (e) => {
      const f = e.features && e.features[0]
      if (!f) return

      // tooltip sticky
      const el = ensureTooltip()
      el.textContent = f.properties?.name ?? ""
      moveTooltip(e.lngLat)

      // hover state
      const id = f.properties?.region_code ?? f.id
      if (id == null) return

      if (hoveredId !== null && hoveredId !== id) {
        this.map.setFeatureState({ source: "regions", id: hoveredId }, { hover: false })
      }
      hoveredId = id

      // IMPORTANTE: source necesita "id" por feature
      // Si tus features no traen id, abajo te digo cómo setearlo.
      this.map.setFeatureState({ source: "regions", id: hoveredId }, { hover: true })
    })

    this.map.on("mouseleave", "regions-fill", () => {
      this.map.getCanvas().style.cursor = ""
      if (tooltipDiv) {
        tooltipDiv.remove()
        tooltipDiv = null
      }
      if (hoveredId !== null) {
        this.map.setFeatureState({ source: "regions", id: hoveredId }, { hover: false })
        hoveredId = null
      }
    })
  }

  bindMunicipalitiesHoverTooltip() {
    if (this._muniHoverBound) return
    this._muniHoverBound = true

    let hoveredId = null
    let tooltipDiv = null

    const ensureTooltip = () => {
      if (tooltipDiv) return tooltipDiv
      tooltipDiv = document.createElement("div")

      // si quieres misma clase que regiones:
      tooltipDiv.className = "municipality-tooltip"

      // mismos estilos “modernos”
      tooltipDiv.style.position = "absolute"
      tooltipDiv.style.backgroundColor = "rgba(17, 24, 39, 0.95)"
      tooltipDiv.style.color = "#fff"
      tooltipDiv.style.padding = "10px 14px"
      tooltipDiv.style.borderRadius = "12px"
      tooltipDiv.style.fontWeight = "700"
      tooltipDiv.style.fontSize = "18px"
      tooltipDiv.style.pointerEvents = "none"
      tooltipDiv.style.whiteSpace = "nowrap"
      tooltipDiv.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)"

      this.map.getContainer().appendChild(tooltipDiv)
      return tooltipDiv
    }

    const moveTooltip = (lngLat) => {
      if (!tooltipDiv) return
      const p = this.map.project(lngLat)
      tooltipDiv.style.left = `${p.x + 12}px`
      tooltipDiv.style.top = `${p.y - 56}px`
    }

    this.map.on("mouseenter", "municipalities-fill", () => {
      this.map.getCanvas().style.cursor = "pointer"
    })

    this.map.on("mousemove", "municipalities-fill", (e) => {
      const f = e.features && e.features[0]
      if (!f) return

      // tooltip sticky
      const el = ensureTooltip()
      el.textContent = f.properties?.name ?? ""
      moveTooltip(e.lngLat)

      // hover state — acá NO adivinamos: usamos feature.id
      const id = f.id
      if (id == null) return

      if (hoveredId !== null && hoveredId !== id) {
        this.map.setFeatureState({ source: "municipalities", id: hoveredId }, { hover: false })
      }
      hoveredId = id
      this.map.setFeatureState({ source: "municipalities", id: hoveredId }, { hover: true })
    })

    this.map.on("mouseleave", "municipalities-fill", () => {
      this.map.getCanvas().style.cursor = ""
      if (tooltipDiv) {
        tooltipDiv.remove()
        tooltipDiv = null
      }
      if (hoveredId !== null) {
        this.map.setFeatureState({ source: "municipalities", id: hoveredId }, { hover: false })
        hoveredId = null
      }
    })
  }


  setRegionsVisible(visible) {
    const v = visible ? "visible" : "none"
    ;["regions-fill", "regions-outline", "regions-hover"].forEach((id) => {
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", v)
    })
  }

  setMunicipalitiesVisible(visible) {
    const v = visible ? "visible" : "none"
    ;["municipalities-fill", "municipalities-outline"].forEach((id) => {
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", v)
    })
  }


}
