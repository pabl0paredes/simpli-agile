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

      controller.opportunitySelectTarget.disabled = false
      controller.locateSectionTarget.hidden = false
      controller._selectedMunicipalityCode = munCode

      if (controller.hasModeToggleTarget) {
        controller.modeToggleTarget.hidden = false
      }

      // Ocultar el hint de oportunidad seleccionada
      const opportunityHint =
        controller.opportunitySelectTarget
          .closest('.sidebar__section')
          .querySelector('.sidebar__hint')
      if (opportunityHint) opportunityHint.style.display = 'none'

      window.dispatchEvent(new CustomEvent("municipality:selected", {
        detail: { municipality_code: munCode }
      }))

      if (controller.hasScenarioSelectTarget) {
        controller.scenarioSectionTarget.hidden = false
        controller.loadScenariosIntoSelect(munCode)
      }
    }
  }
}
