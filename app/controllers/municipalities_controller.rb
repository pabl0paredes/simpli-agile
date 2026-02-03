class MunicipalitiesController < ApplicationController
  def index
    municipalities = Municipality.select(:id, :name, :region_code, :geometry).where(region_code: params[:region_code])

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
    if params[:region_code]
      municipalities = Municipality.where(region_code: params[:region_code]).map { |municipality| {
        id: municipality.id, name: municipality.name, municipality_code: municipality.municipality_code
      } }
    else
      municipalities = Municipality.select(:id, :name, :municipality_code).all
    end

    render json: municipalities
  end

  def focus
    mun = Municipality.select(:id, :name, :region_code, :municipality_code, :centroid, :zoom).find_by!(municipality_code: params[:municipality_code])

    render json: {
      municipality_code: mun.municipality_code,
      region_code: mun.region_code,
      name: mun.name,
      zoom: mun.zoom,
      # Asumiendo centroid es un POINT (PostGIS) en SRID 4326
      centroid: [mun.centroid.x, mun.centroid.y] # [lng, lat]
    }
  end
end
