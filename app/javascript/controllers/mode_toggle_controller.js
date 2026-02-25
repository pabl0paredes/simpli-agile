import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["btn"]
  static values = { mode: String }

  connect() {
    // default: constructor si no viene seteado
    if (!this.modeValue) this.modeValue = "constructor"
    this.syncUI()
    this.dispatch()
  }

  select(e) {
    const mode = e.currentTarget.dataset.mode
    if (!mode) return
    if (mode === this.modeValue) return

    this.modeValue = mode
    this.syncUI()
    this.dispatch()
  }

  syncUI() {
    this.btnTargets.forEach(b => {
      b.classList.toggle("is-active", b.dataset.mode === this.modeValue)
    })
  }

  dispatch() {
    window.dispatchEvent(new CustomEvent("ui:mode_changed", {
      detail: { mode: this.modeValue }
    }))
  }
}
