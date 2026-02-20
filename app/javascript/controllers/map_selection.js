export class MapSelection {
  constructor(controller) {
    // controller = instancia de map_controller (para acceder a this.map, ensureCellsLayer, bindCellsHoverTooltip, etc.)
    this.controller = controller
    this.map = controller.map
  }

  onPickCellStart = () => {
    this.controller._pickCellMode = true
    this.controller.ensureCellsLayer()
    this.controller.hover.bindCellsHoverTooltip()   // tooltip show_id
    this.bindCellsPickClickOnce()  // click selecciona celda
  }

  onPickCellCancel = () => {
    this.controller._pickCellMode = false
  }

  bindCellsPickClickOnce() {
    if (this._cellsPickBound) return
    this._cellsPickBound = true

    this.map.on("click", "cells-fill", (e) => {
      if (!this.controller._pickCellMode) return

      const f = e.features && e.features[0]
      if (!f) return

      const h3 = f.properties?.h3
      const showId = f.properties?.show_id

      this.setCellSelected(h3)

      if (!h3) return

      window.dispatchEvent(new CustomEvent("cell:picked", {
        detail: { h3: h3, show_id: showId }
      }))

      // desactivar modo selección
      this._pickCellMode = false
    })
  }

  setCellSelected(h3) {
    // limpiar anterior
    if (this._selectedCellId) {
      this.map.setFeatureState(
        { source: "cells", id: this._selectedCellId },
        { selected: false }
      )
    }

    // set nueva
    this._selectedCellId = h3

    this.map.setFeatureState(
      { source: "cells", id: h3 },
      { selected: true }
    )
  }
}
