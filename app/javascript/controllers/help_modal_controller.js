import { Controller } from "@hotwired/stimulus"
import { trackEvent } from "controllers/sidebar/api"

export default class extends Controller {
  static targets = ["tab", "pane"]

  connect() {
    this._onOpen = () => this.open()
    window.addEventListener("help:open", this._onOpen)
    document.addEventListener("keydown", this._onKeydown)
  }

  disconnect() {
    window.removeEventListener("help:open", this._onOpen)
    document.removeEventListener("keydown", this._onKeydown)
  }

  open() {
    this.element.hidden = false
    document.body.style.overflow = "hidden"
    trackEvent("helper_opened")
  }

  faqToggled(e) {
    if (!e.target.open) return
    const question = e.target.querySelector("summary")?.textContent?.trim()
    trackEvent("helper_question_opened", { question })
  }

  close() {
    this.element.hidden = true
    document.body.style.overflow = ""
  }

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.tabTargets.forEach(t => t.classList.toggle("is-active", t.dataset.tab === tab))
    this.paneTargets.forEach(p => { p.hidden = p.dataset.pane !== tab })
  }

  _onKeydown = (e) => {
    if (e.key === "Escape" && !this.element.hidden) this.close()
  }
}
