// app/javascript/controllers/sidebar/regions_municipalities.js

export function createRegionsMunicipalities(controller) {
  return {
    // -------------------------
    // Métodos (mismos nombres)
    // -------------------------

    loadRegionsIntoSelect() {
      fetch('/regions/names')
        .then(response => response.json())
        .then(data => {
          const selector = controller.regionSelectTarget

          selector.innerHTML = "<option>Seleccionar región...</option>"

          data.forEach(region => {
            const option = document.createElement("option")
            option.value = region.region_code
            option.textContent = region.name
            selector.appendChild(option)
          })
        })
        .catch(error => console.error("Error al cargar las regiones:", error))
    },

    onRegionClicked(e) {
      const regionCode = e.detail.region_code
      if (!regionCode) return

      controller.regionSelectTarget.value = regionCode

      controller.regionChanged({ target: controller.regionSelectTarget })
    },

    loadMunicipalitiesIntoSelect(regionCode = null) {
      let url = '/municipalities/names'
      if (regionCode) {
        url += `?region_code=${regionCode}`
      }

      fetch(url)
        .then(response => response.json())
        .then(data => {
          const selector = controller.municipalitySelectTarget
          selector.innerHTML = "<option>Seleccionar comuna...</option>"

          data.forEach(municipality => {
            const option = document.createElement("option")
            option.value = municipality.municipality_code
            option.textContent = municipality.name
            selector.appendChild(option)
          })
        })
        .catch(error => console.error("Error al cargar las comunas:", error))
    },

    onMunicipalityClicked(e) {
      const munCode = e.detail.municipality_code
      if (!munCode) return

      controller.municipalitySelectTarget.value = munCode

      controller.municipalityChanged({ target: controller.municipalitySelectTarget })
    },

    regionChanged(e) {
      const regionCode = e.target.value
      controller.loadMunicipalitiesIntoSelect(regionCode)

      if (!regionCode || regionCode.includes("Seleccionar")) return

      window.dispatchEvent(new CustomEvent("region:selected", {
        detail: { region_code: regionCode }
      }))

      controller.municipalitySelectTarget.value = ""
      window.dispatchEvent(new CustomEvent("municipality:cleared"))

      // Swap select → back button
      const regionName = controller.regionSelectTarget.selectedOptions?.[0]?.textContent?.trim()
      if (controller.hasRegionSelectWrapTarget) controller.regionSelectWrapTarget.hidden = true
      if (controller.hasRegionBackBtnTarget) {
        controller.regionBackBtnTarget.textContent = `← ${regionName || "Volver a seleccionar región"}`
        controller.regionBackBtnTarget.hidden = false
      }
    },

    clearRegion() {
      // Swap back button → select
      if (controller.hasRegionSelectWrapTarget) controller.regionSelectWrapTarget.hidden = false
      if (controller.hasRegionBackBtnTarget) controller.regionBackBtnTarget.hidden = true

      // Reset region select
      if (controller.hasRegionSelectTarget) {
        controller.regionSelectTarget.value = "Seleccionar región..."
      }

      // Reset municipality section to initial state
      if (controller.hasMunicipalitySelectWrapTarget) controller.municipalitySelectWrapTarget.hidden = false
      if (controller.hasMunicipalityBackBtnTarget) controller.municipalityBackBtnTarget.hidden = true
      if (controller.hasMunicipalitySelectTarget) {
        controller.municipalitySelectTarget.innerHTML = "<option>Seleccionar comuna...</option>"
      }

      // Reset sidebar UI state
      controller._selectedMunicipalityCode = null
      controller.resetAfterMunicipalityChange()

      window.dispatchEvent(new CustomEvent("municipality:cleared"))
      window.dispatchEvent(new CustomEvent("region:cleared"))
    },

    clearMunicipality() {
      // Cerrar localizador si está abierto
      controller.closeLocator()

      // Swap back button → select
      if (controller.hasMunicipalitySelectWrapTarget) controller.municipalitySelectWrapTarget.hidden = false
      if (controller.hasMunicipalityBackBtnTarget) controller.municipalityBackBtnTarget.hidden = true

      // Region back button reappears
      if (controller.hasRegionBackBtnTarget) controller.regionBackBtnTarget.hidden = false

      // Reset sidebar UI state
      controller._selectedMunicipalityCode = null
      controller.resetAfterMunicipalityChange()

      window.dispatchEvent(new CustomEvent("municipality:cleared"))
      window.dispatchEvent(new CustomEvent("municipality:back"))
    },

    municipalityChanged(e) {
      const munCode = e.target.value
      if (!munCode || munCode.includes("Seleccionar")) {
        controller.resetAfterMunicipalityChange()
        window.dispatchEvent(new CustomEvent("municipality:cleared"))
        return
      }

      // ✅ Reset completo cada vez que cambia comuna (aunque venga una válida)
      controller.resetAfterMunicipalityChange()

      controller._selectedMunicipalityCode = munCode

      // Para usuarios sin sesión (sin selector de escenario), mostrar oportunidad directamente
      // y cargar el escenario base de la comuna para poder mostrar celdas.
      // Para usuarios con sesión, la oportunidad/locator se muestran en syncScenarioActionsUI()
      // una vez que haya un escenario válido seleccionado.
      if (!controller.hasScenarioSelectTarget) {
        controller.opportunitySelectTarget.disabled = false
        if (controller.hasOpportunitySectionTarget) controller.opportunitySectionTarget.hidden = false

        fetch(`/municipalities/base_scenario?municipality_code=${encodeURIComponent(munCode)}`)
          .then(r => r.json())
          .then(data => {
            if (data.scenario_id) {
              controller._selectedScenarioId = String(data.scenario_id)
              controller._noBaseScenario = false
              window.dispatchEvent(new CustomEvent("scenario:selected", {
                detail: { scenario_id: String(data.scenario_id), status: "base" }
              }))
            } else {
              controller._selectedScenarioId = null
              controller._noBaseScenario = true
            }
          })
          .catch(() => {
            controller._selectedScenarioId = null
            controller._noBaseScenario = true
          })
      }

      if (controller.hasModeToggleTarget) {
        controller.modeToggleTarget.hidden = false
      }

      window.dispatchEvent(new CustomEvent("municipality:selected", {
        detail: { municipality_code: munCode }
      }))

      // Swap select → back button
      const munName = controller.municipalitySelectTarget.selectedOptions?.[0]?.textContent?.trim()
      if (controller.hasMunicipalitySelectWrapTarget) controller.municipalitySelectWrapTarget.hidden = true
      if (controller.hasMunicipalityBackBtnTarget) {
        controller.municipalityBackBtnTarget.textContent = `← ${munName || "Volver a seleccionar comuna"}`
        controller.municipalityBackBtnTarget.hidden = false
      }

      // Hide region back button while a municipality is selected
      if (controller.hasRegionBackBtnTarget) controller.regionBackBtnTarget.hidden = true

      if (controller.hasScenarioSelectTarget) {
        controller.scenarioSectionTarget.hidden = false
        controller.loadScenariosIntoSelect(munCode)
      }
    }
  }
}
