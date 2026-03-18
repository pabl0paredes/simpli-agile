// app/javascript/controllers/sidebar/opportunities_layers.js

export function createOpportunitiesLayers(controller) {
  return {
    // -------------------------
    // Métodos (mismos nombres)
    // -------------------------

    loadOpportunitiesIntoSelect() {
      fetch("/opportunities")
        .then(response => response.json())
        .then(data => {
          const selector = controller.opportunitySelectTarget
          selector.innerHTML = "<option>Seleccionar oportunidad...</option>"

          data.forEach(opportunity => {
            const option = document.createElement("option")
            option.value = opportunity.opportunity_code
            option.textContent = opportunity.name
            // ✅ Guardar category en el DOM
            option.dataset.category = opportunity.category
            selector.appendChild(option)
          })
        })
        .catch(error => console.error("Error al cargar los usos:", error))
    },

    opportunityChanged(e) {
      const opportunityCode = e.target.value
      if (!opportunityCode || opportunityCode.includes("Seleccionar")) return

      // ✅ recordar capa activa anterior (antes de limpiar)
      const prevActiveBtn = controller.element.querySelector(".sidebar__layer-btn.is-active")
      const prevMetric = prevActiveBtn?.dataset?.metric || null
      const prevLayer = prevActiveBtn?.dataset?.layer || null

      // ✅ recordar submodo accesibilidad (walk/car) si estaba activo
      const prevAccBtn = controller.accessibilityChoicesTarget
        ?.querySelector(".sidebar__subchoice-btn.is-active")
      const prevAccMode = prevAccBtn?.dataset?.mode || null

      // category viene desde el <option selected>
      const selectedOption = e.target.selectedOptions?.[0]
      const category = selectedOption?.dataset?.category

      controller.layerSectionTarget.hidden = false

      const inComparator = controller.hasComparatorSectionTarget && !controller.comparatorSectionTarget.hidden
      if (inComparator) {
        if (controller.hasLocateSectionTarget) controller.locateSectionTarget.hidden = true
      }

      window.dispatchEvent(new CustomEvent("layer:cleared"))
      controller.clearLayerButtonsUI()

      controller.applyOpportunityCategory(category)

      window.dispatchEvent(new CustomEvent("opportunity:selected", {
        detail: { opportunity_code: opportunityCode, category }
      }))
      controller._selectedOpportunityCode = opportunityCode
      controller._selectedOpportunityCategory = category

      // ✅ restaurar capa anterior si existe; si no, units
      queueMicrotask(() => {
        const isUsable = (btn) => btn && !btn.hidden

        let btnToSelect = null

        if (prevMetric) {
          const candidate = controller.element.querySelector(`.sidebar__layer-btn[data-metric="${prevMetric}"]`)
          if (isUsable(candidate)) btnToSelect = candidate
        }

        if (!btnToSelect && prevLayer === "accessibility") {
          const candidate = controller.element.querySelector(`.sidebar__layer-btn[data-layer="accessibility"]`)
          if (isUsable(candidate)) btnToSelect = candidate
        }

        if (!btnToSelect) {
          const unitsBtn = controller.element.querySelector(`.sidebar__layer-btn[data-metric="units"]`)
          if (isUsable(unitsBtn)) btnToSelect = unitsBtn
        }

        if (!btnToSelect) return

        // activar capa principal
        if (!btnToSelect.classList.contains("is-active")) btnToSelect.click()

        // ✅ si era accesibilidad y había modo anterior, re-aplicar modo y disparar evento
        if (btnToSelect.dataset.layer === "accessibility" && prevAccMode) {
          const subBtn = controller.accessibilityChoicesTarget
            ?.querySelector(`.sidebar__subchoice-btn[data-mode="${prevAccMode}"]`)

          if (subBtn) subBtn.click() // reutiliza selectAccessibilityMode y dispara accessibility:mode_selected
        }
      })
    },

    selectLayer(e) {
      const btn = e.currentTarget
      const metric = btn.dataset.metric

      const isComparator = (controller._uiMode === "comparador") // o como lo guardes tú
      const isDelta = (controller._compareMode === "delta")



      // toggle devuelve true si quedó activo
      const isActive = btn.classList.toggle("is-active")

      // quitar active de los otros botones principales
      const allButtons = controller.element.querySelectorAll(".sidebar__layer-btn")
      allButtons.forEach(otherBtn => {
        if (otherBtn !== btn) otherBtn.classList.remove("is-active")
      })

      if (isComparator && isDelta && metric) {
        // ✅ prerequisites (idealmente ya estaban validados por UI, pero igual se protege acá)
        if (!controller._selectedMunicipalityCode) return
        if (!controller._selectedOpportunityCode) return
        if (!controller._scenarioAId || !controller._scenarioBId) return

        window.dispatchEvent(new CustomEvent("comparison:delta_selected", {
          detail: {
            scenario_a_id: controller._scenarioAId,
            scenario_b_id: controller._scenarioBId,
            opportunity_code: controller._selectedOpportunityCode,
            metric // "surface" | "units"
          }
        }))

        return // 👈 importante: no sigas con flujo normal "layer:selected"
      }

      // Solo disparamos evento si quedó activo
      if (isActive && metric) {
        window.dispatchEvent(new CustomEvent("layer:selected", {
          detail: { metric }
        }))
      } else if (!isActive) {
        window.dispatchEvent(new CustomEvent("layer:cleared"))
      }

      // 👇 Mostrar/ocultar sub-botones solo si es Accesibilidad
      const isAccessibility = btn.dataset.layer === "accessibility"

      if (isAccessibility) {
        controller.accessibilityChoicesTarget.hidden = !isActive

        if (isActive) {
          const walkBtn = controller.accessibilityChoicesTarget
            ?.querySelector('.sidebar__subchoice-btn[data-mode="walk"]')

          if (walkBtn) walkBtn.click()
        } else {
          controller.accessibilityChoicesTarget
            .querySelectorAll(".sidebar__subchoice-btn")
            .forEach(b => b.classList.remove("is-active"))
        }
      } else {
        controller.accessibilityChoicesTarget.hidden = true

        controller.accessibilityChoicesTarget
          .querySelectorAll(".sidebar__subchoice-btn")
          .forEach(b => b.classList.remove("is-active"))
      }
    },

    selectAccessibilityMode(e) {
      const mode = e.currentTarget.dataset.mode // "walk" o "car"

      // UI: toggle exclusivo
      controller.accessibilityChoicesTarget
        .querySelectorAll(".sidebar__subchoice-btn")
        .forEach(b => b.classList.remove("is-active"))
      e.currentTarget.classList.add("is-active")

      window.dispatchEvent(new CustomEvent("accessibility:mode_selected", {
        detail: { mode }
      }))
    }
  }
}
