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
    if params[:region_code]
      municipalities = Municipality.where(region_code: params[:region_code]).map { |municipality| {
        name: municipality.name, municipality_code: municipality.municipality_code
      } }
    else
      municipalities = Municipality.select(:name, :municipality_code).all
    end

    render json: municipalities
  end

  def focus
    mun = Municipality.select(:name, :region_code, :municipality_code, :centroid, :zoom, :geometry)
      .find_by!(municipality_code: params[:municipality_code])

    render json: {
      municipality_code: mun.municipality_code,
      region_code: mun.region_code,
      name: mun.name,
      zoom: mun.zoom,
      # Asumiendo centroid es un POINT (PostGIS) en SRID 4326
      centroid: [mun.centroid.x, mun.centroid.y], # [lng, lat]
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

end
