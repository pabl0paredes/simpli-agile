class MunicipalitiesController < ApplicationController
  before_action :verify_data_request!, only: [:focus, :co2]

  def index
    region_code = params[:region_code].to_i
    sql = <<~SQL
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(ST_Simplify(geometry, 0.003))::json,
            'properties', json_build_object(
              'municipality_code', municipality_code,
              'region_code', region_code,
              'name', name
            )
          )
        ), '[]'::json)
      ) AS geojson
      FROM municipalities
      WHERE region_code = ?
    SQL

    geojson = ActiveRecord::Base.connection.select_value(
      ApplicationRecord.sanitize_sql_array([sql, region_code])
    )
    render plain: geojson, content_type: "application/json"
  end

  def names
    cache_key = "municipalities:names:#{params[:region_code] || 'all'}"
    municipalities = Rails.cache.fetch(cache_key, expires_in: 1.day) do
      scope = params[:region_code] ?
        Municipality.where(region_code: params[:region_code]) :
        Municipality.all
      scope.select(:name, :municipality_code, :has_normative).order(:name).to_a
    end
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
    base = Scenario.find_by(user_id: system_user&.id, municipality_code: mun_code)
    render json: { scenario_id: base&.id }
  end

  def access
    municipality_code = params.require(:municipality_code).to_i
    features = if user_signed_in?
      current_user.availabilities.where(municipality_code: municipality_code).pluck(:feature)
    else
      []
    end
    render json: { has_access: features.any?, features: features }
  end

  def co2
    municipality_code = params.require(:municipality_code).to_i
    scenario_id       = params.require(:scenario_id).to_i

    result = Co2Calculator.new(
      municipality_code: municipality_code,
      scenario_id:       scenario_id
    ).call

    render json: {
      co2_tons:        result&.dig(:co2_tons)&.round(2),
      avg_distance_km: result&.dig(:avg_distance_km)&.round(2),
      trip_histogram:  result&.dig(:trip_histogram) || []
    }
  end

end
