import { dataFetch } from "controllers/sidebar/api"

export class MapAdminLayers {
  constructor(controller) {
    this.c = controller
  }

  // ensureMunicipalitiesLayer() {
  //   const map = this.c.map

  //   // source vacío inicial
  //   map.addSource("municipalities", {
  //     type: "geojson",
  //     data: { type: "FeatureCollection", features: [] },
  //     promoteId: "municipality_code"
  //   })

  //   // fill
  //   map.addLayer({
  //     id: "municipalities-fill",
  //     type: "fill",
  //     source: "municipalities",
  //     paint: {
  //       "fill-color": "#2bf89a",
  //       "fill-opacity": 0.25
  //     }
  //   })

  //   // borde
  //   map.addLayer({
  //     id: "municipalities-outline",
  //     type: "line",
  //     source: "municipalities",
  //     paint: {
  //       "line-color": "#1cb66e",
  //       "line-width": 2
  //     }
  //   })

  //   if (!map.getLayer("municipalities-hover")) {
  //     map.addLayer({
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

  //   if (!map.getSource("selected-municipality")) {
  //     map.addSource("selected-municipality", {
  //       type: "geojson",
  //       data: { type: "FeatureCollection", features: [] }
  //     })
  //   }

  //   if (!map.getLayer("selected-municipality-outline")) {
  //     map.addLayer({
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

  ensureMunicipalitiesLayer(map = this.c.map) {
    if (!map.getSource("municipalities")) {
      map.addSource("municipalities", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        promoteId: "municipality_code"
      })
    }

    if (!map.getLayer("municipalities-fill")) {
      map.addLayer({
        id: "municipalities-fill",
        type: "fill",
        source: "municipalities",
        paint: {
          "fill-color": "#2bf89a",
          "fill-opacity": 0.25
        }
      })
    }

    if (!map.getLayer("municipalities-outline")) {
      map.addLayer({
        id: "municipalities-outline",
        type: "line",
        source: "municipalities",
        paint: {
          "line-color": "#1cb66e",
          "line-width": 2
        }
      })
    }

    if (!map.getLayer("municipalities-hover")) {
      map.addLayer({
        id: "municipalities-hover",
        type: "fill",
        source: "municipalities",
        paint: {
          "fill-color": "#2bf89a",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.3,
            0
          ]
        }
      })
    }

    ;["municipalities-fill", "municipalities-outline", "municipalities-hover"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none")
    })

    if (!map.getSource("selected-municipality")) {
      map.addSource("selected-municipality", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      })
    }

    if (!map.getLayer("selected-municipality-outline")) {
      map.addLayer({
        id: "selected-municipality-outline",
        type: "line",
        source: "selected-municipality",
        paint: {
          "line-color": "#111827",
          "line-width": 2.5,
          "line-opacity": 0.9,
          "line-dasharray": [2, 2]
        }
      })
    }

    if (!map.getSource("study-area")) {
      map.addSource("study-area", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      })
    }

    if (!map.getLayer("study-area-glow")) {
      map.addLayer({
        id: "study-area-glow",
        type: "line",
        source: "study-area",
        paint: {
          "line-color": "#233141",
          "line-width": 10,
          "line-opacity": 0.12,
          "line-blur": 6
        }
      })
    }

    if (!map.getLayer("study-area-line")) {
      map.addLayer({
        id: "study-area-line",
        type: "line",
        source: "study-area",
        paint: {
          "line-color": "#233141",
          "line-width": 1.5,
          "line-opacity": 0.95
        }
      })
    }
  }

  loadRegionsIntoMap() {
    fetch("/regions")
      .then(r => r.json())
      .then((fc) => {
        const map = this.c.map

        if (!Array.isArray(fc.features)) {
          console.error("GeoJSON inválido en /regions", fc)
          return
        }

        if (map.getSource("regions")) {
          map.getSource("regions").setData(fc)
        } else {
          map.addSource("regions", { type: "geojson", data: fc, promoteId: "region_code"})
        }

        if (!map.getLayer("regions-fill")) {
          map.addLayer({
            id: "regions-fill",
            type: "fill",
            source: "regions",
            paint: {
              "fill-color": "#2bf89a",
              "fill-opacity": 0.5
            }
          })
        }

        if (!map.getLayer("regions-outline")) {
          map.addLayer({
            id: "regions-outline",
            type: "line",
            source: "regions",
            paint: {
              "line-color": "#1cb66e",
              "line-width": 2
            }
          })
        }

        if (!map.getLayer("regions-hover")) {
          map.addLayer({
            id: "regions-hover",
            type: "fill",
            source: "regions",
            paint: {
              "fill-color": "#2bf89a",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.3,
                0
              ]
            }
          })
        }

        this.c.hover.bindRegionsHoverTooltip()

        // If the page loaded with a default municipality (server-rendered or already selected),
        // hide regions immediately so they don't flash before municipalityChanged runs.
        const hasDefaultMunicipality = !!document.querySelector("[data-sidebar-default-municipality-value]")
          ?.dataset?.sidebarDefaultMunicipalityValue
        if (this.c._selectedMunicipalityCode || hasDefaultMunicipality) {
          this.setRegionsVisible(false)
        }
      })
      .catch(err => console.error("Error cargando regiones:", err))
  }

  bindRegionsClick() {
    if (this.c._regionsClickBound) return
    this.c._regionsClickBound = true

    this.c.map.on("click", "regions-fill", (e) => {
      const f = e.features && e.features[0]
      if (!f) return

      const regionCode = f.properties?.region_code
      if (!regionCode) return

      window.dispatchEvent(new CustomEvent("region:clicked", {
        detail: { region_code: regionCode }
      }))
    })
  }

  bindMunicipalitiesClick() {
    if (this.c._municipalitiesClickBound) return
    this.c._municipalitiesClickBound = true

    this.c.map.on("click", "municipalities-fill", (e) => {
      const f = e.features && e.features[0]
      if (!f) return

      const munCode = f.properties?.municipality_code
      if (!munCode) return

      window.dispatchEvent(new CustomEvent("municipality:clicked", {
        detail: { municipality_code: munCode }
      }))
    })
  }

  setRegionsVisible(visible) {
    const v = visible ? "visible" : "none"
    ;["regions-fill", "regions-outline", "regions-hover"].forEach((id) => {
      if (this.c.map.getLayer(id)) this.c.map.setLayoutProperty(id, "visibility", v)
    })
  }

  setMunicipalitiesVisible(visible) {
    const v = visible ? "visible" : "none"
    ;["municipalities-fill", "municipalities-outline", "municipalities-hover"].forEach((id) => {
      if (this.c.map.getLayer(id)) this.c.map.setLayoutProperty(id, "visibility", v)
    })
  }

  onRegionSelected = async (event) => {
    const regionCode = event.detail.region_code
    this.c._selectedRegionCode = regionCode

    try {
      const focus = await fetch(`/regions/focus?region_code=${encodeURIComponent(regionCode)}`).then(r => r.json())
      this.c.map.flyTo({
        center: focus.centroid,
        zoom: focus.zoom,
        essential: true
      })

      const fc = await fetch(`/municipalities?region_code=${encodeURIComponent(regionCode)}`).then(r => r.json())
      this.c.map.getSource("municipalities").setData(fc)

      this.setRegionsVisible(false)
      this.setMunicipalitiesVisible(true)
    } finally {
      window.dispatchEvent(new CustomEvent("region:ready"))
    }
  }

  onMunicipalitySelected = async (event) => {
    const munCode = event.detail.municipality_code
    this.c._selectedMunicipalityCode = munCode

    const focus = await dataFetch(`/municipalities/focus?municipality_code=${encodeURIComponent(munCode)}`).then(r => r.json())

    const bbox = this._bboxFromGeoJSON(focus.geometry)
    if (bbox) {
      this.c.map.fitBounds(bbox, { padding: 40, essential: true })
    } else {
      this.c.map.flyTo({ center: focus.centroid, zoom: focus.zoom, essential: true })
    }

    this.setRegionsVisible(false)
    this.setMunicipalitiesVisible(false)

    this.c.map.getSource("selected-municipality").setData(focus.geometry)

    this._loadStudyArea(this.c.map, focus.study_area)

    // If municipality was selected directly (no region chosen first), resolve the region
    // context so back navigation can restore the region state correctly.
    if (!this.c._selectedRegionCode && focus.region_code) {
      this.c._selectedRegionCode = focus.region_code

      // Notify the sidebar immediately so _resolvedRegionCode is set before the user
      // can click back — don't wait for the municipalities GeoJSON fetch below.
      window.dispatchEvent(new CustomEvent("region:context_resolved", {
        detail: { region_code: focus.region_code }
      }))

      // Preload municipalities GeoJSON for this region (hidden) so they appear on back.
      const fc = await fetch(`/municipalities?region_code=${encodeURIComponent(focus.region_code)}`).then(r => r.json())
      this.c.map.getSource("municipalities").setData(fc)
    }
  }

  _bboxFromGeoJSON(geojson) {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
    const processCoords = (coords) => {
      if (typeof coords[0] === "number") {
        if (coords[0] < minLng) minLng = coords[0]
        if (coords[0] > maxLng) maxLng = coords[0]
        if (coords[1] < minLat) minLat = coords[1]
        if (coords[1] > maxLat) maxLat = coords[1]
      } else {
        coords.forEach(processCoords)
      }
    }
    geojson.features?.forEach(f => { if (f.geometry?.coordinates) processCoords(f.geometry.coordinates) })
    return minLng === Infinity ? null : [[minLng, minLat], [maxLng, maxLat]]
  }

  onMunicipalityCleared = () => {
    const src = this.c.map.getSource("selected-municipality")
    if (!src) return
    src.setData({ type: "FeatureCollection", features: [] })
    this._clearStudyArea(this.c.map)
  }

  onMunicipalityBack = async () => {
    const src = this.c.map.getSource("selected-municipality")
    if (src) src.setData({ type: "FeatureCollection", features: [] })
    this._clearStudyArea(this.c.map)
    this.setMunicipalitiesVisible(true)

    const regionCode = this.c._selectedRegionCode
    if (regionCode) {
      const focus = await fetch(`/regions/focus?region_code=${encodeURIComponent(regionCode)}`).then(r => r.json())
      this.c.map.flyTo({ center: focus.centroid, zoom: focus.zoom, essential: true })
    }
  }

  onRegionCleared = () => {
    this.c._selectedRegionCode = null
    this.c._selectedMunicipalityCode = null

    const src = this.c.map.getSource("selected-municipality")
    if (src) src.setData({ type: "FeatureCollection", features: [] })
    this._clearStudyArea(this.c.map)

    this.setMunicipalitiesVisible(false)
    this.setRegionsVisible(true)

    this.c.map.flyTo({ center: [-70.6371, -33.4378], zoom: 4, essential: true })
  }

  async loadSelectedMunicipalityOutlineOn(map, munCode = this.c._selectedMunicipalityCode) {
    if (!map || !munCode) return

    this.ensureMunicipalitiesLayer(map)

    const focus = await dataFetch(
      `/municipalities/focus?municipality_code=${encodeURIComponent(munCode)}`
    ).then(r => r.json())

    const src = map.getSource("selected-municipality")
    if (src) src.setData(focus.geometry)

    this._loadStudyArea(map, focus.study_area)
  }

  _loadStudyArea(map, feature) {
    const src = map.getSource("study-area")
    if (!src) return

    if (feature) {
      src.setData({ type: "FeatureCollection", features: [feature] })
      ;["selected-municipality-outline", "study-area-glow", "study-area-line"].forEach(id => {
        if (map.getLayer(id)) map.moveLayer(id)
      })
      this.c._hasStudyArea = true
    } else {
      src.setData({ type: "FeatureCollection", features: [] })
      this.c._hasStudyArea = false
    }
  }

  _clearStudyArea(map) {
    const src = map?.getSource("study-area")
    if (src) src.setData({ type: "FeatureCollection", features: [] })
    this.c._hasStudyArea = false
  }
}
