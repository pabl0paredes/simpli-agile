// app/javascript/controllers/sidebar/opportunities_layers.js

export function createOpportunitiesLayers(controller) {
  return {
    // -------------------------
    // Métodos (mismos nombres)
    // -------------------------

    loadOpportunitiesIntoSelect() {
      const HOUSING_CODES = ["HD", "HC", "P"]

      const addSeparator = (selector, label) => {
        const sep = document.createElement("option")
        sep.disabled = true
        sep.textContent = label
        selector.appendChild(sep)
      }

      const addOption = (selector, op) => {
        const option = document.createElement("option")
        option.value = op.opportunity_code
        option.textContent = op.name
        option.dataset.category = op.category
        selector.appendChild(option)
      }

      fetch("/opportunities")
        .then(response => response.json())
        .then(data => {
          const selector = controller.opportunitySelectTarget
          selector.innerHTML = "<option>Seleccionar oportunidad...</option>"

          const housing = data.filter(op => HOUSING_CODES.includes(op.opportunity_code))
          const poi = data.filter(op => op.category === "POI" && !HOUSING_CODES.includes(op.opportunity_code))
          const main = data.filter(op => !HOUSING_CODES.includes(op.opportunity_code) && op.category !== "POI")

          if (main.length > 0) {
            addSeparator(selector, "--- Usos de suelo ---")
            main.forEach(op => addOption(selector, op))
          }

          if (poi.length > 0) {
            addSeparator(selector, "--- Puntos de interés ---")
            poi.forEach(op => addOption(selector, op))
          }

          if (housing.length > 0) {
            addSeparator(selector, "--- Viviendas ---")
            housing.forEach(op => addOption(selector, op))
          }
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

      // recordar submodo atractividad si estaba activo
      const prevAttrBtn = controller.hasAttractivityChoicesTarget
        ? controller.attractivityChoicesTarget?.querySelector(".sidebar__subchoice-btn.is-active")
        : null
      const prevAttrMode = prevAttrBtn?.dataset?.mode || null

      // category viene desde el <option selected>
      const selectedOption = e.target.selectedOptions?.[0]
      const category = selectedOption?.dataset?.category

      if (controller._noBaseScenario) {
        if (controller.hasNoDataSectionTarget) controller.noDataSectionTarget.hidden = false
        if (controller.hasLayerSectionTarget) controller.layerSectionTarget.hidden = true
        return
      }

      if (controller.hasNoDataSectionTarget) controller.noDataSectionTarget.hidden = true
      controller.layerSectionTarget.hidden = false
      if (controller.hasAttractivitySectionTarget) controller.attractivitySectionTarget.hidden = false

      const inComparator = controller.hasComparatorSectionTarget && !controller.comparatorSectionTarget.hidden
      if (inComparator) {
        if (controller.hasLocateSectionTarget) controller.locateSectionTarget.hidden = true
      }

      window.dispatchEvent(new CustomEvent("layer:cleared"))
      controller.clearLayerButtonsUI()

      controller.applyOpportunityCategory(category, opportunityCode)

      window.dispatchEvent(new CustomEvent("opportunity:selected", {
        detail: { opportunity_code: opportunityCode, category }
      }))
      controller._selectedOpportunityCode = opportunityCode
      controller._selectedOpportunityCategory = category

      const oppName = e.target.selectedOptions?.[0]?.textContent?.trim()
      controller._api?.trackEvent("opportunity_selected", {
        opportunity_code: opportunityCode,
        opportunity_name: oppName,
        municipality_code: controller._selectedMunicipalityCode
      })

      // restaurar capa anterior si existe; si no, units
      // HC/HD/P no tienen accesibilidad — no restaurar nada, dejar el mapa limpio
      const RESIDENTIAL_CODES = ["HC", "HD", "P"]
      queueMicrotask(() => {
        if (RESIDENTIAL_CODES.includes(opportunityCode)) return

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

        if (!btnToSelect && prevLayer === "attractivity") {
          const candidate = controller.element.querySelector(`.sidebar__layer-btn[data-layer="attractivity"]`)
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
          if (subBtn) subBtn.click()
        }

        if (btnToSelect.dataset.layer === "attractivity" && prevAttrMode) {
          const subBtn = controller.hasAttractivityChoicesTarget
            ? controller.attractivityChoicesTarget?.querySelector(`.sidebar__subchoice-btn[data-mode="${prevAttrMode}"]`)
            : null
          if (subBtn) subBtn.click()
        }
      })
    },

    selectLayer(e) {
      const btn = e.currentTarget
      const metric = btn.dataset.metric
      const normMetric = btn.dataset.normMetric

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

      // Botones de normativa (data-norm-metric)
      if (normMetric) {
        if (isActive) {
          if (!controller._selectedMunicipalityCode || !controller._selectedScenarioId) return
          window.dispatchEvent(new CustomEvent("normative:selected", {
            detail: {
              normMetric,
              municipality_code: controller._selectedMunicipalityCode,
              scenario_id: controller._selectedScenarioId
            }
          }))
        } else {
          window.dispatchEvent(new CustomEvent("layer:cleared"))
        }
        controller.accessibilityChoicesTarget.hidden = true
        controller.accessibilityChoicesTarget
          .querySelectorAll(".sidebar__subchoice-btn")
          .forEach(b => b.classList.remove("is-active"))
        return
      }

      // Solo disparamos evento si quedó activo
      if (isActive && metric) {
        window.dispatchEvent(new CustomEvent("layer:selected", {
          detail: { metric }
        }))
        controller._api?.trackEvent("layer_selected", {
          layer: metric,
          opportunity_code: controller._selectedOpportunityCode,
          municipality_code: controller._selectedMunicipalityCode
        })
      } else if (!isActive) {
        window.dispatchEvent(new CustomEvent("layer:cleared"))
      }

      const isAccessibility = btn.dataset.layer === "accessibility"
      const isAttractivity  = btn.dataset.layer === "attractivity"

      const hideAccChoices = () => {
        controller.accessibilityChoicesTarget.hidden = true
        controller.accessibilityChoicesTarget.querySelectorAll(".sidebar__subchoice-btn").forEach(b => b.classList.remove("is-active"))
      }
      const hideAttrChoices = () => {
        if (!controller.hasAttractivityChoicesTarget) return
        controller.attractivityChoicesTarget.hidden = true
        controller.attractivityChoicesTarget.querySelectorAll(".sidebar__subchoice-btn").forEach(b => b.classList.remove("is-active"))
      }

      if (isAccessibility) {
        controller._selectedLayerType = isActive ? "accessibility" : null
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
      } else if (isAttractivity) {
        controller._selectedLayerType = isActive ? "attractivity" : null
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
        controller._selectedLayerType = null
        hideAccChoices()
      }
    },

    selectAccessibilityMode(e) {
      const mode = e.currentTarget.dataset.mode

      controller.accessibilityChoicesTarget
        .querySelectorAll(".sidebar__subchoice-btn")
        .forEach(b => b.classList.remove("is-active"))
      e.currentTarget.classList.add("is-active")

      const eventName = controller._selectedLayerType === "attractivity"
        ? "attractivity:mode_selected"
        : "accessibility:mode_selected"

      window.dispatchEvent(new CustomEvent(eventName, { detail: { mode } }))
    },

    selectAttractivityMode(e) {
      // Legacy handler kept for safety — delegates to selectAccessibilityMode logic
      this.selectAccessibilityMode(e)
    }
  }
}
