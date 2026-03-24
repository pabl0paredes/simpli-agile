// app/javascript/controllers/sidebar/comparator.js

export function createComparator(controller) {
  function syncAccessibilityBtnVisibility() {
    const accBtn = controller.element.querySelector('.sidebar__layer-btn[data-layer="accessibility"]')
    if (!accBtn) return
    const isDelta = controller._compareMode === "delta" && controller._uiMode === "comparador"
    accBtn.hidden = isDelta
    if (isDelta && accBtn.classList.contains("is-active")) {
      accBtn.classList.remove("is-active")
      if (controller.hasAccessibilityChoicesTarget) controller.accessibilityChoicesTarget.hidden = true
      window.dispatchEvent(new CustomEvent("layer:cleared"))
    }
  }

  return {
    onUIModeChanged(e) {
      const mode = e.detail?.mode
      controller._uiMode = mode

      // ✅ Notificar al mapa
      window.dispatchEvent(new CustomEvent("ui:mode_changed_for_map", {
        detail: { mode }
      }))

      if (mode === "comparador") {
        // ✅ reset UI comparador
        if (controller.hasOpportunitySelectTarget) {
          controller.opportunitySelectTarget.value = "Seleccionar oportunidad..."
          controller.opportunitySelectTarget.disabled = true
        }
        if (controller.hasLayerSectionTarget) controller.layerSectionTarget.hidden = true

        controller.enterComparatorMode()
      } else {
        controller.enterConstructorMode()
      }

      controller.syncScenarioActionsUI()
    },

    onComparisonContextChanged(e) {
      controller._scenarioAId = e.detail?.scenario_a_id
      controller._scenarioBId = e.detail?.scenario_b_id
      controller._compareMode = e.detail?.compare_mode

      controller.syncComparatorGatingUI()
    },

    enterComparatorMode() {
      if (controller.hasRegionSectionTarget) controller.regionSectionTarget.hidden = true
      if (controller.hasMunicipalitySectionTarget) controller.municipalitySectionTarget.hidden = true

      // 🔴 En comparador NO va sección ESCENARIO normal
      if (controller.hasScenarioSectionTarget) controller.scenarioSectionTarget.hidden = true

      if (controller.hasComparatorSectionTarget) controller.comparatorSectionTarget.hidden = false
      if (controller.hasComparatorDividerTarget) controller.comparatorDividerTarget.hidden = false
      if (controller.hasCompareModeSectionTarget) controller.compareModeSectionTarget.hidden = false

      // ❌ comparador no construye ni navega de vuelta
      if (controller.hasMunicipalityBackBtnTarget) controller.municipalityBackBtnTarget.hidden = true
      if (controller.hasLocateSectionTarget) controller.locateSectionTarget.hidden = true
      if (controller.hasLocatorPanelTarget) controller.locatorPanelTarget.hidden = true

      if (controller.hasDeleteScenarioBtnTarget) controller.deleteScenarioBtnTarget.hidden = true
      // ✅ exigir A y B antes de opportunity

      controller._compareMode = "delta"
      const compareBtns = controller.element.querySelectorAll(".compare-modes__btn")
      compareBtns.forEach(b => b.classList.remove("is-active"))

      const deltaBtn = controller.element.querySelector('.compare-modes__btn[data-mode="delta"]')
      if (deltaBtn) deltaBtn.classList.add("is-active")

      syncAccessibilityBtnVisibility()
      controller.syncComparatorGatingUI()


      if (controller._selectedMunicipalityCode) {
        controller.loadScenariosIntoComparatorSelects(controller._selectedMunicipalityCode)
      } else {
        if (controller.hasScenarioASelectTarget) controller.scenarioASelectTarget.disabled = true
        if (controller.hasScenarioBSelectTarget) controller.scenarioBSelectTarget.disabled = true
      }
    },

    enterConstructorMode() {
      if (controller.hasRegionSectionTarget) controller.regionSectionTarget.hidden = false
      if (controller.hasMunicipalitySectionTarget) controller.municipalitySectionTarget.hidden = false
      // Restore back button only if a municipality is currently selected
      if (controller.hasMunicipalityBackBtnTarget) {
        controller.municipalityBackBtnTarget.hidden = !controller._selectedMunicipalityCode
      }

      if (controller.hasScenarioSectionTarget) controller.scenarioSectionTarget.hidden = false

      if (controller.hasComparatorSectionTarget) controller.comparatorSectionTarget.hidden = true
      if (controller.hasComparatorDividerTarget) controller.comparatorDividerTarget.hidden = true
      if (controller.hasCompareModeSectionTarget) controller.compareModeSectionTarget.hidden = true

      // volver a mostrar "Localizar" solo si hay comuna seleccionada
      if (controller.hasLocateSectionTarget) {
        controller.locateSectionTarget.hidden = !controller._selectedMunicipalityCode
      }

      // ✅ volver a constructor: reset de oportunidad y capas
      if (controller.hasOpportunitySelectTarget) {
        controller.opportunitySelectTarget.value = "Seleccionar oportunidad..."
        // si no hay comuna seleccionada, mantenlo disabled como en tu HTML inicial
        controller.opportunitySelectTarget.disabled = !controller._selectedMunicipalityCode
      }

      if (controller.hasLayerSectionTarget) controller.layerSectionTarget.hidden = true

      controller.clearLayerButtonsUI()
      window.dispatchEvent(new CustomEvent("layer:cleared"))

      // Restaurar visibilidad del botón de accesibilidad al salir del comparador
      syncAccessibilityBtnVisibility()

      // Limpia estado comparador para que no “contamine”
      controller._scenarioAId = null
      controller._scenarioBId = null
      const compareBtns = controller.element.querySelectorAll(".compare-modes__btn")
      compareBtns.forEach(b => b.classList.remove("is-active"))

      controller.syncScenarioActionsUI()     // restaura delete según isBase
      if (controller.hasOpportunitySelectTarget) controller.opportunitySelectTarget.disabled = false
    },

    loadScenariosIntoComparatorSelects(munCode) {
      if (!controller.hasScenarioASelectTarget || !controller.hasScenarioBSelectTarget) return

      controller.scenarioASelectTarget.disabled = true
      controller.scenarioBSelectTarget.disabled = true

      fetch(`/scenarios/names?municipality_code=${encodeURIComponent(munCode)}`)
        .then(r => r.json())
        .then(data => {
          // ✅ incluir base SIEMPRE, excluir draft por status (si no viene status, filtramos por nombre)
          const scenarios = data.filter(s => s.name !== "Borrador" && s.name !== "Draft")

          const base = scenarios.find(s => s.is_base)
          const nonBase = scenarios.filter(s => !s.is_base)

          const fill = (sel, placeholder) => {
            sel.innerHTML = `<option>${placeholder}</option>`

            if (base) {
              const opt = document.createElement("option")
              opt.value = base.id
              opt.textContent = base.name
              sel.appendChild(opt)
            }

            nonBase.forEach(s => {
              const opt = document.createElement("option")
              opt.value = s.id
              opt.textContent = s.name
              sel.appendChild(opt)
            })

            sel.disabled = scenarios.length === 0
          }

          fill(controller.scenarioASelectTarget, "Seleccionar escenario A...")
          fill(controller.scenarioBSelectTarget, "Seleccionar escenario B...")

          if (base) {
            controller.scenarioASelectTarget.value = String(base.id)
            controller._scenarioAId = String(base.id)
          }
        })
        .catch(err => {
          console.error("Error cargando escenarios (comparador):", err)
          controller.scenarioASelectTarget.disabled = true
          controller.scenarioBSelectTarget.disabled = true
        })
    },

    scenarioAChanged(e) {
      const id = e.target.value
      if (!id || id.includes("Seleccionar")) return
      controller._scenarioAId = id

      window.dispatchEvent(new CustomEvent("comparison:context_changed", {
        detail: {
          scenario_a_id: controller._scenarioAId,
          scenario_b_id: controller._scenarioBId,
          compare_mode: controller._compareMode
        }
      }))
    },

    scenarioBChanged(e) {
      const id = e.target.value
      if (!id || id.includes("Seleccionar")) return
      controller._scenarioBId = id

      window.dispatchEvent(new CustomEvent("comparison:context_changed", {
        detail: {
          scenario_a_id: controller._scenarioAId,
          scenario_b_id: controller._scenarioBId,
          compare_mode: controller._compareMode
        }
      }))
    },

    compareModeSelected(e) {
      const btn = e.currentTarget
      const mode = btn.dataset.mode

      btn.closest(".compare-modes")
        .querySelectorAll(".compare-modes__btn")
        .forEach(b => b.classList.remove("is-active"))
      btn.classList.add("is-active")

      controller._compareMode = mode
      syncAccessibilityBtnVisibility()

      window.dispatchEvent(new CustomEvent("comparison:context_changed", {
        detail: {
          scenario_a_id: controller._scenarioAId,
          scenario_b_id: controller._scenarioBId,
          compare_mode: controller._compareMode
        }
      }))
    }
  }
}
