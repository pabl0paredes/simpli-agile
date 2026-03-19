export class MapHover {
  constructor(controller) {
    this.controller = controller
    this.map = controller.map
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
      const id = f.id ?? f.properties?.municipality_code
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

  bindCellsHoverTooltip() {
    if (this._cellsHoverBound) return
    this._cellsHoverBound = true

    let hoveredId = null
    let tooltipDiv = null

    const ensureTooltip = () => {
      if (tooltipDiv) return tooltipDiv
      tooltipDiv = document.createElement("div")
      tooltipDiv.className = "cell-tooltip"
      tooltipDiv.style.position = "absolute"
      tooltipDiv.style.backgroundColor = "rgba(17, 24, 39, 0.95)"
      tooltipDiv.style.color = "#fff"
      tooltipDiv.style.padding = "10px 14px"
      tooltipDiv.style.borderRadius = "12px"
      tooltipDiv.style.fontWeight = "700"
      tooltipDiv.style.fontSize = "14px"
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

    const clearHover = () => {
      this.map.getCanvas().style.cursor = ""
      if (tooltipDiv) {
        tooltipDiv.remove()
        tooltipDiv = null
      }
      if (hoveredId !== null) {
        this.map.setFeatureState({ source: "cells", id: hoveredId }, { hover: false })
        hoveredId = null
      }
    }

    this.map.on("mouseenter", "cells-fill", () => {
      this.map.getCanvas().style.cursor = "pointer"
    })

    this.map.on("mousemove", "cells-fill", (e) => {
      const f = e.features && e.features[0]
      if (!f) return

      // id estable gracias a promoteId:h3
      const id = f.properties?.h3 || f.id
      if (!id) return

      // feature-state hover highlight
      if (hoveredId !== null && hoveredId !== id) {
        this.map.setFeatureState({ source: "cells", id: hoveredId }, { hover: false })
      }
      hoveredId = id
      this.map.setFeatureState({ source: "cells", id: hoveredId }, { hover: true })

      // tooltip
      const el = ensureTooltip()

      const showId = f.properties?.show_id

      // ✅ Pick cell mode: mostrar CTA
      if (this.controller?._pickCellMode) {
        el.textContent = (showId != null)
          ? `Celda ${showId} (click para seleccionar)`
          : `Celda (click para seleccionar)`
        moveTooltip(e.lngLat)
        return
      }

      // ✅ Locator abierto: siempre mostrar "Celda X" sin CTA
      if (this.controller?._inLocator) {
        el.textContent = (showId != null) ? `Celda ${showId}` : "Celda"
        moveTooltip(e.lngLat)
        return
      }

      // ✅ caso normal: mostrar valor de la capa
      const label = this.currentCellsHoverLabel()

      const layerType = this.controller?._selectedLayerType
      const klass = Number(f.properties?.class ?? 0)
      const rawValue = f.properties?.value ?? 0

      let formatted

      if (layerType === "accessibility") {
        formatted = this.controller.accessibilityLabelForClass
          ? this.controller.accessibilityLabelForClass(klass)
          : (klass ? String(klass) : "-")
      } else {
        formatted = Number(rawValue).toLocaleString("es-CL")
      }

      // ✅ Proyectos localizados en esta celda
      const hasProjects = f.properties?.has_projects === true
      let projectNames = []
      if (hasProjects) {
        try {
          const raw = f.properties?.project_names
          projectNames = typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : [])
        } catch (_) {}
      }

      if (projectNames.length > 0) {
        el.style.whiteSpace = "pre-line"
        el.style.maxWidth = "240px"
        const nameList = projectNames.map(n => `  • ${n}`).join("\n")
        el.textContent = `${label}: ${formatted}\n📍 Proyectos:\n${nameList}`
      } else {
        el.style.whiteSpace = "nowrap"
        el.style.maxWidth = ""
        el.textContent = `${label}: ${formatted}`
      }

      moveTooltip(e.lngLat)

    })

    this.map.on("mouseleave", "cells-fill", clearHover)

    // por si limpias source/capas
    this._clearCellsHover = clearHover
  }

  currentCellsHoverLabel() {
    // Decide etiqueta según lo activo
    if (this.controller._selectedLayerType === "accessibility") {
      const mode = this.controller._selectedAccessibilityMode || ""
      return mode === "walk" ? "Accesibilidad (caminata)" : "Accesibilidad (auto)"
    }
    if (this.controller._selectedMetric === "surface") return "Superficie"
    if (this.controller._selectedMetric === "units") return "Unidades"
    return "Valor"
  }

  showCompareTooltip(map, lngLat, text) {
    if (!map._compareTooltip) {
      const el = document.createElement("div")
      el.className = "cell-tooltip"
      el.style.position = "absolute"
      el.style.background = "rgba(17,24,39,0.95)"
      el.style.color = "#fff"
      el.style.padding = "8px 12px"
      el.style.borderRadius = "10px"
      el.style.fontWeight = "600"
      el.style.pointerEvents = "none"
      el.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)"
      map.getContainer().appendChild(el)
      map._compareTooltip = el
    }

    const p = map.project(lngLat)

    map._compareTooltip.textContent = text
    map._compareTooltip.style.left = `${p.x + 10}px`
    map._compareTooltip.style.top = `${p.y - 40}px`
  }
}
