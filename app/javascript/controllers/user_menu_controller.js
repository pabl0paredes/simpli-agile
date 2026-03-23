import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["dropdown", "modal", "municipalitySelect"]
  static values = { open: Boolean, defaultMunicipality: String }

  connect() {
    this._onDocClick = (e) => {
      if (!this.element.contains(e.target)) this.closeMenu()
    }
    document.addEventListener("click", this._onDocClick)

    if (this.hasMunicipalitySelectTarget) {
      this._loadMunicipalities()
    }
  }

  disconnect() {
    document.removeEventListener("click", this._onDocClick)
  }

  toggleMenu(e) {
    e.preventDefault()
    this.openValue ? this.closeMenu() : this.openMenu()
  }

  openMenu() {
    this.openValue = true
    this.dropdownTarget.hidden = false
  }

  closeMenu() {
    this.openValue = false
    if (this.hasDropdownTarget) this.dropdownTarget.hidden = true
  }

  openModal(e) {
    this.closeMenu()
    this.modalTarget.hidden = false
    document.body.classList.add("modal-open")
  }

  closeModal() {
    this.modalTarget.hidden = true
    document.body.classList.remove("modal-open")
    const frame = document.getElementById("auth_modal_frame")
    if (frame) frame.innerHTML = ""
  }

  saveDefaultMunicipality() {
    const munCode = this.municipalitySelectTarget.value

    fetch("/users/default_municipality", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content
      },
      body: JSON.stringify({ municipality_code: munCode || null })
    })
      .then(r => {
        if (!r.ok) r.text().then(t => console.error("Error guardando comuna:", r.status, t))
        return r
      })
      .catch(err => console.error("Error guardando comuna por defecto:", err))
  }

  _loadMunicipalities() {
    fetch("/municipalities/names")
      .then(r => r.json())
      .then(data => {
        const select = this.municipalitySelectTarget
        data.forEach(m => {
          const opt = document.createElement("option")
          opt.value = m.municipality_code
          opt.textContent = m.name
          select.appendChild(opt)
        })
        select.value = this.defaultMunicipalityValue || ""
      })
      .catch(err => console.error("Error cargando comunas:", err))
  }
}
