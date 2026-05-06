export class MapSelection {
  constructor(controller) {
    this.controller = controller
    this.map = controller.map
  }

  onPickCellStart = () => {
    this.controller._pickCellMode = true
    this.controller.ensureCellsLayer()
    this.controller.hover.bindCellsHoverTooltip()
    this.bindCellsPickClickOnce()
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

      if (!h3) return

      this.setCellSelected(h3)

      window.dispatchEvent(new CustomEvent("cell:picked", {
        detail: { h3: h3, show_id: showId }
      }))
    })
  }

  setCellSelected(h3) {
    if (this._selectedCellId) {
      this.map.setFeatureState(
        { source: "cells", id: this._selectedCellId },
        { selected: false }
      )
    }

    this._selectedCellId = h3

    this.map.setFeatureState(
      { source: "cells", id: h3 },
      { selected: true }
    )
  }

  clearCellSelected() {
    if (!this._selectedCellId) return

    this.map.setFeatureState(
      { source: "cells", id: this._selectedCellId },
      { selected: false }
    )

    this._selectedCellId = null
  }
}
