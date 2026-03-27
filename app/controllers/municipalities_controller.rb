class MunicipalitiesController < ApplicationController
  def index
    municipalities = Municipality.select(
      :municipality_code, :name, :region_code, :geometry
    ).where(region_code: params[:region_code])

    # Iterar sobre las regiones y convertirlas a GeoJSON
    features = municipalities.map { |mun| mun.to_geojson }

    # Convertirlo en un FeatureCollection
    geojson = {
      type: "FeatureCollection",
      features: features
    }

    render json: geojson
  end

  def names
    scope = params[:region_code] ?
      Municipality.where(region_code: params[:region_code]) :
      Municipality.all
    municipalities = scope.select(:name, :municipality_code).order(:name)
    render json: municipalities
  end

  def focus
    mun = Municipality.select(:name, :region_code, :municipality_code, :centroid, :zoom, :geometry, :study_area)
      .find_by!(municipality_code: params[:municipality_code])

    study_area_feature = mun.study_area ? {
      type: "Feature",
      geometry: RGeo::GeoJSON.encode(mun.study_area),
      properties: { municipality_code: mun.municipality_code }
    } : nil

    render json: {
      municipality_code: mun.municipality_code,
      region_code: mun.region_code,
      name: mun.name,
      zoom: mun.zoom,
      centroid: [mun.centroid.x, mun.centroid.y],
      study_area: study_area_feature,
      geometry: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: RGeo::GeoJSON.encode(mun.geometry),
            properties: {
              municipality_code: mun.municipality_code,
              name: mun.name
            }
          }
        ]
      }
    }
  end

  def base_scenario
    mun_code = params[:municipality_code]
    system_user = User.find_by(email: "system@simpli.cl")
    base = Scenario.find_by(user_id: system_user&.id, municipality_code: mun_code)
    render json: { scenario_id: base&.id }
  end

  def access
    municipality_code = params.require(:municipality_code).to_i
    has_access = user_signed_in? && current_user.availabilities.exists?(municipality_code: municipality_code)
    render json: { has_access: has_access }
  end

end
