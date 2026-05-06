// app/javascript/controllers/sidebar/regions_municipalities.js

export function createRegionsMunicipalities(controller) {
  return {
    // -------------------------
    // Métodos (mismos nombres)
    // -------------------------

    onRegionContextResolved(e) {
      const regionCode = e.detail.region_code
      if (!regionCode) return

      // Store resolved region code independently — the select may not have loaded yet
      controller._resolvedRegionCode = regionCode

      // Try to set the region select value (may be a no-op if regions aren't loaded yet)
      if (controller.hasRegionSelectTarget) {
        controller.regionSelectTarget.value = regionCode
      }

      // Set the region back button text (keep hidden — municipality is still active)
      if (controller.hasRegionBackBtnTarget) {
        const option = Array.from(controller.regionSelectTarget?.options || [])
          .find(o => o.value === regionCode)
        const regionName = option?.textContent?.trim()
        controller.regionBackBtnTarget.textContent = `← ${regionName || "Volver a seleccionar región"}`
        // Keep hidden — will be shown only when user clicks back on municipality
      }
    },

    loadRegionsIntoSelect() {
      fetch('/regions/names')
        .then(response => response.json())
        .then(data => {
          const selector = controller.regionSelectTarget

          selector.innerHTML = "<option>Seleccionar región...</option>"

          // TEMPORAL: solo mostrar La Araucanía
          const filteredRegions = data.filter(r => String(r.region_code) === "9")
          filteredRegions.forEach(region => {
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

    loadMunicipalitiesIntoSelect(regionCode = null, { autoSelect = true } = {}) {
      let url = '/municipalities/names'
      if (regionCode) {
        url += `?region_code=${regionCode}`
      }

      // Lock UI while names are loading
      if (regionCode) {
        const sel = controller.municipalitySelectTarget
        sel.innerHTML = "<option>Cargando comunas...</option>"
        sel.disabled = true
        if (controller.hasRegionBackBtnTarget) controller.regionBackBtnTarget.disabled = true
      }

      fetch(url)
        .then(response => response.json())
        .then(data => {
          const selector = controller.municipalitySelectTarget
          const preSelected = selector.value &&
            !selector.value.includes("Seleccionar") &&
            !selector.value.includes("Cargando")
            ? selector.value : null
          selector.innerHTML = "<option>Seleccionar comuna...</option>"

          // TEMPORAL: solo mostrar Pucón
          const filteredMunicipalities = data.filter(m => String(m.municipality_code) === "9115")
          filteredMunicipalities.forEach(municipality => {
            const option = document.createElement("option")
            option.value = municipality.municipality_code
            option.textContent = municipality.name
            option.dataset.hasNormative = municipality.has_normative ? "true" : "false"
            selector.appendChild(option)
          })

          // Restore pre-selected value if sidebar was pre-rendered in municipality state
          if (preSelected) selector.value = preSelected

          // Unlock dropdown as soon as names are ready (don't wait for map)
          if (regionCode) {
            selector.disabled = false
            if (controller.hasRegionBackBtnTarget) controller.regionBackBtnTarget.disabled = false
          }

          // Auto-select default municipality on initial full load (no region filter)
          if (!regionCode && autoSelect) {
            const defaultCode = controller.defaultMunicipalityValue
            if (defaultCode) {
              selector.value = defaultCode
              if (selector.value === defaultCode) {
                if (controller._mapReady || window._mapReady) {
                  controller._instantMunicipalityLoad = true
                  controller.municipalityChanged({ target: selector })
                } else {
                  controller._pendingDefaultMunicipality = defaultCode
                }
              }
            }
          }
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
      controller._resolvedRegionCode = null

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
      controller.loadMunicipalitiesIntoSelect(null, { autoSelect: false })

      // Hide mode toggle (no municipality selected)
      if (controller.hasModeToggleTarget) controller.modeToggleTarget.hidden = true

      // Reset sidebar UI state
      controller._selectedMunicipalityCode = null
      controller.resetAfterMunicipalityChange()

      window.dispatchEvent(new CustomEvent("municipality:cleared"))
      window.dispatchEvent(new CustomEvent("region:cleared"))
    },

    clearMunicipality() {
      // Cerrar localizador si está abierto
      controller.closeLocator()

      // Restore municipality select (reset to placeholder)
      if (controller.hasMunicipalitySelectWrapTarget) controller.municipalitySelectWrapTarget.hidden = false
      if (controller.hasMunicipalityBackBtnTarget) controller.municipalityBackBtnTarget.hidden = true
      if (controller.hasMunicipalitySelectTarget) controller.municipalitySelectTarget.value = ""

      // If a region was selected via UI (or resolved via context), show its back button.
      // Use _resolvedRegionCode as fallback in case the select hadn't loaded when
      // onRegionContextResolved fired (e.g. page refresh with default municipality).
      const regionValue = controller.regionSelectTarget?.value
      const regionIsActive = (regionValue && !regionValue.includes("Seleccionar")) ||
                             !!controller._resolvedRegionCode

      if (regionIsActive) {
        // Hide the region select, show the back button
        if (controller.hasRegionSelectWrapTarget) controller.regionSelectWrapTarget.hidden = true
        // Ensure select value is set (may have failed earlier if regions weren't loaded)
        if (controller._resolvedRegionCode && controller.hasRegionSelectTarget) {
          controller.regionSelectTarget.value = controller._resolvedRegionCode
        }
        // Update back button text now that regions are likely loaded
        if (controller.hasRegionBackBtnTarget) {
          const option = Array.from(controller.regionSelectTarget?.options || [])
            .find(o => o.value === String(controller._resolvedRegionCode))
          const regionName = option?.textContent?.trim()
          if (regionName) {
            controller.regionBackBtnTarget.textContent = `← ${regionName}`
          }
          controller.regionBackBtnTarget.hidden = false
        }
      } else {
        if (controller.hasRegionSelectWrapTarget) controller.regionSelectWrapTarget.hidden = false
      }

      // Clear municipality before toggling mode so enterConstructorMode sees null
      controller._selectedMunicipalityCode = null

      // If in comparator mode, switch back to constructor
      if (controller._uiMode === "comparador") {
        const constructorBtn = document.querySelector('.mode-toggle__btn[data-mode="constructor"]')
        if (constructorBtn) constructorBtn.click()
      }

      // Hide mode toggle (no municipality selected)
      if (controller.hasModeToggleTarget) controller.modeToggleTarget.hidden = true

      // Reset sidebar UI state
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
      const selectedOption = controller.municipalitySelectTarget.selectedOptions?.[0]
      controller._municipalityHasNormative = selectedOption?.dataset?.hasNormative === "true"

      const trackedMunName = controller.municipalitySelectTarget.selectedOptions?.[0]?.textContent?.trim()
      controller._api?.trackEvent("municipality_opened", { municipality_code: munCode, municipality_name: trackedMunName })

      window.dispatchEvent(new CustomEvent("municipality:selected", {
        detail: { municipality_code: munCode, instant: !!controller._instantMunicipalityLoad }
      }))
      controller._instantMunicipalityLoad = false

      // Swap municipality select → back button
      const munName = controller.municipalitySelectTarget.selectedOptions?.[0]?.textContent?.trim()
      if (controller.hasMunicipalitySelectWrapTarget) controller.municipalitySelectWrapTarget.hidden = true
      if (controller.hasMunicipalityBackBtnTarget) {
        controller.municipalityBackBtnTarget.textContent = `← ${munName || "Volver a seleccionar comuna"}`
        controller.municipalityBackBtnTarget.hidden = false
      }

      // Hide region back button while a municipality is selected.
      // If no region was selected via UI, also hide the region select wrap.
      if (controller.hasRegionBackBtnTarget) controller.regionBackBtnTarget.hidden = true
      const regionValue = controller.regionSelectTarget?.value
      const regionIsActive = regionValue && !regionValue.includes("Seleccionar")
      if (!regionIsActive && controller.hasRegionSelectWrapTarget) {
        controller.regionSelectWrapTarget.hidden = true
      }

      // Para usuarios sin sesión: mostrar oportunidad directamente y cargar escenario base.
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
        return
      }

      // Para usuarios con sesión: verificar acceso a la comuna antes de mostrar features especiales.
      fetch(`/municipalities/access?municipality_code=${encodeURIComponent(munCode)}`)
        .then(r => r.json())
        .then(data => {
          const dispatchFeatures = (f) => window.dispatchEvent(
            new CustomEvent("municipality:features_loaded", { detail: { features: f } })
          )
          if (data.has_access) {
            controller._hasAccess = true
            controller._features = data.features || []
            dispatchFeatures(controller._features)
            if (controller.hasModeToggleTarget) controller.modeToggleTarget.hidden = false
            controller.scenarioSectionTarget.hidden = false
            controller.loadScenariosIntoSelect(munCode)
          } else {
            // Sin acceso: comportarse igual que un usuario sin sesión
            controller._features = []
            dispatchFeatures([])
            controller._loadGuestMunicipalityView(munCode)
          }
        })
        .catch(() => {
          controller._features = []
          window.dispatchEvent(new CustomEvent("municipality:features_loaded", { detail: { features: [] } }))
          controller._loadGuestMunicipalityView(munCode)
        })
    }
  }
}
