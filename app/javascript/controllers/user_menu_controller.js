import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["dropdown", "modal"]
  static values = { open: Boolean }

  connect() {
    console.log("✅ user-menu conectado")
    this._onDocClick = (e) => {
      if (!this.element.contains(e.target)) {
        this.closeMenu()
      }
    }
    document.addEventListener("click", this._onDocClick)
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
    // Cierra dropdown al abrir modal
    this.closeMenu()

    // Deja que Turbo navegue el link dentro del frame auth_modal_frame
    // y abre el modal inmediatamente
    this.modalTarget.hidden = false
    document.body.classList.add("modal-open")
  }

  closeModal() {
    this.modalTarget.hidden = true
    document.body.classList.remove("modal-open")

    // Opcional: limpiar el contenido del frame
    const frame = document.getElementById("auth_modal_frame")
    if (frame) frame.innerHTML = ""
  }
}
