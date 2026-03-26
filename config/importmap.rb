# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin "mapbox-gl-compare", to: "https://esm.sh/mapbox-gl-compare@0.4.2"
pin_all_from "app/javascript/controllers", under: "controllers"
