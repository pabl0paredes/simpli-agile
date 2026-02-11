class RegionsController < ApplicationController
  def index
    regions = Region.select(:name, :region_code, :geometry).all

    # Iterar sobre las regiones y convertirlas a GeoJSON
    features = regions.map { |region| region.to_geojson }

    # Convertirlo en un FeatureCollection
    geojson = {
      type: "FeatureCollection",
      features: features
    }

    render json: geojson
  end

  def names
    regions = Region.select(:name, :region_code).all
    render json: regions
  end

  def focus
    region = Region.select(:name, :region_code, :centroid, :zoom).find_by!(region_code: params[:region_code])

    render json: {
      region_code: region.region_code,
      name: region.name,
      zoom: region.zoom,
      # Asumiendo centroid es un POINT (PostGIS) en SRID 4326
      centroid: [region.centroid.x, region.centroid.y] # [lng, lat]
    }
  end
end
