export class MapCellsLayer {
  constructor(controller) {
    this.c = controller
  }

  setVisible = (visible, map = this.c.map) => {
    if (!map) return

    const visibility = visible ? "visible" : "none"

    if (map.getLayer("cells-fill")) {
      map.setLayoutProperty("cells-fill", "visibility", visibility)
    }

    if (map.getLayer("cells-outline")) {
      map.setLayoutProperty("cells-outline", "visibility", visibility)
    }

    if (map.getLayer("cells-project-outline")) {
      map.setLayoutProperty("cells-project-outline", "visibility", visibility)
    }
  }

  ensure = (map = this.c.map) => {
    if (!map) return

    if (!map.getSource("cells")) {
      map.addSource("cells", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        promoteId: "h3"
      })
    }

    if (!map.getLayer("cells-fill")) {
      map.addLayer({
        id: "cells-fill",
        type: "fill",
        source: "cells",
        paint: {
          "fill-color": [
            "match",
            ["get", "class"],
            1, "#dbeafe",
            2, "#93c5fd",
            3, "#3b82f6",
            4, "#1d4ed8",
            5, "#0b3aa4",
            "#f3f4f6"
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "class"], 0],
            0,
            0.75
          ]
        }
      })
    }

    const focusClass = this.c._legendFocusClass

    if (map.getLayer("cells-fill")) {
      const expr = (focusClass != null)
        ? this.c.legend?.focusedFillOpacityExpr?.(focusClass)
        : this.c.legend?.baseFillOpacityExpr?.()

      if (expr) {
        map.setPaintProperty("cells-fill", "fill-opacity", expr)
      }
    }

    if (!map.getLayer("cells-outline")) {
      map.addLayer({
        id: "cells-outline",
        type: "line",
        source: "cells",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#2563eb",
            "rgba(17,24,39,0.10)"
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3,
            1
          ]
        }
      })
    }

    if (!map.getLayer("cells-hover")) {
      map.addLayer({
        id: "cells-hover",
        type: "fill",
        source: "cells",
        paint: {
          "fill-color": "#111827",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.15,
            0
          ]
        }
      })
    }

    if (!map.getLayer("cells-project-outline")) {
      map.addLayer({
        id: "cells-project-outline",
        type: "line",
        source: "cells",
        paint: {
          "line-color": "#2563eb",
          "line-width": 2.5,
          "line-opacity": 0.9
        },
        filter: ["==", ["get", "has_projects"], true]
      })
    }

    // Importante: el hover binding vive en MapHover, no acá,
    // pero acá es el lugar correcto para asegurarlo después de crear layers.
    this.c.hover?.bindCellsHoverTooltip?.()
  }

  ensureLocatorOverlays = () => {
    const map = this.c.map
    if (!map) return false

    try {
      if (!map.hasImage("hatch-60")) {
        map.addImage("hatch-60", this.createHatchPattern60())
      }
    } catch (err) {
      console.error("❌ hatch-60 addImage failed:", err)
      return false
    }

    if (!map.getLayer("cells-parent-fill")) {
      map.addLayer({
        id: "cells-parent-fill",
        type: "fill",
        source: "cells",
        paint: { "fill-opacity": 0.70, "fill-color": "#ef4444" },
        filter: ["==", ["get", "has_parent_projects"], true]
      })
      map.setLayoutProperty("cells-parent-fill", "visibility", "none")
    }

    if (!map.getLayer("cells-draft-hatch")) {
      map.addLayer({
        id: "cells-draft-hatch",
        type: "fill",
        source: "cells",
        paint: { "fill-opacity": 1, "fill-pattern": "hatch-60" },
        filter: ["==", ["get", "has_draft_projects"], true]
      })
      map.setLayoutProperty("cells-draft-hatch", "visibility", "none")
    }

    // al final, antes del return true
    if (map.getLayer("cells-parent-fill") && map.getLayer("cells-draft-hatch")) {
      // parent abajo, hatch arriba
      map.moveLayer("cells-parent-fill")
      map.moveLayer("cells-draft-hatch")
    }

    return true
  }

  // --- privado ---
  createHatchPattern60() {
    const size = 32
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")

    ctx.clearRect(0, 0, size, size)
    ctx.translate(size / 2, size / 2)
    ctx.rotate((60 * Math.PI) / 180)
    ctx.translate(-size / 2, -size / 2)

    ctx.lineWidth = 2
    ctx.strokeStyle = "rgba(17,24,39,0.35)"
    for (let x = -size; x < size * 2; x += 8) {
      ctx.beginPath()
      ctx.moveTo(x, -size)
      ctx.lineTo(x, size * 2)
      ctx.stroke()
    }

    return ctx.getImageData(0, 0, size, size)
  }
}
